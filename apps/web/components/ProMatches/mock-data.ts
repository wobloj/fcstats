import type {
  CitoMap,
  CitoMatch,
  CitoRosterPlayer,
  CitoTeam,
  ProMatchesResponse,
} from "@/lib/cito-matches"
import furiaLogo from "@/lib/MockLogo/furia.svg"
import spiritLogo from "@/lib/MockLogo/team-spirit-seeklogo.png"
import vitalityLogo from "@/lib/MockLogo/team-vitality-seeklogo.png"

const vitalityDemoPlayers = [
  ["apEX", "FR", "IGL"],
  ["ropz", "EE", "Rifler"],
  ["ZywOo", "FR", "AWPer"],
  ["flameZ", "IL", "Entry"],
  ["mezii", "GB", "Rifler"],
  ["XTQZZZ", "FR", "Coach"],
] as const

const spiritDemoPlayers = [
  ["sh1ro", "RU", "AWPer"],
  ["magixx", "RU", "IGL"],
  ["tN1R", "BY", "Rifler"],
  ["zont1x", "RU", "Support"],
  ["donk", "RU", "Entry"],
  ["hally", "RU", "Coach"],
] as const

const furiaDemoPlayers = [
  ["FalleN", "BR", "IGL"],
  ["yuurih", "BR", "Rifler"],
  ["YEKINDAR", "LV", "Entry"],
  ["KSCERATO", "BR", "Rifler"],
  ["molodoy", "KZ", "AWPer"],
  ["sidee", "BR", "Coach"],
] as const

function createTeam(
  id: string,
  name: string,
  countryName: string,
  players: readonly (readonly [string, string, string])[],
  logoUrl: string
): CitoTeam {
  const roster: CitoRosterPlayer[] = players.map(
    ([nickname, countryCode, role], index) => ({
      id: `${id}-player-${index + 1}`,
      nickname,
      countryCode,
      role,
    })
  )

  return {
    id,
    name,
    teamTag: name.slice(0, 5).toUpperCase(),
    countryName,
    worldRanking: 10 + id.length,
    roster,
    logoUrl,
  }
}

function createMap(
  matchId: string,
  mapName: string,
  team1Score: number | null,
  team2Score: number | null,
  status: string
): CitoMap {
  return {
    id: `${matchId}-${mapName}`,
    mapName,
    team1Score,
    team2Score,
    status,
  }
}

function createMatch({
  id,
  eventId,
  eventName,
  status,
  startsAt,
  team1,
  team2,
  team1Score,
  team2Score,
  currentMap,
  currentMapScore,
  maps = [],
}: {
  id: string
  eventId: string
  eventName: string
  status: string
  startsAt: string
  team1: CitoTeam
  team2: CitoTeam
  team1Score: number | null
  team2Score: number | null
  currentMap?: string
  currentMapScore?: { team1: number | null; team2: number | null }
  maps?: CitoMap[]
}): CitoMatch {
  return {
    id,
    eventId,
    eventName,
    status,
    startsAt,
    bestOf: 3,
    team1,
    team2,
    team1Score,
    team2Score,
    currentMap,
    currentMapScore,
    maps,
    vetoOrder: [],
  }
}

const teams = [
  createTeam(
    "demo-vitality",
    "Team Vitality",
    "France",
    vitalityDemoPlayers,
    vitalityLogo.src
  ),
  createTeam(
    "demo-spirit",
    "Team Spirit",
    "Russia",
    spiritDemoPlayers,
    spiritLogo.src
  ),
  createTeam("demo-furia", "FURIA", "Brazil", furiaDemoPlayers, furiaLogo.src),
] as const

const matchups = [
  [teams[0], teams[1]],
  [teams[2], teams[0]],
  [teams[1], teams[2]],
] as const

const demoNow = new Date()
const upcomingTime = (hoursFromNow: number) =>
  new Date(demoNow.getTime() + hoursFromNow * 60 * 60 * 1000).toISOString()
const recentTime = (hoursAgo: number) =>
  new Date(demoNow.getTime() - hoursAgo * 60 * 60 * 1000).toISOString()

export const DEMO_MATCHES: ProMatchesResponse = {
  live: {
    matches: [
      createMatch({
        id: "demo-live-1",
        eventId: "demo-event-live",
        eventName: "PGL Masters Bucharest 2026",
        status: "live",
        startsAt: recentTime(1),
        team1: matchups[0][0],
        team2: matchups[0][1],
        team1Score: 1,
        team2Score: 0,
        currentMap: "de_mirage",
        currentMapScore: { team1: 8, team2: 6 },
      }),
      createMatch({
        id: "demo-live-2",
        eventId: "demo-event-live",
        eventName: "PGL Major",
        status: "live",
        startsAt: recentTime(0.5),
        team1: matchups[1][0],
        team2: matchups[1][1],
        team1Score: 0,
        team2Score: 0,
        currentMap: "de_ancient",
        currentMapScore: { team1: 4, team2: 7 },
      }),
      createMatch({
        id: "demo-live-3",
        eventId: "demo-event-live",
        eventName: "Blast Rivals",
        status: "live",
        startsAt: recentTime(0.25),
        team1: matchups[2][0],
        team2: matchups[2][1],
        team1Score: 0,
        team2Score: 1,
        currentMap: "de_inferno",
        currentMapScore: { team1: 10, team2: 12 },
      }),
    ],
  },
  upcoming: {
    matches: [
      createMatch({
        id: "demo-upcoming-1",
        eventId: "demo-event-major",
        eventName: "PGL Masters Bucharest 2026",
        status: "upcoming",
        startsAt: upcomingTime(2),
        team1: matchups[0][0],
        team2: matchups[0][1],
        team1Score: null,
        team2Score: null,
      }),
      createMatch({
        id: "demo-upcoming-2",
        eventId: "demo-event-major",
        eventName: "PGL Masters Bucharest 2026",
        status: "upcoming",
        startsAt: upcomingTime(3),
        team1: matchups[1][0],
        team2: matchups[1][1],
        team1Score: null,
        team2Score: null,
      }),
      createMatch({
        id: "demo-upcoming-3",
        eventId: "demo-event-open",
        eventName: "Blast Rivals",
        status: "upcoming",
        startsAt: upcomingTime(5),
        team1: matchups[2][0],
        team2: matchups[2][1],
        team1Score: null,
        team2Score: null,
      }),
    ],
  },
  recent: {
    matches: [
      createMatch({
        id: "demo-recent-1",
        eventId: "demo-event-major",
        eventName: "Blast Rivals",
        status: "completed",
        startsAt: recentTime(3),
        team1: matchups[0][0],
        team2: matchups[0][1],
        team1Score: 2,
        team2Score: 1,
        maps: [
          createMap("demo-recent-1", "Mirage", 13, 9, "completed"),
          createMap("demo-recent-1", "Ancient", 7, 13, "completed"),
          createMap("demo-recent-1", "Nuke", 13, 11, "completed"),
        ],
      }),
      createMatch({
        id: "demo-recent-2",
        eventId: "demo-event-major",
        eventName: "Blast Rivals",
        status: "completed",
        startsAt: recentTime(5),
        team1: matchups[1][0],
        team2: matchups[1][1],
        team1Score: 0,
        team2Score: 2,
        maps: [
          createMap("demo-recent-2", "Dust2", 8, 13, "completed"),
          createMap("demo-recent-2", "Inferno", 10, 13, "completed"),
        ],
      }),
      createMatch({
        id: "demo-recent-3",
        eventId: "demo-event-open",
        eventName: "PGL Masters Bucharest 2026",
        status: "completed",
        startsAt: recentTime(8),
        team1: matchups[2][0],
        team2: matchups[2][1],
        team1Score: 2,
        team2Score: 0,
        maps: [
          createMap("demo-recent-3", "Anubis", 13, 6, "completed"),
          createMap("demo-recent-3", "Train", 13, 10, "completed"),
        ],
      }),
    ],
  },
}
