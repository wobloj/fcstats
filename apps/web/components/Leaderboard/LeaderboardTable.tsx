"use client"

import { getName } from "country-list"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
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
import Loading from "../Loading"

type PlayerProfileResponse = {
  playerId: string
  avatar: string | null
}

type PlayerSearchResult = {
  playerId: string
  position: number
  items: FaceitRankingItem[]
}

type LeaderboardTableProps = {
  regionLabel: string
  players: FaceitRankingItem[]
  challengerElo: number | null
  playerSearch: PlayerSearchResult | null
  isLoading: boolean
  error: string
  onRetry: () => void
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

const MAX_ACTIVE_AVATAR_REQUESTS = 6
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

function podiumSpacing(position: number, enabled: boolean) {
  if (!enabled || position > 3) return ""
  return position === 1 ? "py-7" : position === 2 ? "py-6" : "py-5"
}

function LeaderboardRow({
  player,
  challengerElo,
  playerSearchId,
  showPodiumStyles,
  onSelectPlayer,
}: {
  player: FaceitRankingItem
  challengerElo: number | null
  playerSearchId: string | null
  showPodiumStyles: boolean
  onSelectPlayer: (nickname: string) => void
}) {
  const isSearchedPlayer = playerSearchId === player.player_id
  const isPodium = showPodiumStyles && player.position <= 3
  const playerLevel = player.skill_level ?? player.game_skill_level
  const level =
    challengerElo !== null && player.faceit_elo >= challengerElo
      ? 11
      : playerLevel
  const badge = level ? SKILL_BADGES[level - 1] : undefined
  const levelLabel =
    level === 11 ? "FACEIT Level Challenger" : `FACEIT Level ${level}`
  return (
    <TableRow
      role="link"
      tabIndex={0}
      aria-current={isSearchedPlayer ? "true" : undefined}
      aria-label={`Zobacz statystyki gracza ${player.nickname}`}
      onClick={() => onSelectPlayer(player.nickname)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelectPlayer(player.nickname)
        }
      }}
      className={`cursor-pointer border-b border-border/20 hover:bg-muted/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
        isSearchedPlayer
          ? "bg-primary/30 ring-1 ring-primary ring-inset hover:bg-primary/20"
          : ""
      } ${
        isPodium && player.position === 1
          ? "text-lg"
          : isPodium && player.position === 2
            ? "text-base"
            : isPodium && player.position === 3
              ? "text-[0.95rem]"
              : ""
      }`}
    >
      <TableCell
        className={`py-4 pl-4 font-semibold tabular-nums sm:pl-6 ${podiumSpacing(player.position, showPodiumStyles)}`}
      >
        <span
          className={
            isPodium && player.position === 1
              ? "text-2xl"
              : isPodium && player.position === 2
                ? "text-xl"
                : isPodium && player.position === 3
                  ? "text-lg"
                  : "text-muted-foreground"
          }
        >
          #{player.position}
        </span>
      </TableCell>
      <TableCell className={podiumSpacing(player.position, showPodiumStyles)}>
        <div className="flex items-center gap-3">
          <PlayerAvatar player={player} position={player.position} />
          <span
            className={`font-medium ${
              isPodium && player.position === 1
                ? "text-xl font-bold"
                : isPodium && player.position === 2
                  ? "text-lg font-semibold"
                  : isPodium && player.position === 3
                    ? "text-base font-semibold"
                    : ""
            }`}
          >
            {player.nickname}
          </span>
        </div>
      </TableCell>
      <TableCell className={podiumSpacing(player.position, showPodiumStyles)}>
        <span
          className={`flex items-center gap-2 ${
            isPodium && player.position === 1
              ? "text-base"
              : isPodium && player.position === 2
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
        className={`text-center ${podiumSpacing(player.position, showPodiumStyles)}`}
      >
        {badge ? (
          <Image
            src={badge}
            alt={levelLabel}
            title={levelLabel}
            className={`mx-auto ${
              isPodium && player.position === 1
                ? "size-11"
                : isPodium && player.position === 2
                  ? "size-10"
                  : isPodium && player.position === 3
                    ? "size-9"
                    : "size-8"
            }`}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell
        className={`pr-4 text-right font-semibold tabular-nums sm:pr-6 ${
          isPodium && player.position === 1
            ? "py-7 text-xl"
            : isPodium && player.position === 2
              ? "py-6 text-lg"
              : isPodium && player.position === 3
                ? "py-5 text-base"
                : ""
        }`}
      >
        {player.faceit_elo.toLocaleString("en-US")}
      </TableCell>
    </TableRow>
  )
}

function LeaderboardTable({
  regionLabel,
  players,
  challengerElo,
  playerSearch,
  isLoading,
  error,
  onRetry,
}: LeaderboardTableProps) {
  const router = useRouter()
  const handlePlayerSelect = useCallback(
    (nickname: string) =>
      router.push(`/?nickname=${encodeURIComponent(nickname)}`),
    [router]
  )
  const displayedPlayers = playerSearch?.items ?? players
  const showPodiumStyles =
    !playerSearch ||
    playerSearch.position <= 3 ||
    playerSearch.items.some((player) => player.position <= 3)

  return (
    <section
      aria-label={`${regionLabel} leaderboard`}
      className="overflow-hidden rounded-md bg-card"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-background/70">
            <TableHead className="w-24 pl-4 sm:pl-6">Position</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-center">Skill level</TableHead>
            <TableHead className="pr-4 text-right sm:pr-6">ELO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedPlayers.map((player) => (
            <LeaderboardRow
              key={player.player_id}
              player={player}
              challengerElo={challengerElo}
              playerSearchId={playerSearch?.playerId ?? null}
              showPodiumStyles={showPodiumStyles}
              onSelectPlayer={handlePlayerSelect}
            />
          ))}
          {!isLoading && displayedPlayers.length === 0 && !error && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-muted-foreground"
              >
                Brak graczy w rankingu tego regionu.
              </TableCell>
            </TableRow>
          )}
          {isLoading && displayedPlayers.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-muted-foreground"
              >
                <Loading customName="Loading table" />
              </TableCell>
            </TableRow>
          )}
          {error && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <p role="alert" className="mb-3 text-sm text-destructive">
                  {error}
                </p>
                {!displayedPlayers.length && (
                  <Button variant="outline" onClick={onRetry}>
                    Spróbuj ponownie
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  )
}

export default memo(LeaderboardTable)
