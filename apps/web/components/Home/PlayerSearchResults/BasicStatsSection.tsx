"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import type { FaceitBasicStats, FaceitStatsRange } from "@/lib/faceit-types"
import Loading from "@/components/Loading"

function getKdaColorClass(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return ""
  }

  const roundedValue = Number(value.toFixed(2))

  if (roundedValue <= 0.8) {
    return "text-red-600 dark:text-red-400"
  }

  if (roundedValue <= 1.15) {
    return ""
  }

  if (roundedValue <= 1.35) {
    return "text-green-600 dark:text-green-400"
  }

  return "text-amber-600 dark:text-amber-400"
}

export default function BasicStatsSection({
  range,
  onRangeChange,
  selectedStats,
  loading,
  error,
  statsUnavailable,
}: {
  range: FaceitStatsRange
  onRangeChange: (range: FaceitStatsRange) => void
  selectedStats: FaceitBasicStats | null | undefined
  loading: boolean
  error: string
  statsUnavailable: boolean
}) {
  const statCards: {
    label: string
    value: number | null | undefined
    suffix: string
    valueClassName?: string
  }[] = [
    {
      label: "KDA (K/D)",
      value: selectedStats?.kda,
      suffix: "",
      valueClassName: getKdaColorClass(selectedStats?.kda),
    },
    {
      label: "AVG HS %",
      value: selectedStats?.avgHeadshot,
      suffix: "%",
    },
    { label: "ADR", value: selectedStats?.adr, suffix: "" },
    {
      label: "AVG Dmg",
      value: selectedStats?.avgDamage,
      suffix: "",
    },
    {
      label: "Winrate",
      value: selectedStats?.winRate,
      suffix: "%",
    },
    {
      label: "Matches",
      value: selectedStats?.matches,
      suffix: "",
    },
  ]

  return (
    <section className="mb-3">
      <Tabs
        value={range}
        onValueChange={(value) => onRangeChange(value as FaceitStatsRange)}
        className="w-full gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Basic Stats</h2>
          <TabsList aria-label="Zakres statystyk">
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
            <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={range} className="w-full">
          {loading ? (
            <div role="status" className="text-muted-foreground">
              <Loading
                customName={`Loading ${range === "lifetime" ? "lifetime" : range}`}
              />
            </div>
          ) : error ? (
            <p role="alert" className="text-red-500">
              {error}
            </p>
          ) : selectedStats ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
              {statCards.map(({ label, value, suffix, valueClassName }) => (
                <article key={label} className="flex-1 rounded-md bg-card p-4">
                  <p className="text-sm text-gray-500">{label}</p>
                  <p
                    className={`mt-1 text-xl font-semibold ${valueClassName ?? ""}`}
                  >
                    {value === null || value === undefined
                      ? "-"
                      : `${Number(value.toFixed(2))}${suffix}`}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              {range === "lifetime" && statsUnavailable
                ? "Nie udało się pobrać statystyk."
                : "Brak dostępnych statystyk."}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}
