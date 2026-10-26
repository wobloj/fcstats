import { faceitFetch } from "@/lib/faceit"
import type { FaceitMatchHistoryItem } from "@/lib/faceit-types"

export const MATCH_HISTORY_PAGE_SIZE = 5
const MATCH_HISTORY_ENRICHMENT_CONCURRENCY = 2

type FaceitMatchStats = {
  rounds?: Array<{
    round_stats?: Record<string, string | number>
    teams?: Record<
      string,
      {
        team_id?: string
        players?: Array<{
          player_id: string
          player_stats?: Record<string, string | number>
        }>
      }
    >
  }>
}

type FaceitHistoryPage = {
  items?: Array<{
    match_id: string
    started_at?: number
    finished_at?: number
    results?: {
      winner?: string
      score?: Record<string, number | string>
    }
    teams?: Record<
      string,
      { name?: string; nickname?: string; team_id?: string }
    >
  }>
}

type PlayerMatchStats = NonNullable<FaceitMatchHistoryItem["stats"]>

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function getMapName(match: FaceitMatchStats) {
  for (const round of match.rounds ?? []) {
    const mapEntry = Object.entries(round.round_stats ?? {}).find(
      ([key]) => key.toLowerCase().replace(/[_\s]/g, "") === "map"
    )
    if (typeof mapEntry?.[1] === "string" && mapEntry[1].trim()) {
      return mapEntry[1].trim()
    }
  }

  return null
}

function getPlayerStats(
  match: FaceitMatchStats,
  playerId: string
): { stats: PlayerMatchStats; teamKey: string; teamId?: string } | null {
  let kills = 0
  let deaths = 0
  let assists = 0
  let hasKills = false
  let hasDeaths = false
  let hasAssists = false
  let damageTotal = 0
  let roundsTotal = 0
  let hasDamage = false
  let hasRounds = false
  let fallbackAdrTotal = 0
  let fallbackAdrRounds = 0
  let playerTeam: { key: string; id?: string } | undefined

  for (const round of match.rounds ?? []) {
    const roundStats = round.round_stats ?? {}
    const roundCountEntry = Object.entries(roundStats).find(
      ([key]) => key.toLowerCase() === "rounds"
    )?.[1]
    const roundCount = toNumber(roundCountEntry)
    if (roundCount !== null) {
      roundsTotal += roundCount
      hasRounds = true
    }

    for (const [teamKey, team] of Object.entries(round.teams ?? {})) {
      const player = team.players?.find((entry) => entry.player_id === playerId)
      if (!player?.player_stats) {
        continue
      }

      playerTeam = { key: teamKey, id: team.team_id }
      const stats = player.player_stats
      const matchKills = toNumber(stats.Kills)
      const matchDeaths = toNumber(stats.Deaths)
      const matchAssists = toNumber(stats.Assists)
      const damage = toNumber(stats.Damage)
      const adr = toNumber(stats.ADR)

      if (matchKills !== null) {
        kills += matchKills
        hasKills = true
      }
      if (matchDeaths !== null) {
        deaths += matchDeaths
        hasDeaths = true
      }
      if (matchAssists !== null) {
        assists += matchAssists
        hasAssists = true
      }
      if (damage !== null) {
        damageTotal += damage
        hasDamage = true
      } else if (adr !== null && roundCount !== null) {
        damageTotal += adr * roundCount
        hasDamage = true
      }
      if (adr !== null && roundCount !== null) {
        fallbackAdrTotal += adr * roundCount
        fallbackAdrRounds += roundCount
      }
    }
  }

  if (!playerTeam) {
    return null
  }

  return {
    stats: {
      kills: hasKills ? kills : null,
      deaths: hasDeaths ? deaths : null,
      assists: hasAssists ? assists : null,
      kd: hasKills && hasDeaths && deaths > 0 ? kills / deaths : null,
      adr:
        hasDamage && hasRounds && roundsTotal > 0
          ? damageTotal / roundsTotal
          : fallbackAdrRounds > 0
            ? fallbackAdrTotal / fallbackAdrRounds
            : null,
    },
    teamKey: playerTeam.key,
    teamId: playerTeam.id,
  }
}

function getPlayerFirstScore(
  score: Record<string, number | string> | undefined,
  teams: FaceitMatchHistoryItem["teams"],
  teamKey: string,
  teamId?: string
) {
  if (!score) {
    return null
  }

  const playerTeamIdentifiers = new Set(
    [teamKey, teamId]
      .map(normalize)
      .filter((value): value is string => value !== undefined)
  )
  for (const [key, team] of Object.entries(teams ?? {})) {
    if (
      playerTeamIdentifiers.has(normalize(key) ?? "") ||
      playerTeamIdentifiers.has(normalize(team.team_id) ?? "")
    ) {
      playerTeamIdentifiers.add(normalize(key) ?? "")
      playerTeamIdentifiers.add(normalize(team.team_id) ?? "")
    }
  }

  const playerScore = Object.entries(score).find(([key]) =>
    playerTeamIdentifiers.has(normalize(key) ?? "")
  )
  if (!playerScore) {
    return null
  }

  const opponentScores = Object.entries(score)
    .filter(([key]) => key !== playerScore[0])
    .map(([, value]) => toNumber(value))
    .filter((value): value is number => value !== null)

  const playerScoreValue = toNumber(playerScore[1])
  const opponentScore = opponentScores[0]
  if (
    playerScoreValue === null ||
    opponentScore === undefined ||
    opponentScores.length !== 1
  ) {
    return null
  }

  return { player: playerScoreValue, opponent: opponentScore }
}

function getMatchResult(
  score: FaceitMatchHistoryItem["score"],
  winner: string | undefined,
  teams: FaceitMatchHistoryItem["teams"],
  teamKey: string,
  teamId?: string
): FaceitMatchHistoryItem["result"] {
  if (score) {
    if (score.player > score.opponent) {
      return "win"
    }
    if (score.player < score.opponent) {
      return "lose"
    }
  }

  const normalizedWinner = normalize(winner)
  if (!normalizedWinner) {
    return null
  }

  const playerIdentifiers = new Set(
    [teamKey, teamId]
      .map(normalize)
      .filter((value): value is string => value !== undefined)
  )
  const winnerTeam = Object.entries(teams ?? {}).find(
    ([key, team]) =>
      normalize(key) === normalizedWinner ||
      normalize(team.team_id) === normalizedWinner
  )

  if (winnerTeam) {
    return playerIdentifiers.has(normalize(winnerTeam[0]) ?? "") ||
      playerIdentifiers.has(normalize(winnerTeam[1].team_id) ?? "")
      ? "win"
      : "lose"
  }

  return playerIdentifiers.has(normalizedWinner) ? "win" : null
}

async function enrichMatch(
  playerId: string,
  match: NonNullable<FaceitHistoryPage["items"]>[number]
): Promise<FaceitMatchHistoryItem> {
  const base = {
    ...match,
    map: null,
    score: null,
    result: null,
    stats: null,
  } satisfies FaceitMatchHistoryItem

  const matchStats = await faceitFetch<FaceitMatchStats>(
    `/matches/${encodeURIComponent(match.match_id)}/stats`
  )
  const map = getMapName(matchStats)
  const playerStats = getPlayerStats(matchStats, playerId)
  if (!playerStats) {
    return { ...base, map }
  }

  const score = getPlayerFirstScore(
    match.results?.score,
    match.teams,
    playerStats.teamKey,
    playerStats.teamId
  )

  return {
    ...base,
    map,
    score,
    result: getMatchResult(
      score,
      match.results?.winner,
      match.teams,
      playerStats.teamKey,
      playerStats.teamId
    ),
    stats: playerStats.stats,
  }
}

export async function getPlayerMatchHistoryPage(
  playerId: string,
  offset: number,
  limit = MATCH_HISTORY_PAGE_SIZE
) {
  const page = await faceitFetch<FaceitHistoryPage>(
    `/players/${encodeURIComponent(playerId)}/history?game=cs2&offset=${offset}&limit=${limit}`
  )
  const items = page.items ?? []
  const matches = items.slice(0, limit)
  const enrichedMatches: FaceitMatchHistoryItem[] = []

  for (
    let offset = 0;
    offset < matches.length;
    offset += MATCH_HISTORY_ENRICHMENT_CONCURRENCY
  ) {
    const batch = matches.slice(
      offset,
      offset + MATCH_HISTORY_ENRICHMENT_CONCURRENCY
    )
    const results = await Promise.allSettled(
      batch.map((match) => enrichMatch(playerId, match))
    )

    results.forEach((result, index) => {
      const match = batch[index]
      if (!match) {
        throw new Error("FACEIT match enrichment returned an invalid batch.")
      }

      if (result.status === "fulfilled") {
        enrichedMatches.push(result.value)
        return
      }

      console.error(
        `Failed to load FACEIT match details for ${match.match_id}:`,
        result.reason
      )
      enrichedMatches.push({
        ...match,
        map: null,
        score: null,
        result: null,
        stats: null,
      })
    })
  }

  return {
    matches: enrichedMatches,
    hasMore: items.length === limit,
  }
}

function normalizeMapName(map: string | null) {
  const normalized = map
    ?.trim()
    .toLowerCase()
    .replace(/^de[_\s-]?/, "")
    .replace(/[^a-z0-9]/g, "")

  return normalized === "dustii" ? "dust2" : normalized
}

export async function getPlayerFilteredMatchHistoryPage(
  playerId: string,
  offset: number,
  selectedMaps: string[],
  limit = MATCH_HISTORY_PAGE_SIZE
) {
  const pageSize = Math.min(limit, MATCH_HISTORY_PAGE_SIZE)
  const normalizedMaps = new Set(selectedMaps.map(normalizeMapName))
  const matches: FaceitMatchHistoryItem[] = []
  let cursor = offset
  let hasMore = true

  while (matches.length < pageSize && hasMore) {
    const page = await getPlayerMatchHistoryPage(
      playerId,
      cursor,
      MATCH_HISTORY_PAGE_SIZE
    )
    cursor += page.matches.length
    hasMore = page.hasMore
    matches.push(
      ...page.matches.filter((match) =>
        normalizedMaps.has(normalizeMapName(match.map))
      )
    )
    matches.splice(pageSize)
  }

  return { matches, hasMore, nextOffset: cursor }
}
