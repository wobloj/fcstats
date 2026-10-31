import type { Metadata } from "next"
import Compare from "@/components/Compare/Compare"

type ComparePageProps = {
  searchParams: Promise<{
    player1?: string | string[]
    player2?: string | string[]
  }>
}

function firstParam(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ""
}

export async function generateMetadata({
  searchParams,
}: ComparePageProps): Promise<Metadata> {
  const { player1, player2 } = await searchParams
  const firstPlayer = firstParam(player1)
  const secondPlayer = firstParam(player2)

  if (firstPlayer && secondPlayer) {
    return {
      title: `FCStats - ${firstPlayer} vs ${secondPlayer}`,
      description: `Compare FACEIT CS2 stats for ${firstPlayer} and ${secondPlayer}, including performance, rankings, and map results.`,
    }
  }

  return {
    title: "FCStats - Compare",
    description:
      "Compare FACEIT CS2 player stats, rankings, and map performance side by side.",
  }
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { player1, player2 } = await searchParams

  return (
    <Compare
      initialPlayer1={firstParam(player1)}
      initialPlayer2={firstParam(player2)}
    />
  )
}
