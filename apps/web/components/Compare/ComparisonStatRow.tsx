import { formatStat, getStatValue, getWinnerClass } from "./comparison-utils"
import type { ComparedPlayer, ComparisonStat } from "./types"

export default function ComparisonStatRow({
  stat,
  first,
  second,
}: {
  stat: ComparisonStat
  first: ComparedPlayer
  second: ComparedPlayer
}) {
  const firstValue = getStatValue(first, stat)
  const secondValue = getStatValue(second, stat)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,1.2fr)_minmax(0,1fr)] items-center gap-3 border-t border-border/50 py-3 first:border-t-0 hover:bg-card">
      <p
        className={`truncate text-right font-semibold tabular-nums ${getWinnerClass(firstValue, secondValue, "first", stat.better)}`}
      >
        {formatStat(firstValue, stat)}
      </p>
      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        {stat.label}
      </p>
      <p
        className={`truncate font-semibold tabular-nums ${getWinnerClass(firstValue, secondValue, "second", stat.better)}`}
      >
        {formatStat(secondValue, stat)}
      </p>
    </div>
  )
}
