"use client"

import { useId } from "react"
import { Area, AreaChart, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

type EloHistoryPoint = {
  label: string
  elo: number
}

const chartConfig = {
  elo: {
    label: "ELO",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export default function RecentEloChart({ data }: { data: EloHistoryPoint[] }) {
  const gradientId = `elo-gradient-${useId().replace(/:/g, "")}`
  const eloValues = data.map(({ elo }) => elo)
  const minimumElo = eloValues.length > 0 ? Math.min(...eloValues) : 0
  const maximumElo = eloValues.length > 0 ? Math.max(...eloValues) : 0
  const rangePadding = Math.max((maximumElo - minimumElo) * 0.1, 5)
  const eloDomain: [number, number] = [
    minimumElo - rangePadding,
    maximumElo + rangePadding,
  ]
  const firstElo = data[0]?.elo
  const lastElo = data.at(-1)?.elo
  const eloChange =
    firstElo !== undefined && lastElo !== undefined ? lastElo - firstElo : 0
  const changeColorClass =
    eloChange > 0
      ? "text-green-600 dark:text-green-400"
      : eloChange < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"
  const formattedChange = `${eloChange > 0 ? "+" : ""}${eloChange.toLocaleString("pl-PL")} ELO`

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <p className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">
        Rating Trajectory:
      </p>
      <ChartContainer config={chartConfig} className="h-15 min-w-0 flex-1">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <YAxis hide domain={eloDomain} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-elo)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-elo)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="elo"
            type="natural"
            fill={`url(#${gradientId})`}
            fillOpacity={0.4}
            stroke="var(--color-elo)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--color-elo)",
              stroke: "var(--color-elo)",
            }}
          />
        </AreaChart>
      </ChartContainer>
      <p
        className={`shrink-0 text-sm font-semibold whitespace-nowrap ${changeColorClass}`}
      >
        {data.length > 0 ? formattedChange : "—"}
      </p>
    </div>
  )
}
