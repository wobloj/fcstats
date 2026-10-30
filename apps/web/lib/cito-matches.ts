export type CitoRosterPlayer = {
  id: string
  nickname: string
  name?: string
  imageUrl?: string
  countryCode?: string
}

export type CitoTeam = {
  id: string
  name: string
  teamTag?: string
  logoUrl?: string
  countryName?: string
  countryCode?: string
  worldRanking?: number | string
  roster: CitoRosterPlayer[]
}

export type CitoMap = {
  id: string
  mapName: string
  status?: string
  team1Score: number | null
  team2Score: number | null
}

export type CitoVetoAction = {
  raw: string
}

export type CitoMatch = {
  id: string
  eventId?: string
  eventName: string
  eventLogoUrl?: string
  stageName?: string
  startsAt?: string
  status: string
  bestOf?: number
  currentMap?: string
  currentRound?: number
  currentMapScore?: {
    team1: number | null
    team2: number | null
  }
  team1: CitoTeam
  team2: CitoTeam
  team1Score: number | null
  team2Score: number | null
  maps: CitoMap[]
  vetoOrder: CitoVetoAction[]
}

export type MatchFeedName = "live" | "upcoming" | "recent"

export type MatchFeedResult = {
  matches: CitoMatch[]
  error?: string
}

export type ProMatchesResponse = Record<MatchFeedName, MatchFeedResult>

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function readScore(value: unknown, fallback?: unknown) {
  return readNumber(value) ?? readNumber(fallback) ?? null
}

function readRoster(value: unknown): CitoRosterPlayer[] {
  if (!Array.isArray(value)) {
    return []
  }

  const players = value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      return []
    }

    if (entry.isActive === false) {
      return []
    }

    if (readString(entry.role)?.toLowerCase() === "coach") {
      return []
    }

    const nickname =
      readString(entry.playerNickname) ??
      readString(entry.nickname) ??
      readString(entry.name) ??
      readString(entry.playerName) ??
      readString(entry.username)

    if (!nickname) {
      return []
    }

    return [
      {
        id:
          readString(entry.playerId) ??
          readString(entry.id) ??
          `${nickname}-${index}`,
        nickname,
        name: readString(entry.playerName) ?? readString(entry.name),
        imageUrl:
          readString(entry.playerImageUrl) ??
          readString(entry.imageUrl) ??
          readString(entry.avatarUrl) ??
          readString(entry.avatar),
        countryCode: readString(entry.countryCode),
      },
    ]
  })

  return players.slice(0, 5)
}

export function parseCitoRoster(value: unknown): CitoRosterPlayer[] {
  if (
    !isRecord(value) ||
    value.success !== true ||
    !Array.isArray(value.data)
  ) {
    throw new Error("Odpowiedź API zwróciła nieprawidłowy skład drużyny.")
  }

  return readRoster(value.data)
}

function readTeam(
  value: unknown,
  fallbackName: unknown,
  fallbackId: unknown
): CitoTeam {
  const team = isRecord(value) ? value : {}
  const name =
    readString(team.name) ?? readString(fallbackName) ?? "Nieznana drużyna"
  const id = readString(team.id) ?? readString(fallbackId) ?? name
  const ranking = team.worldRanking

  return {
    id,
    name,
    teamTag: readString(team.teamTag),
    logoUrl: readString(team.logoUrl),
    countryName: readString(team.countryName),
    countryCode: readString(team.countryCode),
    worldRanking: readNumber(ranking) ?? readString(ranking),
    roster: readRoster(team.roster ?? team.players),
  }
}

function readMaps(value: unknown): CitoMap[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      return []
    }

    const mapName = readString(entry.mapName) ?? readString(entry.name)
    if (!mapName) {
      return []
    }

    return [
      {
        id: readString(entry.id) ?? `${mapName}-${index}`,
        mapName,
        status: readString(entry.status),
        team1Score: readScore(entry.team1Score),
        team2Score: readScore(entry.team2Score),
      },
    ]
  })
}

function readVetoOrder(value: unknown): CitoVetoAction[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return []
    }

    const raw = readString(entry.raw)
    return raw ? [{ raw }] : []
  })
}

function readLiveTeam(teams: JsonRecord | undefined, teamNumber: 1 | 2) {
  if (!teams) {
    return undefined
  }

  const suffix = `team${teamNumber}`
  return {
    id: teams[`${suffix}Id`],
    name: teams[`${suffix}Name`],
    logoUrl: teams[`${suffix}LogoUrl`],
  }
}

export function parseCitoMatches(value: unknown): CitoMatch[] {
  if (
    !isRecord(value) ||
    value.success !== true ||
    !Array.isArray(value.data)
  ) {
    throw new Error("Odpowiedź API ma nieprawidłowy format.")
  }

  return value.data.flatMap((entry) => {
    if (!isRecord(entry)) {
      return []
    }

    const id = readString(entry.id)
    if (!id) {
      return []
    }

    const teams = isRecord(entry.teams) ? entry.teams : undefined
    const team1 = isRecord(entry.team1) ? entry.team1 : readLiveTeam(teams, 1)
    const team2 = isRecord(entry.team2) ? entry.team2 : readLiveTeam(teams, 2)
    const liveScore = isRecord(entry.score) ? entry.score : undefined
    const currentMapScore = isRecord(entry.currentMapScore)
      ? entry.currentMapScore
      : undefined
    const event = isRecord(entry.event) ? entry.event : undefined

    return [
      {
        id,
        eventId:
          readString(entry.eventId) ??
          readString(event?.id) ??
          readString(event?.eventId),
        eventName: readString(entry.eventName) ?? "Wydarzenie CS2",
        eventLogoUrl:
          readString(entry.eventLogoUrl) ??
          readString(event?.logoUrl) ??
          readString(event?.imageUrl),
        stageName: readString(entry.stageName),
        startsAt: readString(entry.startsAt),
        status: readString(entry.status) ?? "unknown",
        bestOf: readNumber(entry.bestOf),
        currentMap: readString(entry.currentMap),
        currentRound: readNumber(entry.currentRound),
        currentMapScore: currentMapScore
          ? {
              team1: readScore(currentMapScore.team1),
              team2: readScore(currentMapScore.team2),
            }
          : undefined,
        team1: readTeam(team1, entry.team1Name, entry.team1Id),
        team2: readTeam(team2, entry.team2Name, entry.team2Id),
        team1Score: readScore(entry.team1Score, liveScore?.team1),
        team2Score: readScore(entry.team2Score, liveScore?.team2),
        maps: readMaps(entry.maps),
        vetoOrder: readVetoOrder(entry.vetoOrder),
      },
    ]
  })
}
