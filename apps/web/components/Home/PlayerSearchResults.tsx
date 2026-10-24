"use client"

import { useEffect, useRef, useState } from "react"
import PlayerTab from "@/components/PlayerStats/PlayerTab"
import MatchHistoryCard from "@/components/PlayerStats/MatchHistoryCard"
import RecentMatches from "@/components/Home/RecentMatches"
import { Button } from "@workspace/ui/components/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type {
  FaceitPlayerData,
  FaceitStatsRange,
  FaceitStatsRangeData,
} from "@/lib/faceit-types"
import Loading from "../Loading"

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

export default function PlayerSearchResults({
  data,
}: {
  data: FaceitPlayerData
}) {
  const game = data.player.games?.cs2
  const [range, setRange] = useState<FaceitStatsRange>("lifetime")
  const [rangeData, setRangeData] = useState<
    Partial<Record<Exclude<FaceitStatsRange, "lifetime">, FaceitStatsRangeData>>
  >({})
  const [loadingRange, setLoadingRange] = useState(false)
  const [rangeError, setRangeError] = useState("")
  const [history, setHistory] = useState(data.history)
  const [historyHasMore, setHistoryHasMore] = useState(data.historyHasMore)
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const currentPlayerId = useRef(data.player.player_id)
  currentPlayerId.current = data.player.player_id
  const selectedStats =
    range === "lifetime" ? data.basicStats : rangeData[range]?.basicStats

  useEffect(() => {
    setHistory(data.history)
    setHistoryHasMore(data.historyHasMore)
    setHistoryError("")
    setLoadingMoreHistory(false)
  }, [data.history, data.historyHasMore, data.player.player_id])

  useEffect(() => {
    if (range === "lifetime" || rangeData[range]) {
      return
    }

    let cancelled = false

    async function loadRange() {
      setLoadingRange(true)
      setRangeError("")

      try {
        const response = await fetch(
          `/api/faceit/player/stats/range?playerId=${encodeURIComponent(data.player.player_id)}&range=${range}`
        )
        const result = (await response.json()) as
          FaceitStatsRangeData | { error?: string }

        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Nie udało się pobrać statystyk."
          )
        }

        if (!("basicStats" in result)) {
          throw new Error("Odpowiedź API nie zawiera statystyk.")
        }

        if (!cancelled) {
          setRangeData((previous) => ({ ...previous, [range]: result }))
        }
      } catch (error) {
        if (!cancelled) {
          setRangeError(
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać statystyk."
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingRange(false)
        }
      }
    }

    void loadRange()

    return () => {
      cancelled = true
    }
  }, [data.player.player_id, range, rangeData])

  async function loadMoreMatches() {
    if (loadingMoreHistory || history === null) {
      return
    }

    const requestedPlayerId = data.player.player_id
    setLoadingMoreHistory(true)
    setHistoryError("")

    try {
      const response = await fetch(
        `/api/faceit/player/history?playerId=${encodeURIComponent(requestedPlayerId)}&offset=${history.length}`
      )
      const result = (await response.json()) as
        | {
            matches: NonNullable<FaceitPlayerData["history"]>
            hasMore: boolean
          }
        | { error?: string }

      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Nie udało się pobrać kolejnych meczów."
        )
      }

      if (!("matches" in result) || !Array.isArray(result.matches)) {
        throw new Error("Odpowiedź API nie zawiera historii meczów.")
      }

      if (currentPlayerId.current !== requestedPlayerId) {
        return
      }

      setHistory((previous) =>
        previous === null ? result.matches : [...previous, ...result.matches]
      )
      setHistoryHasMore(result.hasMore)
    } catch (error) {
      if (currentPlayerId.current === requestedPlayerId) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać kolejnych meczów."
        )
      }
    } finally {
      if (currentPlayerId.current === requestedPlayerId) {
        setLoadingMoreHistory(false)
      }
    }
  }

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
      label: "AVG Headshot %",
      value: selectedStats?.avgHeadshot,
      suffix: "%",
    },
    { label: "ADR", value: selectedStats?.adr, suffix: "" },
    {
      label: "AVG Damage",
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
    <>
      <PlayerTab avatarUrl={data.player.avatar} data={data} game={game} />

      <section className="mb-3">
        <Tabs
          value={range}
          onValueChange={(value) => {
            setRange(value as FaceitStatsRange)
            setLoadingRange(false)
            setRangeError("")
          }}
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
            {loadingRange ? (
              <div role="status" className="text-muted-foreground">
                <Loading
                  customName={`Loading ${range === "lifetime" ? "lifetime" : range}`}
                />
              </div>
            ) : rangeError ? (
              <p role="alert" className="text-red-500">
                {rangeError}
              </p>
            ) : selectedStats ? (
              <div className="flex flex-row gap-4">
                {statCards.map(({ label, value, suffix, valueClassName }) => (
                  <article
                    key={label}
                    className="flex-1 rounded-md bg-card p-4"
                  >
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
                {range === "lifetime" && data.unavailable.stats
                  ? "Nie udało się pobrać statystyk."
                  : "Brak dostępnych statystyk."}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </section>
      <RecentMatches
        key={data.player.player_id}
        playerId={data.player.player_id}
        currentElo={game?.faceit_elo}
      />
      <section>
        <h2 className="mb-3 text-2xl font-semibold">Last matches</h2>

        {history === null ? (
          <p className="text-gray-500">Nie udało się pobrać historii meczów.</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">Brak meczów do wyświetlenia.</p>
        ) : (
          <div className="rounded-md bg-card p-2">
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Result/Map</TableHead>
                  <TableHead>Score </TableHead>
                  <TableHead className="text-center">K-D-A(Ratio)</TableHead>
                  <TableHead className="text-center">ADR</TableHead>
                  <TableHead className="text-end">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((match) => (
                  <MatchHistoryCard key={match.match_id} match={match} />
                ))}
              </TableBody>
              <TableFooter className="bg-card">
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex items-center justify-between">
                      <span>Załadowano {history.length} meczów</span>
                      {historyHasMore && (
                        <Button
                          onClick={() => void loadMoreMatches()}
                          disabled={loadingMoreHistory}
                        >
                          {loadingMoreHistory ? "Ładowanie..." : `Load more`}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
        {historyError && (
          <p role="alert" className="mt-3 text-red-500">
            {historyError}
          </p>
        )}
      </section>
    </>
  )
}
