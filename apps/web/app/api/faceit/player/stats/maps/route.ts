import { unstable_cache } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"
import { getFaceitMatchStats } from "@/lib/faceit-match-stats"
import type { FaceitMapStats, FaceitStatsRange } from "@/lib/faceit-types"

const HISTORY_PAGE_SIZE = 100
const MATCH_STATS_CONCURRENCY = 5
const RATE_LIMIT_RETRIES = 3
const MAP_STATS_CACHE_SECONDS = 15 * 60

type HistoryMatch = {
  match_id: string
  finished_at?: number
  results?: {
    winner?: string
    score?: Record<string, string | number>
  }
  teams?: Record<string, { team_id?: string }>
}

type FaceitPlayerStats = {
  segments?: Array<{
    type?: string
    label?: string
    stats?: Record<string, string | number>
  }>
}

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function numericValue(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getMapName(
  match: Awaited<ReturnType<typeof getFaceitMatchStats>>
) {
  for (const round of match.rounds ?? []) {
    const map = Object.entries(round.round_stats ?? {}).find(
      ([key]) => key.trim().toLowerCase().replace(/[_\s]/g, "") === "map"
    )?.[1]

    if (typeof map === "string" && map.trim()) {
      return map.trim()
    }
  }

  return null
}

function getPlayerTeam(
  match: Awaited<ReturnType<typeof getFaceitMatchStats>>,
  playerId: string
) {
  for (const round of match.rounds ?? []) {
    for (const [key, team] of Object.entries(round.teams ?? {})) {
      if (team.players?.some((player) => player.player_id === playerId)) {
        return { key, id: team.team_id }
      }
    }
  }

  return null
}

function getWinResult(match: HistoryMatch, playerTeam: { key: string; id?: string }) {
  const playerTeamIds = new Set(
    [playerTeam.key, playerTeam.id]
      .map(normalize)
      .filter((value): value is string => value !== undefined)
  )
  const historyTeam = Object.entries(match.teams ?? {}).find(
    ([key, team]) =>
      playerTeamIds.has(normalize(key) ?? "") ||
      playerTeamIds.has(normalize(team.team_id) ?? "")
  )

  if (historyTeam) {
    playerTeamIds.add(normalize(historyTeam[0]) ?? "")
    playerTeamIds.add(normalize(historyTeam[1].team_id) ?? "")
  }
  playerTeamIds.delete("")

  const winner = normalize(match.results?.winner)
  if (winner) {
    if (playerTeamIds.has(winner)) {
      return true
    }

    const knownTeamIds = new Set(
      Object.entries(match.teams ?? {}).flatMap(([key, team]) =>
        [key, team.team_id]
          .map(normalize)
          .filter((value): value is string => value !== undefined)
      )
    )
    if (knownTeamIds.has(winner)) {
      return false
    }
  }

  if (match.results?.score && historyTeam) {
    const teamKeys = new Set([...playerTeamIds, normalize(historyTeam[0]) ?? ""])
    const playerScore = Object.entries(match.results.score).find(([key]) =>
      teamKeys.has(normalize(key) ?? "")
    )
    const opponentScores = Object.entries(match.results.score)
      .filter(([key]) => !teamKeys.has(normalize(key) ?? ""))
      .map(([, score]) => numericValue(score))
      .filter((score): score is number => score !== null)
    const ownScore =
      playerScore === undefined ? null : numericValue(playerScore[1])

    if (ownScore !== null && opponentScores.length > 0) {
      const opponentScore = Math.max(...opponentScores)
      return ownScore === opponentScore ? null : ownScore > opponentScore
    }
  }

  return null
}

function normalizeMapName(map: string) {
  const normalized = map
    .trim()
    .toLowerCase()
    .replace(/^de[_\s-]?/, "")
    .replace(/[^a-z0-9]/g, "")

  return normalized === "dustii" ? "dust2" : normalized
}

function formatMapName(map: string) {
  const normalized = map.trim().replace(/^de[_\s-]?/i, "").replace(/[_-]+/g, " ")
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toMapStats(
  mapResults: Map<string, { map: string; matches: number; wins: number }>
): FaceitMapStats[] {
  return [...mapResults.values()]
    .map(({ map, matches, wins }) => ({
      map,
      matches,
      wins,
      winRate: (wins / matches) * 100,
    }))
    .sort((first, second) => second.matches - first.matches)
}

async function faceitFetchWithRetry<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await faceitFetch<T>(path)
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== "FACEIT_RATE_LIMIT" ||
        attempt >= RATE_LIMIT_RETRIES
      ) {
        throw error
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 500 * 2 ** attempt)
      )
    }
  }
}

async function calculateLifetimeMapStats(
  playerId: string
): Promise<FaceitMapStats[]> {
  const playerStats = await faceitFetchWithRetry<FaceitPlayerStats>(
    `/players/${encodeURIComponent(playerId)}/stats/cs2`
  )
  const mapResults = new Map<
    string,
    { map: string; matches: number; wins: number }
  >()

  for (const segment of playerStats.segments ?? []) {
    if (
      segment.type?.toLowerCase() !== "map" ||
      !segment.label ||
      !segment.stats
    ) {
      continue
    }

    const matches = numericValue(segment.stats.Matches)
    const rawWins = numericValue(segment.stats.Wins)
    const winRate = numericValue(segment.stats["Win Rate %"])
    if (matches === null || matches <= 0) {
      continue
    }

    const wins =
      rawWins ??
      (winRate === null ? null : Math.round((winRate / 100) * matches))
    if (wins === null) {
      continue
    }

    const key = normalizeMapName(segment.label)
    const current = mapResults.get(key) ?? {
      map: formatMapName(segment.label),
      matches: 0,
      wins: 0,
    }
    current.matches += matches
    current.wins += wins
    mapResults.set(key, current)
  }

  return toMapStats(mapResults)
}

const getCachedLifetimeMapStats = unstable_cache(
  calculateLifetimeMapStats,
  ["faceit-player-lifetime-map-stats-v1"],
  { revalidate: MAP_STATS_CACHE_SECONDS }
)

async function getHistory(
  playerId: string,
  range: FaceitStatsRange
): Promise<HistoryMatch[]> {
  const to = Math.floor(Date.now() / 1000)
  const days = range === "30d" ? 30 : range === "90d" ? 90 : null
  const from = days === null ? null : to - days * 24 * 60 * 60
  const matches: HistoryMatch[] = []
  let offset = 0

  while (true) {
    const dateParams =
      from === null ? "" : `&from=${from}&to=${to}`
    const page = await faceitFetchWithRetry<{ items?: HistoryMatch[] }>(
      `/players/${encodeURIComponent(playerId)}/history?game=cs2${dateParams}&offset=${offset}&limit=${HISTORY_PAGE_SIZE}`
    )
    const items = page.items ?? []
    matches.push(
      ...items.filter(
        (match) =>
          from === null ||
          (match.finished_at !== undefined &&
            match.finished_at >= from &&
            match.finished_at <= to)
      )
    )

    if (items.length < HISTORY_PAGE_SIZE) {
      return matches
    }

    offset += items.length
  }
}

async function calculateMapStats(
  playerId: string,
  range: Exclude<FaceitStatsRange, "lifetime">
): Promise<FaceitMapStats[]> {
  const history = await getHistory(playerId, range)
  const mapResults = new Map<
    string,
    { map: string; matches: number; wins: number }
  >()
  let nextMatch = 0

  async function processNextMatch() {
    while (nextMatch < history.length) {
      const historyMatch = history[nextMatch]
      nextMatch += 1
      if (!historyMatch) {
        continue
      }

      const match = await getFaceitMatchStats(historyMatch.match_id)
      const map = getMapName(match)
      const playerTeam = getPlayerTeam(match, playerId)
      if (!map || !playerTeam) {
        continue
      }

      const won = getWinResult(historyMatch, playerTeam)
      if (won === null) {
        continue
      }

      const key = normalizeMapName(map)
      const current = mapResults.get(key) ?? {
        map: formatMapName(map),
        matches: 0,
        wins: 0,
      }
      current.matches += 1
      if (won) {
        current.wins += 1
      }
      mapResults.set(key, current)
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(MATCH_STATS_CONCURRENCY, history.length) },
      () => processNextMatch()
    )
  )

  return toMapStats(mapResults)
}

const getCachedMapStats = unstable_cache(
  calculateMapStats,
  ["faceit-player-map-stats-v1"],
  { revalidate: MAP_STATS_CACHE_SECONDS }
)

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("playerId")
  const range = request.nextUrl.searchParams.get("range")

  if (!playerId || playerId.length > 100) {
    return NextResponse.json(
      { error: "Podaj prawidłowe ID gracza." },
      { status: 400 }
    )
  }

  if (range !== "lifetime" && range !== "30d" && range !== "90d") {
    return NextResponse.json(
      { error: "Zakres musi mieć wartość lifetime, 30d lub 90d." },
      { status: 400 }
    )
  }

  try {
    const maps =
      range === "lifetime"
        ? await getCachedLifetimeMapStats(playerId)
        : await getCachedMapStats(playerId, range)
    return NextResponse.json({ range, maps })
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
