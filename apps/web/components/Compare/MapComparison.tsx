import {
  formatStat,
  getWinnerClass,
  normalizeStatKey,
} from "./comparison-utils"
import type { ComparedPlayer, ComparisonStat } from "./types"

export default function MapComparison({
  first,
  second,
}: {
  first: ComparedPlayer
  second: ComparedPlayer
}) {
  const firstMaps = new Map(
    (first.mapStats ?? []).map((map) => [normalizeStatKey(map.map), map])
  )
  const secondMaps = new Map(
    (second.mapStats ?? []).map((map) => [normalizeStatKey(map.map), map])
  )
  const maps = [...new Set([...firstMaps.keys(), ...secondMaps.keys()])].sort()

  return (
    <section className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-6">
      <h2 className="mb-3 text-lg font-semibold">Map Stats</h2>
      {first.mapStatsError && (
        <p className="mb-2 text-sm text-muted-foreground">
          {first.profile.player.nickname}: {first.mapStatsError}
        </p>
      )}
      {second.mapStatsError && (
        <p className="mb-2 text-sm text-muted-foreground">
          {second.profile.player.nickname}: {second.mapStatsError}
        </p>
      )}
      {maps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Brak dostępnych statystyk map.
        </p>
      ) : (
        <div>
          {maps.map((mapKey) => {
            const firstMap = firstMaps.get(mapKey)
            const secondMap = secondMaps.get(mapKey)
            const firstRate = firstMap?.winRate ?? null
            const secondRate = secondMap?.winRate ?? null
            const stat: ComparisonStat = {
              label: firstMap?.map ?? secondMap?.map ?? mapKey,
              source: "basic",
              sourceKeys: [],
              suffix: "%",
              precision: 1,
              better: "higher",
            }

            return (
              <div
                key={mapKey}
                className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,1.2fr)_minmax(0,1fr)] items-center gap-3 border-t border-border/50 py-3 first:border-t-0 hover:bg-card"
              >
                <p
                  className={`text-right font-semibold tabular-nums ${getWinnerClass(firstRate, secondRate, "first", "higher")}`}
                >
                  {firstMap
                    ? `${formatStat(firstRate, stat)} (${firstMap.wins}/${firstMap.matches})`
                    : "–"}
                </p>
                <p className="text-center text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
                <p
                  className={`font-semibold tabular-nums ${getWinnerClass(firstRate, secondRate, "second", "higher")}`}
                >
                  {secondMap
                    ? `${formatStat(secondRate, stat)} (${secondMap.wins}/${secondMap.matches})`
                    : "–"}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
