import type { CitoMatch, MatchFeedName } from "@/lib/cito-matches"
import MatchCard from "./MatchCard"

export default function MatchColumns({
  matches,
  feed,
}: {
  matches: CitoMatch[]
  feed: MatchFeedName
}) {
  const columns = [
    matches.filter((_, index) => index % 2 === 0),
    matches.filter((_, index) => index % 2 === 1),
  ]

  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-3">
          {column.map((match) => (
            <MatchCard key={match.id} match={match} feed={feed} />
          ))}
        </div>
      ))}
    </div>
  )
}
