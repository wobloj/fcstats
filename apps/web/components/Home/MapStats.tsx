"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import type { FaceitMapStats, FaceitStatsRange } from "@/lib/faceit-types"
import Loading from "../Loading"

function getWinRateColor(winRate: number) {
  if (winRate <= 40) {
    return "bg-red-500"
  }

  if (winRate <= 55) {
    return "bg-white ring-1 ring-black/10"
  }

  return "bg-green-500"
}

export default function MapStats({ playerId }: { playerId: string }) {
  const [range, setRange] = useState<FaceitStatsRange>("lifetime")
  const [mapStats, setMapStats] = useState<
    Partial<Record<FaceitStatsRange, FaceitMapStats[]>>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (mapStats[range]) {
      return
    }

    let cancelled = false

    async function loadMapStats() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch(
          `/api/faceit/player/stats/maps?playerId=${encodeURIComponent(playerId)}&range=${range}`
        )
        const result = (await response.json()) as
          { maps: FaceitMapStats[] } | { error?: string }

        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Nie udało się pobrać statystyk map."
          )
        }

        if (!("maps" in result) || !Array.isArray(result.maps)) {
          throw new Error("Odpowiedź API nie zawiera statystyk map.")
        }

        if (!cancelled) {
          setMapStats((previous) => ({ ...previous, [range]: result.maps }))
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać statystyk map."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMapStats()

    return () => {
      cancelled = true
    }
  }, [mapStats, playerId, range])

  const currentMapStats = mapStats[range]

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Map Stats</h3>
        <Tabs
          value={range}
          onValueChange={(value) => {
            setRange(value as FaceitStatsRange)
            setError("")
          }}
        >
          <TabsList aria-label="Map stats range">
            <TabsTrigger value="lifetime">Lifetime</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <Loading customName="Loading map stats" />
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : currentMapStats?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentMapStats.map(({ map, matches, wins, winRate }) => (
            <article key={map} className="rounded-md bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex flex-row items-center gap-2">
                  <h4 className="font-medium">{map}</h4>
                  <span className="text-sm text-muted-foreground">
                    {wins}/{matches}
                  </span>
                </div>
                <p className="text-right text-sm font-semibold tabular-nums">
                  {winRate.toFixed(1)}%
                </p>
              </div>
              <div
                role="progressbar"
                aria-label={`${map} win rate`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(winRate)}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={`h-full ${getWinRateColor(winRate)}`}
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Brak danych o rozegranych mapach w tym zakresie.
        </p>
      )}
    </section>
  )
}
