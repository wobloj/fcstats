import type { Metadata } from "next"
import Leaderboard from "@/components/Leaderboard/Leaderboard"

const REGIONS = [
  { value: "EU", name: "Europe" },
  { value: "NA", name: "North America" },
  { value: "SA", name: "South America" },
  { value: "SEA", name: "Southeast Asia" },
  { value: "OCE", name: "Oceania" },
]
const DEFAULT_REGION = { value: "EU", name: "Europe" }

type LeaderboardPageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

async function getRegion(searchParams: LeaderboardPageProps["searchParams"]) {
  const { region } = await searchParams
  const requestedRegion = Array.isArray(region) ? region[0] : region
  return (
    REGIONS.find((item) => item.value === requestedRegion) ?? DEFAULT_REGION
  )
}

export async function generateMetadata({
  searchParams,
}: LeaderboardPageProps): Promise<Metadata> {
  const region = await getRegion(searchParams)

  return {
    title: `FCStats - Leaderboard ${region.value}`,
    description: `Explore the FACEIT CS2 leaderboard for ${region.name}. Find top-ranked players, compare regional positions, and look up a player's ranking.`,
  }
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const region = await getRegion(searchParams)

  return <Leaderboard initialRegion={region.value} />
}
