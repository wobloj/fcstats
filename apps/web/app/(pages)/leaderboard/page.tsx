import Leaderboard from "@/components/Leaderboard/Leaderboard"

const REGIONS = new Set(["EU", "NA", "SA", "SEA", "OCE"])

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string | string[] }>
}) {
  const { region } = await searchParams
  const requestedRegion = Array.isArray(region) ? region[0] : region
  const initialRegion =
    requestedRegion && REGIONS.has(requestedRegion) ? requestedRegion : "EU"

  return <Leaderboard initialRegion={initialRegion} />
}
