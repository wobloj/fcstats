import type {
  FaceitMapStats,
  FaceitPlayerData,
  FaceitStatValue,
} from "@/lib/faceit-types"

export type StatSource = "basic" | "advanced" | "game" | "rankings"

export type ComparisonStat = {
  label: string
  source: StatSource
  sourceKeys: string[]
  suffix?: string
  precision?: number
  better: "higher" | "lower"
  prefix?: string
}

export type ComparisonCategory = {
  title: string
  stats: ComparisonStat[]
}

export type ComparedPlayer = {
  profile: FaceitPlayerData
  advancedStats: Record<string, FaceitStatValue> | null
  advancedStatsError: string
  mapStats: FaceitMapStats[] | null
  mapStatsError: string
}

export type CompareResult = {
  first: ComparedPlayer
  second: ComparedPlayer
}
