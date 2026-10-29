"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import LeaderboardControls, {
  REGIONS,
} from "@/components/Leaderboard/LeaderboardControls"
import LeaderboardTable from "@/components/Leaderboard/LeaderboardTable"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/toast"
import type { FaceitRankingItem } from "@/lib/faceit-types"

const PLAYER_COUNT = 300
const PLAYER_NOT_IN_REGION_ERROR =
  "Gracz nie ma pozycji w rankingu wybranego regionu."

type RankingResponse = {
  items: FaceitRankingItem[]
  challengerElo: number | null
  error?: string
}

type PlayerSearchResponse = {
  playerId: string
  position: number
  items: FaceitRankingItem[]
  error?: string
}

export default function Leaderboard({
  initialRegion = "EU",
}: {
  initialRegion?: string
}) {
  const [region, setRegion] = useState(initialRegion)
  const [players, setPlayers] = useState<FaceitRankingItem[]>([])
  const [challengerElo, setChallengerElo] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [playerSearch, setPlayerSearch] = useState<PlayerSearchResponse | null>(
    null
  )
  const [playerSearchError, setPlayerSearchError] = useState("")
  const searchAbortControllerRef = useRef<AbortController | null>(null)
  const selectedRegion = REGIONS.find((item) => item.value === region) ?? {
    value: "EU",
    label: "Europe",
  }

  useEffect(() => {
    setRegion(initialRegion)
  }, [initialRegion])

  useEffect(() => {
    const controller = new AbortController()
    setPlayers([])
    setChallengerElo(null)
    setIsLoading(true)
    setError("")

    async function loadInitialPage() {
      try {
        const response = await fetch(
          `/api/faceit/rankings?region=${encodeURIComponent(region)}&offset=0&limit=${PLAYER_COUNT}`,
          { signal: controller.signal }
        )
        const result = (await response.json()) as RankingResponse

        if (!response.ok) {
          throw new Error(result.error ?? "Nie udało się pobrać rankingu.")
        }
        if (!Array.isArray(result.items)) {
          throw new Error("Odpowiedź API zawiera nieprawidłowe dane rankingu.")
        }
        if (
          result.challengerElo !== null &&
          (typeof result.challengerElo !== "number" ||
            !Number.isSafeInteger(result.challengerElo))
        ) {
          throw new Error(
            "Odpowiedź API zawiera nieprawidłowe ELO Challengera."
          )
        }

        setPlayers(result.items)
        setChallengerElo(result.challengerElo)
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać rankingu."
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialPage()
    return () => controller.abort()
  }, [region, reloadKey])

  function handleRegionChange(value: string | null) {
    if (!value || !REGIONS.some((item) => item.value === value)) return

    searchAbortControllerRef.current?.abort()
    setRegion(value)
    setPlayerSearch(null)
    setPlayerSearchError("")
  }

  const handlePlayerSearch = useCallback(
    async (nickname: string) => {
      if (!nickname) return

      setPlayerSearchError("")
      setPlayerSearch(null)
      searchAbortControllerRef.current?.abort()
      const controller = new AbortController()
      searchAbortControllerRef.current = controller

      try {
        const response = await fetch(
          `/api/faceit/rankings/player?region=${encodeURIComponent(region)}&nickname=${encodeURIComponent(nickname)}`,
          { signal: controller.signal }
        )
        const result = (await response.json()) as PlayerSearchResponse

        if (!response.ok) {
          throw new Error(result.error ?? "Nie udało się znaleźć gracza.")
        }
        if (
          typeof result.playerId !== "string" ||
          !Number.isSafeInteger(result.position) ||
          result.position < 1 ||
          !Array.isArray(result.items)
        ) {
          throw new Error("Odpowiedź API zawiera nieprawidłowe dane gracza.")
        }
        setPlayerSearch(result)
      } catch (searchError) {
        if (!controller.signal.aborted) {
          const message =
            searchError instanceof Error
              ? searchError.message
              : "Player is not in this region ranking"

          if (message === PLAYER_NOT_IN_REGION_ERROR) {
            toast.add({
              title: "Player not found",
              description: message,
              type: "error",
            })
          } else {
            setPlayerSearchError(message)
          }
        }
      }
    },
    [region]
  )

  const handlePlayerQuerySearch = useCallback(
    (nickname: string) => {
      setPlayerSearchError("")
      void handlePlayerSearch(nickname)
    },
    [handlePlayerSearch]
  )

  const handleRetry = useCallback(() => {
    setReloadKey((current) => current + 1)
  }, [])

  return (
    <main className="relative z-10 min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Leaderboards - Ranking in {selectedRegion.label}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground/50">
            Look at ranking for each region showing best players during season.
            Find yourself in this ranking simply entering your name in search
            input. You can also click on player to see detailed information
            about him.
          </p>
        </div>

        <LeaderboardControls
          region={region}
          onRegionChange={handleRegionChange}
          onPlayerSearch={handlePlayerQuerySearch}
        />

        {playerSearchError && (
          <p role="alert" className="-mt-5 mb-6 text-sm text-destructive">
            {playerSearchError}
          </p>
        )}

        <LeaderboardTable
          regionLabel={selectedRegion.label}
          players={players}
          challengerElo={challengerElo}
          playerSearch={playerSearch}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
        />
      </div>
    </main>
  )
}
