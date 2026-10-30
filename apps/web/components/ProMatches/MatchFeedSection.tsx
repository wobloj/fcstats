import { CalendarDays, Radio, Trophy } from "lucide-react"
import type {
  CitoMatch,
  MatchFeedName,
  MatchFeedResult,
} from "@/lib/cito-matches"
import MatchColumns from "./MatchColumns"
import { EventLogo } from "./MatchShared"

export const MATCH_FEEDS: Array<{
  id: MatchFeedName
  title: string
  description: string
  icon: typeof Radio
  emptyMessage: string
}> = [
  {
    id: "live",
    title: "Live",
    description: "Matches currently live",
    icon: Radio,
    emptyMessage: "Currently no matches are live",
  },
  {
    id: "upcoming",
    title: "Upcoming",
    description: "Upcoming matches",
    icon: CalendarDays,
    emptyMessage: "No upcoming matches",
  },
  {
    id: "recent",
    title: "Recent",
    description: "Recent played matches",
    icon: Trophy,
    emptyMessage: "No recent matches played",
  },
]

type TournamentGroup = {
  key: string
  name: string
  logoUrl?: string
  matches: CitoMatch[]
}

function groupMatchesByTournament(matches: CitoMatch[]): TournamentGroup[] {
  const groups = new Map<string, TournamentGroup>()

  for (const match of matches) {
    const key = match.eventId ?? match.eventName
    const group = groups.get(key)

    if (group) {
      group.matches.push(match)
      continue
    }

    groups.set(key, {
      key,
      name: match.eventName,
      logoUrl: match.eventLogoUrl,
      matches: [match],
    })
  }

  return [...groups.values()]
}

export default function MatchFeedSection({
  feed,
  result,
}: {
  feed: (typeof MATCH_FEEDS)[number]
  result?: MatchFeedResult
}) {
  const Icon = feed.icon
  const matches = result?.matches ?? []
  const tournamentGroups = groupMatchesByTournament(matches)

  return (
    <section className="space-y-4" aria-labelledby={`${feed.id}-heading`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id={`${feed.id}-heading`}
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <Icon
              aria-hidden="true"
              className={`size-5 ${feed.id === "live" ? "text-red-500" : "text-primary"}`}
            />
            {feed.title}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {matches.length}
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {feed.description}
          </p>
        </div>
      </div>

      {result?.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {result.error}
        </p>
      ) : matches.length > 0 ? (
        feed.id === "live" ? (
          <MatchColumns matches={matches} feed={feed.id} />
        ) : (
          <div className="space-y-6">
            {tournamentGroups.map((group) => (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center gap-3">
                  <EventLogo src={group.logoUrl} name={group.name} />
                  <h3 className="font-semibold">{group.name}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {group.matches.length}
                  </span>
                </div>
                <MatchColumns matches={group.matches} feed={feed.id} />
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {feed.emptyMessage}
        </p>
      )}
    </section>
  )
}
