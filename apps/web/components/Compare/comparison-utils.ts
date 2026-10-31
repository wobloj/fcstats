import type {
  FaceitBasicStats,
  FaceitPlayerData,
  FaceitStatValue,
} from "@/lib/faceit-types"
import type { ComparedPlayer, ComparisonStat } from "./types"

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const result = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(result.error ?? "Nie udało się pobrać danych gracza.")
  }

  return result
}

export async function fetchOptional<T>(url: string) {
  try {
    return { data: await fetchJson<T>(url), error: "" }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się pobrać statystyk.",
    }
  }
}

export function isPlayerData(value: unknown): value is FaceitPlayerData {
  if (typeof value !== "object" || value === null || !("player" in value)) {
    return false
  }

  const player = value.player
  return (
    typeof player === "object" &&
    player !== null &&
    "player_id" in player &&
    typeof player.player_id === "string" &&
    "nickname" in player &&
    typeof player.nickname === "string"
  )
}

export function normalizeStatKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

export function getStatValue(
  player: ComparedPlayer,
  stat: ComparisonStat
): FaceitStatValue | number | null {
  if (stat.source === "basic") {
    const key = stat.sourceKeys[0] as keyof FaceitBasicStats
    return player.profile.basicStats?.[key] ?? null
  }

  if (stat.source === "game") {
    const game = player.profile.player.games?.cs2
    const key = stat.sourceKeys[0] as "faceit_elo" | "skill_level"
    return game?.[key] ?? null
  }

  if (stat.source === "rankings") {
    const key = stat.sourceKeys[0] as "regional" | "global"
    return player.profile.rankings[key]
  }

  if (!player.advancedStats) {
    return null
  }

  const values = new Map(
    Object.entries(player.advancedStats).map(([key, value]) => [
      normalizeStatKey(key),
      value,
    ])
  )

  return (
    stat.sourceKeys
      .map((key) => values.get(normalizeStatKey(key)))
      .find((value) => value !== undefined) ?? null
  )
}

export function getComparableNumber(value: FaceitStatValue | number | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value.replaceAll(",", "").replace("%", "").trim())
  return Number.isFinite(parsed) ? parsed : null
}

export function formatStat(
  value: FaceitStatValue | number | null,
  stat: ComparisonStat
) {
  if (value === null || value === "") {
    return "–"
  }

  if (Array.isArray(value)) {
    return value.join(", ")
  }

  const number = getComparableNumber(value)
  if (number === null) {
    return `${value}${stat.suffix ?? ""}`
  }

  const formatted =
    stat.precision === undefined
      ? String(number)
      : String(Number(number.toFixed(stat.precision)))
  return `${stat.prefix ?? ""}${formatted}${stat.suffix ?? ""}`
}

export function getWinnerClass(
  firstValue: FaceitStatValue | number | null,
  secondValue: FaceitStatValue | number | null,
  side: "first" | "second",
  better: ComparisonStat["better"]
) {
  const first = getComparableNumber(firstValue)
  const second = getComparableNumber(secondValue)

  if (first === null || second === null || first === second) {
    return "text-foreground"
  }

  const firstWins = better === "higher" ? first > second : first < second
  const isWinner = side === "first" ? firstWins : !firstWins
  return isWinner ? "text-primary" : "text-foreground"
}
