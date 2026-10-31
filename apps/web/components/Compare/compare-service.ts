import type {
  FaceitAdditionalStatsData,
  FaceitMapStats,
} from "@/lib/faceit-types"
import { fetchJson, fetchOptional, isPlayerData } from "./comparison-utils"
import type { ComparedPlayer, CompareResult } from "./types"

export async function fetchCompareResult(
  firstNickname: string,
  secondNickname: string
): Promise<CompareResult> {
  const [firstProfile, secondProfile] = await Promise.all([
    fetchJson<unknown>(
      `/api/faceit/player?nickname=${encodeURIComponent(firstNickname)}`
    ),
    fetchJson<unknown>(
      `/api/faceit/player?nickname=${encodeURIComponent(secondNickname)}`
    ),
  ])

  if (!isPlayerData(firstProfile) || !isPlayerData(secondProfile)) {
    throw new Error("Nie udało się znaleźć obu graczy na FACEIT.")
  }

  const [firstAdvanced, firstMaps, secondAdvanced, secondMaps] =
    await Promise.all([
      fetchOptional<FaceitAdditionalStatsData>(
        `/api/faceit/player/stats?nickname=${encodeURIComponent(firstProfile.player.nickname)}`
      ),
      fetchOptional<{ maps: FaceitMapStats[] }>(
        `/api/faceit/player/stats/maps?playerId=${encodeURIComponent(firstProfile.player.player_id)}&range=lifetime`
      ),
      fetchOptional<FaceitAdditionalStatsData>(
        `/api/faceit/player/stats?nickname=${encodeURIComponent(secondProfile.player.nickname)}`
      ),
      fetchOptional<{ maps: FaceitMapStats[] }>(
        `/api/faceit/player/stats/maps?playerId=${encodeURIComponent(secondProfile.player.player_id)}&range=lifetime`
      ),
    ])

  const createComparedPlayer = (
    profile: typeof firstProfile,
    advanced: typeof firstAdvanced,
    maps: typeof firstMaps
  ): ComparedPlayer => ({
    profile,
    advancedStats: advanced.data?.stats ?? null,
    advancedStatsError: advanced.error,
    mapStats: maps.data?.maps ?? null,
    mapStatsError: maps.error,
  })

  return {
    first: createComparedPlayer(firstProfile, firstAdvanced, firstMaps),
    second: createComparedPlayer(secondProfile, secondAdvanced, secondMaps),
  }
}
