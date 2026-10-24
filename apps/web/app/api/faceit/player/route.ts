import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"
import { getPlayerMatchHistoryPage } from "@/lib/faceit-match-history"
import { getBasicStats } from "@/lib/faceit-stats"
import type { FaceitLifetimeStats } from "@/lib/faceit-types"

type FaceitPlayer = {
  player_id: string
  nickname: string
  avatar?: string
  country?: string
  faceit_url?: string
  verified?: boolean
  is_verified?: boolean
  membership_type?: string
  memberships?: string[]
  activated_at?: string
  created_at?: string
  steam_id_64?: string
  new_steam_id?: string
  platforms?: Record<string, string>
  games?: Record<
    string,
    {
      faceit_elo?: number
      skill_level?: number
      region?: string
    }
  >
}

type FaceitStats = {
  lifetime?: FaceitLifetimeStats
}

type FaceitRanking = {
  position?: number | string
  items?: Array<{
    player_id?: string
    position?: number | string
    faceit_elo?: number
  }>
}

function toRankingPosition(position: number | string | undefined) {
  const parsed = typeof position === "string" ? Number(position) : position

  return typeof parsed === "number" &&
    Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : null
}

function getRankingPosition(ranking: FaceitRanking | null, playerId: string) {
  const directPosition = toRankingPosition(ranking?.position)
  if (directPosition !== null) {
    return directPosition
  }

  const playerRanking = ranking?.items?.find(
    (item) => item.player_id === playerId
  )
  return toRankingPosition(playerRanking?.position)
}

function getChallengerElo(ranking: FaceitRanking | null) {
  const challenger = ranking?.items?.find(
    (item) => toRankingPosition(item.position) === 1000
  )

  return typeof challenger?.faceit_elo === "number" &&
    Number.isSafeInteger(challenger.faceit_elo) &&
    challenger.faceit_elo > 0
    ? challenger.faceit_elo
    : null
}

export async function GET(request: NextRequest) {
  const nickname = request.nextUrl.searchParams.get("nickname")?.trim()

  if (!nickname || nickname.length > 50) {
    return NextResponse.json(
      { error: "Podaj prawidłowy nickname." },
      { status: 400 }
    )
  }

  try {
    const player = await faceitFetch<FaceitPlayer>(
      `/players?nickname=${encodeURIComponent(nickname)}&game=cs2`
    )

    const playerId = encodeURIComponent(player.player_id)
    const region = player.games?.cs2?.region ?? null
    const country =
      player.country && /^[a-z]{2}$/i.test(player.country)
        ? player.country.toLowerCase()
        : null

    const [
      statsResult,
      historyResult,
      regionalRankingResult,
      globalRankingResult,
      challengerRankingResult,
    ] = await Promise.allSettled([
      faceitFetch<FaceitStats>(`/players/${playerId}/stats/cs2`),
      getPlayerMatchHistoryPage(player.player_id, 0),
      region && country
        ? faceitFetch<FaceitRanking>(
            `/rankings/games/cs2/regions/${encodeURIComponent(region)}/players/${playerId}?limit=1&country=${encodeURIComponent(country)}`
          )
        : Promise.resolve(null),
      region
        ? faceitFetch<FaceitRanking>(
            `/rankings/games/cs2/regions/${encodeURIComponent(region)}/players/${playerId}?limit=1`
          )
        : Promise.resolve(null),
      region
        ? faceitFetch<FaceitRanking>(
            `/rankings/games/cs2/regions/${encodeURIComponent(region)}?offset=999&limit=1`
          )
        : Promise.resolve(null),
    ])

    const lifetime =
      statsResult.status === "fulfilled"
        ? statsResult.value.lifetime
        : undefined
    const challengerElo =
      challengerRankingResult.status === "fulfilled"
        ? getChallengerElo(challengerRankingResult.value)
        : null

    return NextResponse.json({
      player,
      basicStats: lifetime ? getBasicStats(lifetime) : null,
      history:
        historyResult.status === "fulfilled"
          ? historyResult.value.matches
          : null,
      historyHasMore:
        historyResult.status === "fulfilled" && historyResult.value.hasMore,
      rankings: {
        region,
        regional:
          regionalRankingResult.status === "fulfilled"
            ? getRankingPosition(regionalRankingResult.value, player.player_id)
            : null,
        global:
          globalRankingResult.status === "fulfilled"
            ? getRankingPosition(globalRankingResult.value, player.player_id)
            : null,
        challengerElo,
      },
      unavailable: {
        stats: statsResult.status === "rejected",
        history: historyResult.status === "rejected",
        challenger:
          challengerRankingResult.status === "rejected" ||
          challengerElo === null,
      },
    })
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
