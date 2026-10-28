"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import RecentEloChart from "@/components/Home/RecentEloChart"
import type { FaceitMatchHistoryItem } from "@/lib/faceit-types"
import Loading from "../Loading"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

const chartConfig = {
  value: {
    label: "Match",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export default function RecentMatches({
  playerId,
  currentElo,
}: {
  playerId: string
  currentElo?: number
}) {
  const [matches, setMatches] = useState<FaceitMatchHistoryItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadRecentMatches() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch(
          `/api/faceit/player/history?playerId=${encodeURIComponent(playerId)}&offset=0&limit=20`
        )
        const result = (await response.json()) as
          | {
              matches: FaceitMatchHistoryItem[]
              hasMore: boolean
            }
          | { error?: string }

        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Nie udało się pobrać ostatnich meczów."
          )
        }

        if (!("matches" in result) || !Array.isArray(result.matches)) {
          throw new Error("Odpowiedź API nie zawiera historii meczów.")
        }

        if (!cancelled) {
          setMatches(result.matches)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać ostatnich meczów."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRecentMatches()

    return () => {
      cancelled = true
    }
  }, [playerId])

  const recentMatches = matches ?? []
  const wins = recentMatches.filter((match) => match.result === "win").length
  const losses = recentMatches.filter((match) => match.result === "lose").length
  const chartData = recentMatches.map((match, index) => ({
    matchId: match.match_id,
    value: 1,
    result: match.result,
    score: match.score,
    map: match.map,
    label: `Match ${index + 1}`,
  }))
  const eloHistory = useMemo(() => {
    if (recentMatches.length === 0) {
      return []
    }

    const deltaByResult = { win: 25, lose: -25 } as const
    const netChange = recentMatches.reduce(
      (total, match) =>
        match.result === "win" || match.result === "lose"
          ? total + deltaByResult[match.result]
          : total,
      0
    )
    let runningElo = (currentElo ?? 0) - netChange

    return [...recentMatches].reverse().map((match, index) => {
      if (match.result === "win" || match.result === "lose") {
        runningElo += deltaByResult[match.result]
      }

      return {
        label: `#${recentMatches.length - index}`,
        elo: runningElo,
      }
    })
  }, [currentElo, recentMatches])

  return (
    <section className="flex w-full flex-col gap-4 rounded-md bg-card p-4 md:flex-row md:items-center">
      {loading ? (
        <div
          role="status"
          className="flex min-h-20 w-full items-center justify-center"
        >
          <Loading customName="Loading matches results" />
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-sm text-muted-foreground">
              Recent 20 matches: {wins}W - {losses}L
            </p>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            {!error && recentMatches.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Brak meczów do wyświetlenia.
              </p>
            )}
            {!error && recentMatches.length > 0 && (
              <ChartContainer
                config={chartConfig}
                className="h-5 w-full md:w-1/2"
              >
                <BarChart
                  accessibilityLayer
                  data={chartData.reverse()}
                  margin={{ left: 4, right: 4, top: 0, bottom: 0 }}
                  barCategoryGap={2}
                >
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={[0, 1]} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        hideIndicator
                        formatter={(_, __, item) => {
                          const match = item.payload
                          const result =
                            match.result === "win"
                              ? "Win"
                              : match.result === "lose"
                                ? "Loss"
                                : "Match"
                          const score = match.score
                            ? `${match.score.player}:${match.score.opponent}`
                            : "Score unavailable"

                          return (
                            <span>
                              {result} · {score}
                              {match.map ? ` · ${match.map}` : ""}
                            </span>
                          )
                        }}
                      />
                    }
                  />
                  <Bar dataKey="value" name="Result" radius={1}>
                    {chartData.map((match) => (
                      <Cell
                        key={`${match.matchId}-bar`}
                        fill={
                          match.result === "win"
                            ? "var(--color-green-500)"
                            : match.result === "lose"
                              ? "var(--color-red-500)"
                              : "var(--color-muted)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
          <div className="flex min-w-0 flex-1 justify-end">
            <RecentEloChart data={eloHistory} />
          </div>
        </>
      )}
    </section>
  )
}
