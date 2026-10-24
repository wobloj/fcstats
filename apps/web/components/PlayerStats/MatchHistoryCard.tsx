import { TableCell, TableRow } from "@workspace/ui/components/table"
import type { FaceitMatchHistoryItem } from "@/lib/faceit-types"
import { ExternalLink } from "lucide-react"

function formatStat(value: number | null) {
  return value === null ? "-" : Number(value.toFixed(2)).toString()
}

function formatMapName(map: string | null) {
  if (!map) {
    return "-"
  }

  return map
    .replace(/^de_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function MatchHistoryCard({
  match,
}: {
  match: FaceitMatchHistoryItem
}) {
  const resultClass =
    match.result === "win"
      ? "text-green-700 dark:text-green-400 bg-green-900/60 w-16 text-center py-0.5"
      : match.result === "lose"
        ? "text-red-600 dark:text-red-400 bg-red-900/60 w-16 text-center py-0.5"
        : ""
  const resultLabel =
    match.result === "win"
      ? "Victory"
      : match.result === "lose"
        ? "Defeat"
        : "-"

  return (
    <TableRow className="bg-background dark:hover:bg-muted/30">
      <TableCell>
        <div className="flex flex-row items-center gap-5 space-y-1">
          <p className={`font-semibold ${resultClass}`}>{resultLabel}</p>
          <div>
            <p className="text-lg font-semibold">{formatMapName(match.map)}</p>
            <p className="text-xs text-muted-foreground">
              {match.finished_at
                ? new Date(match.finished_at * 1000)
                    .toLocaleString("pl-PL")
                    .slice(0, 10)
                : match.started_at
                  ? new Date(match.started_at * 1000).toLocaleString("pl-PL")
                  : "Data niedostępna"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="text-xl font-semibold tabular-nums">
            {match.score ? (
              <>
                <span
                  className={`${match.result === "win" ? "text-green-700 dark:text-green-400" : match.result === "lose" ? "text-red-600 dark:text-red-400" : ""}`}
                >
                  {match.score.player}
                </span>
                <span> - {match.score.opponent}</span>
              </>
            ) : (
              "-"
            )}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col space-y-1">
          <p className="text-base tabular-nums">
            {match.stats
              ? `${match.stats.kills ?? "-"} - ${match.stats.deaths ?? "-"} - ${match.stats.assists ?? "-"}`
              : "-"}
          </p>
          <p className="text-xs">
            {match.stats ? `${formatStat(match.stats.kd)} K/D` : ""}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-center tabular-nums">
        {formatStat(match.stats?.adr ?? null)}
      </TableCell>
      <TableCell className="text-end">
        <a
          className="flex flex-row items-center justify-end"
          href={`https://www.faceit.com/en/cs2/room/${encodeURIComponent(match.match_id)}`}
          target="_blank"
          rel="noreferrer"
        >
          <div className="flex flex-row items-center justify-end gap-1 bg-card p-2 hover:outline-2 hover:outline-primary">
            <p className="mt-0.5">View on FACEIT</p>{" "}
            <ExternalLink size={16} className="text-primary" />
          </div>
        </a>
      </TableCell>
    </TableRow>
  )
}
