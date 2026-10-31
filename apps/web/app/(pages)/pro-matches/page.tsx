import type { Metadata } from "next"
import ProMatches from "@/components/ProMatches/ProMatches"

export const metadata: Metadata = {
  title: "FCStats - Matches",
  description:
    "Follow live Counter-Strike 2 matches, check upcoming fixtures, and review recent results, maps, and team lineups.",
}

export default function ProMatchesPage() {
  return <ProMatches />
}
