import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"

type FaceitPlayerProfile = {
  player_id: string
  avatar?: string
}

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("playerId")

  if (!playerId || !/^[a-zA-Z0-9-]{1,100}$/.test(playerId)) {
    return NextResponse.json(
      { error: "Podaj prawidłowe ID gracza." },
      { status: 400 }
    )
  }

  try {
    const player = await faceitFetch<FaceitPlayerProfile>(
      `/players/${encodeURIComponent(playerId)}`
    )

    return NextResponse.json({
      playerId: player.player_id,
      avatar: player.avatar ?? null,
    })
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
