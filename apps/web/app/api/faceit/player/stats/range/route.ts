import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"
import { getFaceitMatchStats } from "@/lib/faceit-match-stats"
import {
  getBasicStatsFromMatches,
  type FaceitMatchPlayerStats,
} from "@/lib/faceit-stats"
import type {
  FaceitStatsRange,
  FaceitStatsRangeData,
} from "@/lib/faceit-types"

const HISTORY_PAGE_SIZE = 100
const MATCH_STATS_CONCURRENCY = 2
const RATE_LIMIT_RETRIES = 3
const RANGE_STATS_CACHE_SECONDS = 15 * 60

type FaceitHistory = {
  items?: Array<{
    match_id: string
    finished_at?: number
    results?: {
      winner?: string
      score?: Record<string, string | number>
    }
    teams?: Record<string, { team_id?: string }>
  }>
}

function isPlayerId(value: string | null): value is string {
  return value !== null && value.length > 0 && value.length <= 100
}

function numericStat(stats: Record<string, string | number>, key: string) {
  const value = stats[key]
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

async function getMatchHistory(playerId: string, from: number, to: number) {
  const matches: NonNullable<FaceitHistory["items"]> = []
  let offset = 0

  while (true) {
    const page = await faceitFetchWithRetry<FaceitHistory>(
      `/players/${encodeURIComponent(playerId)}/history?game=cs2&from=${from}&to=${to}&offset=${offset}&limit=${HISTORY_PAGE_SIZE}`
    )
    const items = page.items ?? []
    matches.push(...items)

    if (items.length < HISTORY_PAGE_SIZE) {
      return matches
    }

    offset += items.length
  }
}

function normalizeTeamId(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function getPlayerWinResult(
  winner: string | undefined,
  score: Record<string, string | number> | undefined,
  playerTeam: { key: string; id?: string },
  historyTeams: Record<string, { team_id?: string }> | undefined
): boolean | null {
  const playerIdentifiers = new Set(
    [playerTeam.key, playerTeam.id]
      .map(normalizeTeamId)
      .filter((value): value is string => value !== undefined)
  )
  const playerHistoryTeam = Object.entries(historyTeams ?? {}).find(
    ([key, team]) =>
      playerIdentifiers.has(normalizeTeamId(key) ?? "") ||
      playerIdentifiers.has(normalizeTeamId(team.team_id) ?? "")
  )

  if (playerHistoryTeam) {
    playerIdentifiers.add(normalizeTeamId(playerHistoryTeam[0]) ?? "")
    playerIdentifiers.add(
      normalizeTeamId(playerHistoryTeam[1].team_id) ?? ""
    )
  }
  playerIdentifiers.delete("")

  const normalizedWinner = normalizeTeamId(winner)
  if (normalizedWinner) {
    if (playerIdentifiers.has(normalizedWinner)) {
      return true
    }

    const knownTeamIds = new Set(
      Object.entries(historyTeams ?? {}).flatMap(([key, team]) =>
        [key, team.team_id]
          .map(normalizeTeamId)
          .filter((value): value is string => value !== undefined)
      )
    )

    if (knownTeamIds.has(normalizedWinner)) {
      return false
    }
  }

  if (score && playerHistoryTeam) {
    const playerTeamKeys = new Set(
      [...playerIdentifiers, normalizeTeamId(playerHistoryTeam[0]) ?? ""]
    )
    const playerScore = Object.entries(score).find(([key]) =>
      playerTeamKeys.has(normalizeTeamId(key) ?? "")
    )
    const opponentScores = Object.entries(score)
      .filter(([key]) => !playerTeamKeys.has(normalizeTeamId(key) ?? ""))
      .map(([, value]) => numericStat({ score: value }, "score"))
      .filter((value): value is number => value !== null)
    const ownScore =
      playerScore === undefined
        ? null
        : numericStat({ score: playerScore[1] }, "score")

    if (ownScore !== null && opponentScores.length > 0) {
      const highestOpponentScore = Math.max(...opponentScores)
      return ownScore === highestOpponentScore
        ? null
        : ownScore > highestOpponentScore
    }
  }

  return null
}

async function getMatchPlayerStats(
  matchId: string,
  playerId: string,
  winner?: string,
  score?: Record<string, string | number>,
  historyTeams?: Record<string, { team_id?: string }>
): Promise<{ stats: FaceitMatchPlayerStats; won: boolean | null } | null> {
  const match = await getFaceitMatchStats(matchId)
  const aggregateStats: Record<string, string | number> = {}
  let totalRounds = 0
  let weightedAdr = 0
  let adrRounds = 0
  let playerTeam: { key: string; id?: string } | undefined
  let hasPlayerStats = false

  for (const round of match.rounds ?? []) {
    const roundCount = numericStat(round.round_stats ?? {}, "Rounds") ?? 0
    totalRounds += roundCount

    for (const [teamKey, team] of Object.entries(round.teams ?? {})) {
      const player = team.players?.find(
        (entry) => entry.player_id === playerId
      )
      if (!player?.player_stats) {
        continue
      }

      hasPlayerStats = true
      playerTeam = { key: teamKey, id: team.team_id }
      const stats = player.player_stats

      for (const key of ["Kills", "Deaths", "Headshots", "Damage"]) {
        const value = numericStat(stats, key)
        if (value !== null) {
          aggregateStats[key] =
            numericStat(aggregateStats, key) === null
              ? value
              : (numericStat(aggregateStats, key) ?? 0) + value
        }
      }

      const adr = numericStat(stats, "ADR")
      if (adr !== null && roundCount > 0) {
        weightedAdr += adr * roundCount
        adrRounds += roundCount
      }
    }
  }

  if (!hasPlayerStats || !playerTeam) {
    return null
  }

  aggregateStats.Rounds = totalRounds
  if (adrRounds > 0) {
    aggregateStats.ADR = weightedAdr / adrRounds
  }

  return {
    stats: { stats: aggregateStats },
    won: getPlayerWinResult(winner, score, playerTeam, historyTeams),
  }
}

async function calculateRangeStats(
  playerId: string,
  range: Exclude<FaceitStatsRange, "lifetime">
): Promise<FaceitStatsRangeData> {
  const to = Math.floor(Date.now() / 1000)
  const days = range === "30d" ? 30 : 90
  const from = to - days * 24 * 60 * 60
  const history = await getMatchHistory(playerId, from, to)
  const completedMatches = history.filter(
    (match) =>
      match.match_id !== undefined &&
      match.finished_at !== undefined &&
      match.finished_at >= from &&
      match.finished_at <= to
  )
  const playerMatchStats: FaceitMatchPlayerStats[] = []
  let wins = 0
  let decidedMatches = 0

  for (
    let index = 0;
    index < completedMatches.length;
    index += MATCH_STATS_CONCURRENCY
  ) {
    const batch = completedMatches.slice(
      index,
      index + MATCH_STATS_CONCURRENCY
    )
    const batchStats = await Promise.all(
      batch.map((historyMatch) =>
        getMatchPlayerStats(
          historyMatch.match_id,
          playerId,
          historyMatch.results?.winner,
          historyMatch.results?.score,
          historyMatch.teams
        )
      )
    )

    for (const result of batchStats) {
      if (!result) {
        continue
      }

      playerMatchStats.push(result.stats)
      if (result.won !== null) {
        decidedMatches += 1
      }
      if (result.won === true) {
        wins += 1
      }
    }
  }

  return {
    range,
    basicStats: getBasicStatsFromMatches(
      playerMatchStats,
      wins,
      decidedMatches
    ),
    matches: playerMatchStats.length,
  }
}

const getCachedRangeStats = unstable_cache(
  calculateRangeStats,
  ["faceit-player-range-stats-v1"],
  { revalidate: RANGE_STATS_CACHE_SECONDS }
)

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("playerId")
  const range = request.nextUrl.searchParams.get("range")

  if (!isPlayerId(playerId)) {
    return NextResponse.json(
      { error: "Podaj prawidłowe ID gracza." },
      { status: 400 }
    )
  }

  if (range !== "30d" && range !== "90d") {
    return NextResponse.json(
      { error: "Zakres musi mieć wartość 30d lub 90d." },
      { status: 400 }
    )
  }

  try {
    const result = await getCachedRangeStats(playerId, range)
    return NextResponse.json(result)
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
