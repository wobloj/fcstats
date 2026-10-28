"use client"

import { useEffect, useRef, useState } from "react"
import PlayerTab from "@/components/PlayerStats/PlayerTab"
import RecentMatches from "@/components/Home/RecentMatches"
import BasicStatsSection from "@/components/Home/PlayerSearchResults/BasicStatsSection"
import AdvancedStatsSection from "@/components/Home/PlayerSearchResults/AdvancedStatsSection"
import MatchHistorySection from "@/components/Home/PlayerSearchResults/MatchHistorySection"
import type {
  FaceitAdditionalStatsData,
  FaceitPlayerData,
  FaceitStatValue,
  FaceitStatsRange,
  FaceitStatsRangeData,
} from "@/lib/faceit-types"

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

  return (
    <>
      <PlayerTab avatarUrl={data.player.avatar} data={data} game={game} />

      <BasicStatsSection
        range={range}
        onRangeChange={(nextRange) => {
          setRange(nextRange)
          setLoadingRange(false)
          setRangeError("")
        }}
        selectedStats={selectedStats}
        loading={loadingRange}
        error={rangeError}
        statsUnavailable={data.unavailable.stats}
      />
      <RecentMatches
        key={data.player.player_id}
        playerId={data.player.player_id}
        currentElo={game?.faceit_elo}
      />
      <AdvancedStatsSection
        playerId={data.player.player_id}
        stats={advancedStats}
        loading={loadingAdvancedStats}
        error={advancedStatsError}
      />
      <MatchHistorySection
        history={history}
        hasMore={historyHasMore}
        loading={loadingMoreHistory}
        error={historyError}
        selectedMaps={selectedMaps}
        onSelectedMapsChange={updateSelectedMaps}
        onLoadMore={loadMoreMatches}
      />
    </>
  )
}
