import type { FaceitBasicStats, FaceitLifetimeStats } from "@/lib/faceit-types"

type BasicStatDefinition = {
  sourceKeys: string[]
  getValue: (lifetime: FaceitLifetimeStats) => number | null
}

function toNumber(value: FaceitLifetimeStats[string] | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function divide(
  numerator: FaceitLifetimeStats[string] | undefined,
  denominator: FaceitLifetimeStats[string] | undefined
) {
  const top = toNumber(numerator)
  const bottom = toNumber(denominator)

  return top === null || bottom === null || bottom === 0 ? null : top / bottom
}

const BASIC_STAT_DEFINITIONS = {
  kda: {
    sourceKeys: ["Average K/D Ratio"],
    getValue: (lifetime) => toNumber(lifetime["Average K/D Ratio"]),
  },
  avgDamage: {
    sourceKeys: ["Total Damage", "Matches"],
    getValue: (lifetime) =>
      divide(lifetime["Total Damage"], lifetime["Matches"]),
  },
  matches: {
    sourceKeys: ["Matches"],
    getValue: (lifetime) => toNumber(lifetime["Matches"]),
  },
  adr: {
    sourceKeys: ["ADR"],
    getValue: (lifetime) => toNumber(lifetime.ADR),
  },
  avgHeadshot: {
    sourceKeys: ["Average Headshots %"],
    getValue: (lifetime) => toNumber(lifetime["Average Headshots %"]),
  },
  winRate: {
    sourceKeys: ["Win Rate %"],
    getValue: (lifetime) => toNumber(lifetime["Win Rate %"]),
  },
} satisfies Record<string, BasicStatDefinition>

const BASIC_STAT_SOURCE_KEYS = new Set(
  Object.values(BASIC_STAT_DEFINITIONS).flatMap(({ sourceKeys }) => sourceKeys)
)

export function getBasicStats(lifetime: FaceitLifetimeStats): FaceitBasicStats {
  return Object.fromEntries(
    Object.entries(BASIC_STAT_DEFINITIONS).map(([key, definition]) => [
      key,
      definition.getValue(lifetime),
    ])
  ) as FaceitBasicStats
}

export function getAdditionalStats(
  lifetime: FaceitLifetimeStats
): FaceitLifetimeStats {
  return Object.fromEntries(
    Object.entries(lifetime).filter(([key]) => !BASIC_STAT_SOURCE_KEYS.has(key))
  )
}

export type FaceitMatchPlayerStats = {
  stats: Record<string, string | number>
}

export function getBasicStatsFromMatches(
  matches: FaceitMatchPlayerStats[],
  wins: number,
  decidedMatches = matches.length
): FaceitBasicStats {
  let kills = 0
  let deaths = 0
  let totalDamage = 0
  let adrDamage = 0
  let adrRounds = 0
  let unweightedAdrTotal = 0
  let unweightedAdrMatches = 0
  let headshots = 0
  let headshotKills = 0

  for (const { stats } of matches) {
    const matchKills = toNumber(stats.Kills)
    const matchDeaths = toNumber(stats.Deaths)
    const rounds = toNumber(stats.Rounds)
    const matchAdr = toNumber(stats.ADR)
    const damage =
      toNumber(stats.Damage) ??
      toNumber(stats["Total Damage"]) ??
      (matchAdr !== null && rounds !== null ? matchAdr * rounds : null)
    const matchHeadshots = toNumber(stats.Headshots)

    if (matchKills !== null) {
      kills += matchKills
    }

    if (matchDeaths !== null) {
      deaths += matchDeaths
    }

    if (damage !== null) {
      totalDamage += damage
    }

    if (rounds !== null) {
      if (damage !== null) {
        adrDamage += damage
        adrRounds += rounds
      } else if (matchAdr !== null) {
        adrDamage += matchAdr * rounds
        adrRounds += rounds
      }
    }
    if (matchAdr !== null) {
      unweightedAdrTotal += matchAdr
      unweightedAdrMatches += 1
    }

    if (matchHeadshots !== null) {
      headshots += matchHeadshots
    }

    if (matchKills !== null && matchHeadshots !== null) {
      headshotKills += matchKills
    }
  }

  const headshotRate =
    headshotKills > 0 ? (headshots / headshotKills) * 100 : null

  return {
    kda: deaths > 0 ? kills / deaths : null,
    avgDamage: totalDamage > 0 ? totalDamage / matches.length : null,
    adr:
      adrRounds > 0
        ? adrDamage / adrRounds
        : unweightedAdrMatches > 0
          ? unweightedAdrTotal / unweightedAdrMatches
          : null,
    matches: matches.length,
    avgHeadshot: headshotRate,
    winRate:
      decidedMatches > 0 ? (wins / decidedMatches) * 100 : null,
  }
}
