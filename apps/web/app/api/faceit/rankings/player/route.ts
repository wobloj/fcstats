import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"
import type { FaceitRankingItem } from "@/lib/faceit-types"

const REGIONS = new Set(["EU", "NA", "SA", "SEA", "OCE"])

type FaceitPlayer = {
  player_id: string
}

type FaceitPlayerRanking = {
  position?: number | string
  items?: FaceitRankingItem[]
}

function parsePosition(position: number | string | undefined) {
  const parsed = typeof position === "string" ? Number(position) : position

  return typeof parsed === "number" &&
    Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : null
}

export async function GET(request: NextRequest) {
  const nickname = request.nextUrl.searchParams.get("nickname")?.trim()
  const region = request.nextUrl.searchParams.get("region") ?? "EU"

  if (!nickname || nickname.length > 50 || !REGIONS.has(region)) {
    return NextResponse.json(
      { error: "Podaj prawidłowy nickname i region." },
      { status: 400 }
    )
  }

  try {
    const player = await faceitFetch<FaceitPlayer>(
      `/players?nickname=${encodeURIComponent(nickname)}&game=cs2`
    )
    const playerId = encodeURIComponent(player.player_id)
    const playerRanking = await faceitFetch<FaceitPlayerRanking>(
      `/rankings/games/cs2/regions/${encodeURIComponent(region)}/players/${playerId}`
    )
    if (!Array.isArray(playerRanking.items)) {
      throw new Error("FACEIT_INVALID_RANKING_RESPONSE")
    }

    const position =
      parsePosition(playerRanking.position) ??
      parsePosition(
        playerRanking.items.find((item) => item.player_id === player.player_id)
          ?.position
      )

    if (position === null) {
      return NextResponse.json(
        { error: "Gracz nie ma pozycji w rankingu wybranego regionu." },
        { status: 404 }
      )
    }

    if (
      !playerRanking.items.some((item) => item.player_id === player.player_id)
    ) {
      return NextResponse.json(
        {
          error: "Odpowiedź rankingu nie zawiera wyszukanego gracza.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      playerId: player.player_id,
      position,
      items: playerRanking.items,
    })
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
