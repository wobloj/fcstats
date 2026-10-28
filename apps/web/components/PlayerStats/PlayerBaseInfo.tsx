import { getName } from "country-list"
import type { FaceitGame, FaceitPlayerData } from "@/lib/faceit-types"
import Image from "next/image"
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
import {
  ExternalLink,
  Clock,
  Flame,
  Gamepad2,
  Verified,
  HeartCrack,
} from "lucide-react"
import { Progress } from "@workspace/ui/components/progress"

const LEVEL_BADGES = [
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
] as const

const ELO_LEVELS = [
  { level: 1, minimum: 100, maximum: 800 },
  { level: 2, minimum: 801, maximum: 950 },
  { level: 3, minimum: 951, maximum: 1100 },
  { level: 4, minimum: 1101, maximum: 1250 },
  { level: 5, minimum: 1251, maximum: 1400 },
  { level: 6, minimum: 1401, maximum: 1550 },
  { level: 7, minimum: 1551, maximum: 1700 },
  { level: 8, minimum: 1701, maximum: 1850 },
  { level: 9, minimum: 1851, maximum: 2000 },
  { level: 10, minimum: 2001, maximum: null },
] as const

const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  KR: "South Korea",
}

function getLevelProgress(elo: number, challengerElo: number | null) {
  const currentLevel = ELO_LEVELS.find(
    ({ maximum }) => maximum === null || elo <= maximum
  )
  if (!currentLevel) {
    return null
  }

  if (currentLevel.maximum === null) {
    if (challengerElo === null) {
      return {
        level: currentLevel.level,
        progress: null,
        remaining: null,
        nextLevel: null,
        maximum: false,
      }
    }

    if (elo >= challengerElo) {
      return {
        level: currentLevel.level,
        progress: 100,
        remaining: null,
        nextLevel: null,
        maximum: true,
      }
    }

    const levelSpan = challengerElo - currentLevel.minimum

    return {
      level: currentLevel.level,
      progress:
        levelSpan > 0
          ? Math.max(
              0,
              Math.min(100, ((elo - currentLevel.minimum) / levelSpan) * 100)
            )
          : 0,
      remaining: challengerElo - elo,
      nextLevel: null,
      maximum: false,
    }
  }

  if (elo < currentLevel.minimum) {
    return {
      level: currentLevel.level,
      progress: 0,
      remaining: currentLevel.minimum - elo,
      nextLevel: currentLevel.level,
      maximum: false,
    }
  }

  const nextLevelThreshold = currentLevel.maximum + 1
  const levelSpan = nextLevelThreshold - currentLevel.minimum

  return {
    level: currentLevel.level,
    progress: Math.min(100, ((elo - currentLevel.minimum) / levelSpan) * 100),
    remaining: Math.max(0, nextLevelThreshold - elo),
    nextLevel: currentLevel.level + 1,
    maximum: false,
  }
}

export default function PlayerBaseInfo({
  data,
  game,
  hasAvatar,
}: {
  data: FaceitPlayerData
  game?: FaceitGame
  hasAvatar: boolean
}) {
  const countryCode = data.player.country
  const country =
    countryCode && /^[a-z]{2}$/i.test(countryCode)
      ? {
          name:
            COUNTRY_NAME_OVERRIDES[countryCode.toUpperCase()] ??
            getName(countryCode),
          code: countryCode.toLowerCase(),
        }
      : undefined

  const verified = data.player.verified ?? data.player.is_verified
  const joinedAt = data.player.activated_at ?? data.player.created_at
  const joinedDate =
    joinedAt && !Number.isNaN(Date.parse(joinedAt))
      ? new Date(joinedAt).getFullYear()
      : "Brak danych"
  const steamId = [
    data.player.steam_id_64,
    data.player.new_steam_id,
    data.player.platforms?.steam,
  ].find((value) => value && /^\d{17}$/.test(value))

  const latestResult = data.history?.[0]?.result
  let streakCount = 0
  if (latestResult) {
    for (const match of data.history ?? []) {
      if (match.result !== latestResult) {
        break
      }
      streakCount += 1
    }
  }
  const streakContinues =
    streakCount > 0 &&
    streakCount === data.history?.length &&
    data.historyHasMore
  const streakLabel =
    streakCount > 0
      ? `${streakCount}${streakContinues ? "+" : ""} ${
          latestResult === "win" ? "WINSTREAK" : "LOSESTREAK"
        }`
      : "Brak danych"
  const streakColor =
    latestResult === "win"
      ? "text-green-600 bg-green-900/60 px-2 py-1 dark:text-green-400"
      : latestResult === "lose"
        ? "text-red-600 bg-red-900/60 px-2 py-1 dark:text-red-400"
        : "text-muted-foreground"
  const rankingRegion = data.rankings.region ?? game?.region
  const rankingCountry = data.player.country?.toUpperCase()
  const currentElo = game?.faceit_elo
  const challengerElo = data.rankings.challengerElo
  const levelProgress =
    typeof currentElo === "number" && Number.isFinite(currentElo)
      ? getLevelProgress(currentElo, challengerElo)
      : null

  return (
    <div className="contents md:flex md:min-w-0 md:flex-1 md:flex-row md:justify-between">
      <div className="contents md:block md:min-w-0 md:flex-1">
        <div
          className={`row-start-1 mb-2 flex min-w-0 flex-row items-center gap-2 md:col-auto md:row-auto ${
            hasAvatar ? "col-start-2" : "col-span-full"
          }`}
        >
          <h2 className="text-2xl font-bold md:text-4xl">
            {data.player.nickname}
          </h2>
          {verified === undefined ? (
            ""
          ) : (
            <span
              className={
                verified
                  ? "text-orange-300 dark:text-orange-300"
                  : "text-muted-foreground"
              }
            >
              {verified ? (
                <div className="flex flex-row items-center gap-1">
                  <Verified size={24} />
                </div>
              ) : (
                ""
              )}
            </span>
          )}
        </div>
        <div className="col-span-full row-start-2 flex w-full flex-col items-stretch gap-3 text-sm md:col-auto md:row-auto md:flex-row md:items-center">
          {country?.name && (
            <div className="w-full flex-1 rounded-md bg-secondary p-2 md:w-fit">
              <p className="text-muted-foreground">
                <span
                  className={`fi fi-${country.code}`}
                  role="img"
                  aria-label={`${country.name} flag`}
                />{" "}
                {country.name}
              </p>
            </div>
          )}
          <div className="w-full flex-1 rounded-md bg-secondary p-2 md:w-fit">
            <p className="flex flex-row items-center gap-1 text-muted-foreground">
              <Clock size={16} />
              Member Since {joinedDate}
            </p>
          </div>
          {steamId && (
            <div className="mr-8 w-full flex-1 rounded-md bg-secondary p-2 md:w-fit">
              <p className="flex flex-row items-center gap-1">
                <Gamepad2 size={16} />
                Steam:{" "}
                <a
                  className="flex flex-row gap-2 hover:text-primary"
                  href={`https://steamcommunity.com/profiles/${steamId}`}
                  target="_blank"
                  rel="noreferrer"
                  title={steamId}
                >
                  {steamId.length > 10 ? `${steamId.slice(0, 10)}...` : steamId}
                  <ExternalLink size={16} />
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="contents md:mt-4 md:flex md:items-center md:gap-3 md:text-sm">
          <div className="col-span-full row-start-3 mt-4 flex items-center gap-3 text-sm md:col-auto md:row-auto md:mt-0">
            <p
              className={`flex w-full flex-row justify-center gap-2 font-medium md:w-fit md:justify-start ${streakColor}`}
            >
              {latestResult === "win" ? (
                <Flame size={16} />
              ) : (
                <HeartCrack size={16} />
              )}
              {streakLabel}
            </p>
          </div>
          <div className="col-span-full row-start-4 min-w-0 md:col-auto md:row-auto">
            <div className="flex flex-row flex-wrap justify-center gap-2 text-sm md:justify-start">
              <div className="flex flex-row gap-1 font-extralight md:gap-4">
                <p>
                  Rank: {rankingRegion ? ` ${rankingRegion.toUpperCase()}` : ""}
                </p>
                {data.rankings.global === null
                  ? "Brak danych"
                  : `#${data.rankings.global.toLocaleString("pl-PL")}`}
              </div>
              {" | "}
              <div className="flex flex-row gap-1 font-extralight md:gap-4">
                <p>Regional: {rankingCountry ? ` ${rankingCountry}` : ""}</p>
                {data.rankings.regional === null
                  ? "Brak danych"
                  : `#${data.rankings.regional.toLocaleString("pl-PL")}`}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-full row-start-5 flex min-w-0 flex-col gap-3 rounded-md bg-background/20 p-4 md:col-auto md:row-auto md:h-full md:w-5/12 md:min-w-64">
        <div>
          <p className="text-sm text-muted-foreground">ELO</p>
          <p className="text-3xl font-bold tabular-nums">
            {typeof currentElo === "number"
              ? currentElo.toLocaleString("pl-PL")
              : "Brak danych"}
          </p>
        </div>
        {levelProgress && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <p className="text-right text-muted-foreground">
                {levelProgress.maximum
                  ? "Maksymalny poziom"
                  : levelProgress.progress === null
                    ? "Próg Challengera niedostępny"
                    : levelProgress.remaining === null
                      ? "Maksymalny poziom"
                      : `${levelProgress.remaining.toLocaleString("pl-PL")} ELO do ${
                          levelProgress.nextLevel === null
                            ? "Challengera"
                            : `poziomu ${levelProgress.nextLevel}`
                        }`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src={
                  levelProgress.maximum
                    ? challengerBadge
                    : LEVEL_BADGES[levelProgress.level - 1]
                }
                alt={
                  levelProgress.maximum
                    ? "Challenger"
                    : `Poziom ${levelProgress.level}`
                }
                width={32}
                height={32}
                className="size-8 shrink-0"
              />
              {levelProgress.progress !== null && (
                <Progress
                  value={levelProgress.progress}
                  className="min-w-0 flex-1"
                  aria-label={
                    levelProgress.maximum
                      ? "Maksymalny poziom FACEIT"
                      : levelProgress.nextLevel === null
                        ? "Postęp do progu Challengera"
                        : `Postęp do poziomu ${levelProgress.nextLevel}`
                  }
                />
              )}
              {!levelProgress.maximum && levelProgress.nextLevel !== null && (
                <Image
                  src={LEVEL_BADGES[levelProgress.nextLevel - 1]}
                  alt={`Poziom ${levelProgress.nextLevel}`}
                  width={32}
                  height={32}
                  className="size-8 shrink-0"
                />
              )}
              {!levelProgress.maximum && levelProgress.nextLevel === null && (
                <Image
                  src={challengerBadge}
                  alt="Challenger"
                  width={32}
                  height={32}
                  className="size-8 shrink-0"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
