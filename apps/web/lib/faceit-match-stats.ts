import { unstable_cache } from "next/cache"
import { faceitFetch } from "@/lib/faceit"

const RATE_LIMIT_RETRIES = 3
const MATCH_STATS_CACHE_SECONDS = 24 * 60 * 60

export type FaceitMatchStats = {
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

async function fetchMatchStats(matchId: string): Promise<FaceitMatchStats> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await faceitFetch<FaceitMatchStats>(
        `/matches/${encodeURIComponent(matchId)}/stats`
      )
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

export const getFaceitMatchStats = unstable_cache(
  fetchMatchStats,
  ["faceit-match-stats-v1"],
  { revalidate: MATCH_STATS_CACHE_SECONDS }
)
