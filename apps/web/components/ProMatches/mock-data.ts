import type {
  CitoMap,
  CitoMatch,
  CitoRosterPlayer,
  CitoTeam,
  ProMatchesResponse,
} from "@/lib/cito-matches"

const demoPlayers = [
  ["Nova", "PL"],
  ["Byte", "SE"],
  ["Echo", "DK"],
  ["Pixel", "BR"],
  ["Vex", "US"],
] as const

function createTeam(id: string, name: string, countryName: string): CitoTeam {
  const roster: CitoRosterPlayer[] = demoPlayers.map(
    ([nickname, countryCode], index) => ({
      id: `${id}-player-${index + 1}`,
      nickname,
      countryCode,
    })
  )

  return {
    id,
    name,
    teamTag: name.slice(0, 5).toUpperCase(),
    countryName,
    worldRanking: 10 + id.length,
    roster,
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

const liveTeams = [
  [
    createTeam("demo-live-1-team-1", "Pixel Wolves", "Poland"),
    createTeam("demo-live-1-team-2", "Northstar", "Sweden"),
  ],
  [
    createTeam("demo-live-2-team-1", "Red Circuit", "Denmark"),
    createTeam("demo-live-2-team-2", "Blue Ember", "Brazil"),
  ],
  [
    createTeam("demo-live-3-team-1", "Crimson Peak", "Canada"),
    createTeam("demo-live-3-team-2", "Silverline", "Norway"),
  ],
] as const

const upcomingTeams = [
  [
    createTeam("demo-upcoming-1-team-1", "Solaris", "France"),
    createTeam("demo-upcoming-1-team-2", "Night Shift", "Germany"),
  ],
  [
    createTeam("demo-upcoming-2-team-1", "Cloudbreak", "Finland"),
    createTeam("demo-upcoming-2-team-2", "Ironclad", "United States"),
  ],
  [
    createTeam("demo-upcoming-3-team-1", "Wildcards", "Canada"),
    createTeam("demo-upcoming-3-team-2", "White Foxes", "Norway"),
  ],
] as const

const recentTeams = [
  [
    createTeam("demo-recent-1-team-1", "Amber Five", "Poland"),
    createTeam("demo-recent-1-team-2", "Stormbreak", "Ukraine"),
  ],
  [
    createTeam("demo-recent-2-team-1", "Greenline", "Sweden"),
    createTeam("demo-recent-2-team-2", "Night Shift", "Germany"),
  ],
  [
    createTeam("demo-recent-3-team-1", "Solaris", "France"),
    createTeam("demo-recent-3-team-2", "High Voltage", "Brazil"),
  ],
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
        eventName: "FCStats Invitational",
        status: "live",
        startsAt: recentTime(1),
        team1: liveTeams[0][0],
        team2: liveTeams[0][1],
        team1Score: 1,
        team2Score: 0,
        currentMap: "de_mirage",
        currentMapScore: { team1: 8, team2: 6 },
      }),
      createMatch({
        id: "demo-live-2",
        eventId: "demo-event-live",
        eventName: "FCStats Invitational",
        status: "live",
        startsAt: recentTime(0.5),
        team1: liveTeams[1][0],
        team2: liveTeams[1][1],
        team1Score: 0,
        team2Score: 0,
        currentMap: "de_ancient",
        currentMapScore: { team1: 4, team2: 7 },
      }),
      createMatch({
        id: "demo-live-3",
        eventId: "demo-event-live",
        eventName: "FCStats Invitational",
        status: "live",
        startsAt: recentTime(0.25),
        team1: liveTeams[2][0],
        team2: liveTeams[2][1],
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
        eventName: "Autumn Masters",
        status: "upcoming",
        startsAt: upcomingTime(2),
        team1: upcomingTeams[0][0],
        team2: upcomingTeams[0][1],
        team1Score: null,
        team2Score: null,
      }),
      createMatch({
        id: "demo-upcoming-2",
        eventId: "demo-event-major",
        eventName: "Autumn Masters",
        status: "upcoming",
        startsAt: upcomingTime(3),
        team1: upcomingTeams[1][0],
        team2: upcomingTeams[1][1],
        team1Score: null,
        team2Score: null,
      }),
      createMatch({
        id: "demo-upcoming-3",
        eventId: "demo-event-open",
        eventName: "Community Cup",
        status: "upcoming",
        startsAt: upcomingTime(5),
        team1: upcomingTeams[2][0],
        team2: upcomingTeams[2][1],
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
        eventName: "Autumn Masters",
        status: "completed",
        startsAt: recentTime(3),
        team1: recentTeams[0][0],
        team2: recentTeams[0][1],
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
        eventName: "Autumn Masters",
        status: "completed",
        startsAt: recentTime(5),
        team1: recentTeams[1][0],
        team2: recentTeams[1][1],
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
        eventName: "Community Cup",
        status: "completed",
        startsAt: recentTime(8),
        team1: recentTeams[2][0],
        team2: recentTeams[2][1],
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
