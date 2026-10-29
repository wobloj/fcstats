"use client"

import { getName } from "country-list"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import COUNTRY_NAME_OVERRIDES from "@/lib/country-name-overrides"
import type { FaceitRankingItem } from "@/lib/faceit-types"
import level1Badge from "@/lib/logo faceit/1.svg"
import level2Badge from "@/lib/logo faceit/2.svg"
import level3Badge from "@/lib/logo faceit/3.svg"
import level4Badge from "@/lib/logo faceit/4.svg"
import level5Badge from "@/lib/logo faceit/5.svg"
import level6Badge from "@/lib/logo faceit/6.svg"
import level7Badge from "@/lib/logo faceit/7.svg"
import level8Badge from "@/lib/logo faceit/8.svg"
import level9Badge from "@/lib/logo faceit/9.svg"
import level10Badge from "@/lib/logo faceit/10.svg"
import challengerBadge from "@/lib/logo faceit/11.svg"

const PLAYER_COUNT = 300
const MAX_ACTIVE_AVATAR_REQUESTS = 6

const REGIONS = [
  { value: "EU", label: "Europe" },
  { value: "NA", label: "North America" },
  { value: "SA", label: "South America" },
  { value: "SEA", label: "Southeast Asia" },
  { value: "OCE", label: "Oceania" },
]

type RankingResponse = {
  items: FaceitRankingItem[]
  challengerElo: number | null
  error?: string
}

type PlayerProfileResponse = {
  playerId: string
  avatar: string | null
}

const SKILL_BADGES = [
  level1Badge,
  level2Badge,
  level3Badge,
  level4Badge,
  level5Badge,
  level6Badge,
  level7Badge,
  level8Badge,
  level9Badge,
  level10Badge,
  challengerBadge,
]

const avatarRequests = new Map<string, Promise<string | null>>()
const queuedAvatarRequests: Array<() => void> = []
let activeAvatarRequests = 0

function getCountryName(countryCode?: string) {
  if (!countryCode) return "—"
  const normalizedCode = countryCode.toUpperCase()
  return (
    COUNTRY_NAME_OVERRIDES[normalizedCode] ??
    getName(normalizedCode) ??
    normalizedCode
  )
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function getPlayerAvatar(playerId: string) {
  const cachedRequest = avatarRequests.get(playerId)
  if (cachedRequest) return cachedRequest

  const request = new Promise<string | null>((resolve, reject) => {
    const startRequest = () => {
      activeAvatarRequests += 1
      void fetch(
        `/api/faceit/player/profile?playerId=${encodeURIComponent(playerId)}`
      )
        .then(async (response) => {
          const result = (await response.json()) as
            PlayerProfileResponse | { error?: string }

          if (!response.ok) {
            throw new Error(
              "error" in result && result.error
                ? result.error
                : "Nie udało się pobrać avatara gracza."
            )
          }

          if (!("avatar" in result) || typeof result.avatar !== "string") {
            return null
          }

          return result.avatar
        })
        .then(resolve, reject)
        .finally(() => {
          activeAvatarRequests -= 1
          const nextRequest = queuedAvatarRequests.shift()
          if (nextRequest) nextRequest()
        })
    }

    if (activeAvatarRequests < MAX_ACTIVE_AVATAR_REQUESTS) {
      startRequest()
    } else {
      queuedAvatarRequests.push(startRequest)
    }
  }).catch((error: unknown) => {
    avatarRequests.delete(playerId)
    throw error
  })

  avatarRequests.set(playerId, request)
  return request
}

function PlayerAvatar({
  player,
  position,
}: {
  player: FaceitRankingItem
  position: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const avatarSize =
    position === 1
      ? "size-16"
      : position === 2
        ? "size-14"
        : position === 3
          ? "size-12"
          : "size-9"

  useEffect(() => {
    const target = containerRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()

        void getPlayerAvatar(player.player_id).then(setAvatar, () =>
          setAvatarError(true)
        )
      },
      { rootMargin: "200px" }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [player.player_id])

  return (
    <div
      ref={containerRef}
      title={avatarError ? "Nie udało się pobrać avatara gracza" : undefined}
    >
      <Avatar className={`${avatarSize} border border-border`}>
        {avatar && <AvatarImage src={avatar} alt={player.nickname} />}
        <AvatarFallback
          className={`bg-muted font-semibold text-foreground ${
            position === 1
              ? "text-base"
              : position === 2
                ? "text-sm"
                : "text-xs"
          }`}
        >
          {getInitials(player.nickname)}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

export default function Leaderboard({
  initialRegion = "EU",
}: {
  initialRegion?: string
}) {
  const router = useRouter()
  const [region, setRegion] = useState(initialRegion)
  const [players, setPlayers] = useState<FaceitRankingItem[]>([])
  const [challengerElo, setChallengerElo] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const selectedRegion = REGIONS.find((item) => item.value === region) ?? {
    value: "EU",
    label: "Europe",
  }
  const leader = players[0]

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
    if (value && REGIONS.some((item) => item.value === value)) {
      setRegion(value)
    }
  }

  return (
    <main className="relative z-10 min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Leaderboards
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ranking in {selectedRegion.label} region
            </p>
          </div>
          <div className="w-full sm:w-56">
            <label
              htmlFor="leaderboard-region"
              className="mb-2 block text-sm font-medium"
            >
              Region
            </label>
            <Select value={region} onValueChange={handleRegionChange}>
              <SelectTrigger id="leaderboard-region" className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.value} — {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <section
          aria-label={`${selectedRegion.label} leaderboard`}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedRegion.label} ranking
              </h2>
              <p className="text-sm text-muted-foreground">
                {players.length} loaded user
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-24 pl-4 sm:pl-6">Position</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-center">Skill level</TableHead>
                <TableHead className="pr-4 text-right sm:pr-6">ELO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow
                  key={player.player_id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Zobacz statystyki gracza ${player.nickname}`}
                  onClick={() =>
                    router.push(
                      `/?nickname=${encodeURIComponent(player.nickname)}`
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      router.push(
                        `/?nickname=${encodeURIComponent(player.nickname)}`
                      )
                    }
                  }}
                  className={`cursor-pointer border-b border-border/70 hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring ${
                    player.position === 1
                      ? "text-lg"
                      : player.position === 2
                        ? "text-base"
                        : player.position === 3
                          ? "text-[0.95rem]"
                          : ""
                  }`}
                >
                  <TableCell
                    className={`py-4 pl-4 font-semibold tabular-nums sm:pl-6 ${
                      player.position === 1
                        ? "py-7"
                        : player.position === 2
                          ? "py-6"
                          : player.position === 3
                            ? "py-5"
                            : ""
                    }`}
                  >
                    <span
                      className={
                        player.position === 1
                          ? "text-2xl"
                          : player.position === 2
                            ? "text-xl"
                            : player.position === 3
                              ? "text-lg"
                              : "text-muted-foreground"
                      }
                    >
                      #{player.position}
                    </span>
                  </TableCell>
                  <TableCell
                    className={
                      player.position <= 3
                        ? player.position === 1
                          ? "py-7"
                          : player.position === 2
                            ? "py-6"
                            : "py-5"
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        player={player}
                        position={player.position}
                      />
                      <span
                        className={`font-medium ${
                          player.position === 1
                            ? "text-xl font-bold"
                            : player.position === 2
                              ? "text-lg font-semibold"
                              : player.position === 3
                                ? "text-base font-semibold"
                                : ""
                        }`}
                      >
                        {player.nickname}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={
                      player.position <= 3
                        ? player.position === 1
                          ? "py-7"
                          : player.position === 2
                            ? "py-6"
                            : "py-5"
                        : undefined
                    }
                  >
                    <span
                      className={`flex items-center gap-2 ${
                        player.position === 1
                          ? "text-base"
                          : player.position === 2
                            ? "text-sm"
                            : "text-xs sm:text-sm"
                      }`}
                    >
                      {player.country && (
                        <span
                          aria-label={getCountryName(player.country)}
                          className={`fi fi-${player.country.toLowerCase()} rounded-sm`}
                        />
                      )}
                      {getCountryName(player.country)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-center ${
                      player.position === 1
                        ? "py-7"
                        : player.position === 2
                          ? "py-6"
                          : player.position === 3
                            ? "py-5"
                            : ""
                    }`}
                  >
                    {(() => {
                      const playerLevel =
                        player.skill_level ?? player.game_skill_level
                      const level =
                        challengerElo !== null &&
                        player.faceit_elo >= challengerElo
                          ? 11
                          : playerLevel
                      const badge = level ? SKILL_BADGES[level - 1] : undefined

                      return badge ? (
                        <Image
                          src={badge}
                          alt={`${challengerElo ? `FACEIT Level Challenger` : `FACEIT Level ${level}`}`}
                          title={`${challengerElo ? `FACEIT Level Challenger` : `FACEIT Level ${level}`}`}
                          className={`mx-auto ${
                            player.position === 1
                              ? "size-11"
                              : player.position === 2
                                ? "size-10"
                                : player.position === 3
                                  ? "size-9"
                                  : "size-8"
                          }`}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    })()}
                  </TableCell>
                  <TableCell
                    className={`pr-4 text-right font-semibold tabular-nums sm:pr-6 ${
                      player.position === 1
                        ? "py-7 text-xl"
                        : player.position === 2
                          ? "py-6 text-lg"
                          : player.position === 3
                            ? "py-5 text-base"
                            : ""
                    }`}
                  >
                    {player.faceit_elo.toLocaleString("en-US")}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && players.length === 0 && !error && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Brak graczy w rankingu tego regionu.
                  </TableCell>
                </TableRow>
              )}
              {isLoading && players.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Ładowanie rankingu…
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p role="alert" className="mb-3 text-sm text-destructive">
                      {error}
                    </p>
                    {!players.length && (
                      <Button
                        variant="outline"
                        onClick={() => setReloadKey((current) => current + 1)}
                      >
                        Spróbuj ponownie
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  )
}
