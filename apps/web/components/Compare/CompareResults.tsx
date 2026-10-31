import { Swords } from "lucide-react"
import { COMPARISON_CATEGORIES } from "./comparison-config"
import ComparisonStatRow from "./ComparisonStatRow"
import MapComparison from "./MapComparison"
import PlayerHeading from "./PlayerHeading"
import type { CompareResult } from "./types"

export default function CompareResults({
  comparison,
}: {
  comparison: CompareResult
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3 rounded-xl border border-border/70 bg-card/80 p-4 sm:gap-6 sm:p-6">
        <PlayerHeading player={comparison.first} side="left" />
        <Swords aria-hidden="true" className="size-5 text-primary sm:size-6" />
        <PlayerHeading player={comparison.second} side="right" />
      </div>

      {COMPARISON_CATEGORIES.map((category) => (
        <section
          key={category.title}
          className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-6"
        >
          <h2 className="mb-3 text-lg font-semibold">{category.title}</h2>
          {category.title === "Utility" &&
            (comparison.first.advancedStatsError ||
              comparison.second.advancedStatsError) && (
              <div className="mb-3 space-y-1 text-sm text-muted-foreground">
                {comparison.first.advancedStatsError && (
                  <p>
                    {comparison.first.profile.player.nickname}:{" "}
                    {comparison.first.advancedStatsError}
                  </p>
                )}
                {comparison.second.advancedStatsError && (
                  <p>
                    {comparison.second.profile.player.nickname}:{" "}
                    {comparison.second.advancedStatsError}
                  </p>
                )}
              </div>
            )}
          {category.stats.map((stat) => (
            <ComparisonStatRow
              key={stat.label}
              stat={stat}
              first={comparison.first}
              second={comparison.second}
            />
          ))}
        </section>
      ))}
      <MapComparison first={comparison.first} second={comparison.second} />
      <p className="text-center text-xs text-muted-foreground">
        Wyższa wartość jest oznaczona kolorem primary, z wyjątkiem rankingów,
        gdzie wyższe miejsce (niższy numer) wygrywa.
      </p>
    </div>
  )
}
