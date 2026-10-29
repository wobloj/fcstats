export type FaceitGame = {
  faceit_elo?: number
  skill_level?: number
  region?: string
}

export type FaceitStatValue = string | number | string[]

export type FaceitLifetimeStats = Record<string, FaceitStatValue>

export type FaceitBasicStats = {
  kda: number | null
  avgDamage: number | null
  adr: number | null
  matches: number | null
  avgHeadshot: number | null
  winRate: number | null
}

export type FaceitStatsRange = "30d" | "90d" | "lifetime"

export type FaceitStatsRangeData = {
  range: Exclude<FaceitStatsRange, "lifetime">
  basicStats: FaceitBasicStats
  matches: number
}

export type FaceitMapStats = {
  map: string
  matches: number
  wins: number
  winRate: number
}

export type FaceitMatchHistoryItem = {
  match_id: string
  started_at?: number
  finished_at?: number
  results?: { winner?: string; score?: Record<string, number | string> }
  teams?: Record<string, { name?: string; nickname?: string; team_id?: string }>
  map: string | null
  score: { player: number; opponent: number } | null
  result: "win" | "lose" | null
  stats: {
    kills: number | null
    deaths: number | null
    assists: number | null
    kd: number | null
    adr: number | null
  } | null
}

export type FaceitPlayerData = {
  player: {
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
    games?: Record<string, FaceitGame>
  }
  basicStats: FaceitBasicStats | null
  history: FaceitMatchHistoryItem[] | null
  historyHasMore: boolean
  rankings: {
    region: string | null
    regional: number | null
    global: number | null
    challengerElo: number | null
  }
  unavailable: { stats: boolean; history: boolean; challenger: boolean }
}

export type FaceitAdditionalStatsData = {
  playerId: string
  nickname: string
  stats: FaceitLifetimeStats
}

export type FaceitRankingItem = {
  player_id: string
  nickname: string
  position: number
  country?: string
  faceit_elo: number
  skill_level?: number
  game_skill_level?: number
  avatar?: string
}
