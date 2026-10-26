"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@workspace/ui/components/combobox"
import PlayerTab from "@/components/PlayerStats/PlayerTab"
import MatchHistoryCard from "@/components/PlayerStats/MatchHistoryCard"
import RecentMatches from "@/components/Home/RecentMatches"
import AdvancedStats from "@/components/Home/AdvancedStats"
import MapStats from "@/components/Home/MapStats"
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
  FaceitAdditionalStatsData,
  FaceitPlayerData,
  FaceitStatValue,
  FaceitStatsRange,
  FaceitStatsRangeData,
} from "@/lib/faceit-types"
import Loading from "../Loading"

const MAP_OPTIONS = [
  "Ancient",
  "Anubis",
  "Assault",
  "Aztec",
  "Basalt",
  "Breach",
  "Cache",
  "Cobblestone",
  "Dust II",
  "Engage",
  "Inferno",
  "Italy",
  "Mirage",
  "Nuke",
  "Office",
  "Overpass",
  "Ruby",
  "Season",
  "Shortdust",
  "Train",
  "Tuscan",
  "Vertigo",
  "Zoo",
]

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
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false)
  const [advancedStats, setAdvancedStats] = useState<Record<
    string,
    FaceitStatValue
  > | null>(null)
  const [loadingAdvancedStats, setLoadingAdvancedStats] = useState(true)
  const [advancedStatsError, setAdvancedStatsError] = useState("")
  const [history, setHistory] = useState(data.history)
  const [historyHasMore, setHistoryHasMore] = useState(data.historyHasMore)
  const [historyNextOffset, setHistoryNextOffset] = useState(
    data.history?.length ?? 0
  )
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [selectedMaps, setSelectedMaps] = useState<string[]>([])
  const historyRequestId = useRef(0)
  const currentPlayerId = useRef(data.player.player_id)
  currentPlayerId.current = data.player.player_id
  const selectedStats =
    range === "lifetime" ? data.basicStats : rangeData[range]?.basicStats
  useEffect(() => {
    setHistory(data.history)
    setHistoryHasMore(data.historyHasMore)
    setHistoryNextOffset(data.history?.length ?? 0)
    setHistoryError("")
    setLoadingMoreHistory(false)
    setSelectedMaps([])
    historyRequestId.current += 1
  }, [data.history, data.historyHasMore, data.player.player_id])

  useEffect(() => {
    let cancelled = false

    async function loadAdvancedStats() {
      setLoadingAdvancedStats(true)
      setAdvancedStats(null)
      setAdvancedStatsError("")

      try {
        const response = await fetch(
          `/api/faceit/player/stats?nickname=${encodeURIComponent(data.player.nickname)}`
        )
        const result = (await response.json()) as
          FaceitAdditionalStatsData | { error?: string }

        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Nie udało się pobrać statystyk zaawansowanych."
          )
        }

        if (!("stats" in result)) {
          throw new Error("Odpowiedź API nie zawiera statystyk.")
        }

        if (!cancelled) {
          setAdvancedStats(result.stats)
        }
      } catch (error) {
        if (!cancelled) {
          setAdvancedStatsError(
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać statystyk zaawansowanych."
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingAdvancedStats(false)
        }
      }
    }

    void loadAdvancedStats()

    return () => {
      cancelled = true
    }
  }, [data.player.nickname, data.player.player_id])

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

  async function loadHistoryPage(
    maps: string[],
    offset: number,
    append: boolean
  ) {
    const requestId = ++historyRequestId.current
    setLoadingMoreHistory(true)
    setHistoryError("")

    try {
      const params = new URLSearchParams({
        playerId: data.player.player_id,
        offset: String(offset),
      })
      maps.forEach((map) => params.append("map", map))
      const response = await fetch(`/api/faceit/player/history?${params}`)
      const result = (await response.json()) as
        | {
            matches: NonNullable<FaceitPlayerData["history"]>
            hasMore: boolean
            nextOffset: number
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

      if (
        currentPlayerId.current !== data.player.player_id ||
        requestId !== historyRequestId.current
      ) {
        return
      }

      setHistory((previous) =>
        append && previous !== null
          ? [...previous, ...result.matches]
          : result.matches
      )
      setHistoryNextOffset(result.nextOffset)
      setHistoryHasMore(result.hasMore)
    } catch (error) {
      if (
        currentPlayerId.current === data.player.player_id &&
        requestId === historyRequestId.current
      ) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać kolejnych meczów."
        )
      }
    } finally {
      if (
        currentPlayerId.current === data.player.player_id &&
        requestId === historyRequestId.current
      ) {
        setLoadingMoreHistory(false)
      }
    }
  }

  function updateSelectedMaps(maps: string[]) {
    setSelectedMaps(maps)
    setHistory([])
    setHistoryNextOffset(0)
    setHistoryHasMore(true)
    void loadHistoryPage(maps, 0, false)
  }

  function loadMoreMatches() {
    if (loadingMoreHistory || history === null || !historyHasMore) {
      return
    }

    void loadHistoryPage(selectedMaps, historyNextOffset, true)
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
        <h2 className="text-2xl font-semibold">Advanced Stats</h2>
        <div className="relative">
          <div
            id="advanced-stats-content"
            className={
              advancedStatsOpen
                ? ""
                : "max-h-[25vh] overflow-hidden"
            }
          >
            <AdvancedStats
              stats={advancedStats}
              loading={loadingAdvancedStats}
              error={advancedStatsError}
            />
            {advancedStatsOpen && (
              <MapStats playerId={data.player.player_id} />
            )}
          </div>
          {!advancedStatsOpen && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-secondary"
            />
          )}
          <div
            className={
              advancedStatsOpen
                ? "mt-2 flex justify-center"
                : "absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center"
            }
          >
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={
                advancedStatsOpen
                  ? "Collapse advanced stats"
                  : "Expand advanced stats"
              }
              aria-expanded={advancedStatsOpen}
              aria-controls="advanced-stats-content"
              onClick={() => setAdvancedStatsOpen((open) => !open)}
              className="rounded-full border-0 bg-background shadow-md hover:bg-background"
            >
              {advancedStatsOpen ? (
                <ChevronUp aria-hidden="true" />
              ) : (
                <ChevronDown aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Last matches</h2>
          <Combobox
            multiple
            value={selectedMaps}
            onValueChange={updateSelectedMaps}
            items={MAP_OPTIONS}
          >
            <ComboboxInput
              placeholder="Filter maps"
              aria-label="Filter matches by map"
              className="w-56"
            >
              <ComboboxValue>
                {(value) =>
                  Array.isArray(value) ? value.join(", ") : undefined
                }
              </ComboboxValue>
            </ComboboxInput>
            <ComboboxContent>
              <ComboboxList>
                {MAP_OPTIONS.map((map) => (
                  <ComboboxItem key={map} value={map}>
                    {map}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No maps found.</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {history === null ? (
          <p className="text-gray-500">Nie udało się pobrać historii meczów.</p>
        ) : history.length === 0 && loadingMoreHistory ? (
          <p className="text-gray-500">Loading matches...</p>
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
                      <span>
                        Załadowano {history.length} meczów
                        {loadingMoreHistory ? " (ładowanie...)" : ""}
                      </span>
                      {historyHasMore && (
                        <Button
                          onClick={loadMoreMatches}
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
