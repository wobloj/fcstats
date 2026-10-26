"use client"

import { Fragment } from "react"
import type { FaceitStatValue } from "@/lib/faceit-types"
import { Separator } from "@workspace/ui/components/separator"

type AdvancedStat = {
  label: string
  sourceKeys: string[]
  suffix?: string
  precision?: number
}

const ADVANCED_STAT_CATEGORIES: {
  title: string
  stats: AdvancedStat[]
}[] = [
  {
    title: "Utility",
    stats: [
      {
        label: "Utility damage success rate",
        sourceKeys: ["Utility damage success rate"],
        suffix: "%",
      },
      {
        label: "Total flash count",
        sourceKeys: ["Total flash count", "Flash count", "Total flashes"],
      },
      {
        label: "Enemies flashed per round",
        sourceKeys: ["Enemies flashed per round"],
        precision: 2,
      },
      { label: "Total enemies flashed", sourceKeys: ["Total enemies flashed"] },
      {
        label: "Utility usage per round",
        sourceKeys: ["Utility usage per round"],
        precision: 2,
      },
      {
        label: "Flash per round",
        sourceKeys: ["Flash per round", "Flashes per round"],
        precision: 2,
      },
      { label: "Total utility count", sourceKeys: ["Total utility count"] },
      {
        label: "Flash success rate",
        sourceKeys: ["Flash success rate"],
        suffix: "%",
      },
      { label: "Total utility damage", sourceKeys: ["Total utility damage"] },
      {
        label: "Total utility successes",
        sourceKeys: ["Total utility successes", "Utility successes"],
      },
    ],
  },
  {
    title: "Entry",
    stats: [
      { label: "Total entry count", sourceKeys: ["Total entry count"] },
      {
        label: "Entry success rate",
        sourceKeys: ["Entry success rate"],
        suffix: "%",
      },
      {
        label: "Total entry wins",
        sourceKeys: ["Total entry wins", "Entry wins"],
      },
      { label: "Entry rate", sourceKeys: ["Entry rate"], suffix: "%" },
    ],
  },
  {
    title: "1vX",
    stats: [
      { label: "Total 1v1 count", sourceKeys: ["Total 1v1 Count"] },
      {
        label: "1v1 rate",
        sourceKeys: ["1v1 rate", "1v1 Win Rate", "1v1 win rate"],
        suffix: "%",
      },
      { label: "Total 1v1 wins", sourceKeys: ["Total 1v1 Wins"] },
      { label: "Total 1v2 count", sourceKeys: ["Total 1v2 Count"] },
      {
        label: "1v2 rate",
        sourceKeys: ["1v2 rate", "1v2 Win Rate", "1v2 win rate"],
        suffix: "%",
      },
      { label: "Total 1v2 wins", sourceKeys: ["Total 1v2 Wins"] },
    ],
  },
  {
    title: "AWP",
    stats: [
      {
        label: "Sniper kill rate",
        sourceKeys: ["Sniper kill rate", "Sniper Kill Rate"],
        suffix: "%",
      },
      {
        label: "Total sniper kills",
        sourceKeys: ["Total sniper kills", "Sniper Kills"],
      },
      {
        label: "Sniper kill rate per round",
        sourceKeys: [
          "Sniper Kill Rate per Round",
          "Sniper kill rate per round",
        ],
        precision: 2,
      },
    ],
  },
]

function getStatValue(stats: Record<string, FaceitStatValue>, keys: string[]) {
  const normalizedStats = new Map(
    Object.entries(stats).map(([key, value]) => [
      key
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""),
      value,
    ])
  )

  return keys
    .map((key) =>
      normalizedStats.get(
        key
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      )
    )
    .find((value) => value !== undefined)
}

function formatStatValue(
  value: FaceitStatValue | undefined,
  suffix = "",
  precision?: number
) {
  if (value === undefined || value === "") {
    return "-"
  }

  if (Array.isArray(value)) {
    return value.join(", ")
  }

  if (typeof value === "number") {
    const formatted =
      precision === undefined ? String(value) : value.toFixed(precision)

    return `${formatted}${suffix}`
  }

  return `${value}${suffix && !value.endsWith("%") ? suffix : ""}`
}

export default function AdvancedStats({
  stats,
  loading,
  error,
}: {
  stats: Record<string, FaceitStatValue> | null
  loading: boolean
  error: string
}) {
  if (loading) {
    return <p className="text-muted-foreground">Loading advanced stats...</p>
  }

  if (error) {
    return (
      <p role="alert" className="text-red-500">
        {error}
      </p>
    )
  }

  if (!stats) {
    return <p className="text-muted-foreground">Brak dostępnych statystyk.</p>
  }

  return (
    <div className="flex flex-row justify-around gap-4 pt-4">
      {ADVANCED_STAT_CATEGORIES.map(({ title, stats: categoryStats }) => (
        <section key={title} className="flex-1 rounded-md bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">{title}</h3>
          <div className="gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categoryStats.map(
              ({ label, sourceKeys, suffix, precision }, index) => {
                const value = formatStatValue(
                  getStatValue(stats, sourceKeys),
                  suffix,
                  precision
                )

                return (
                  <Fragment key={label}>
                    <div className="flex items-start justify-between gap-3 rounded-md p-3">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-right font-semibold">{value}</p>
                    </div>
                    {index < categoryStats.length - 1 && <Separator />}
                  </Fragment>
                )
              }
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
