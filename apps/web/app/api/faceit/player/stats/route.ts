import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"
import { getAdditionalStats } from "@/lib/faceit-stats"
import type { FaceitLifetimeStats } from "@/lib/faceit-types"

type FaceitPlayer = {
  player_id: string
  nickname: string
}

type FaceitStats = {
  lifetime?: FaceitLifetimeStats
}

export async function GET(request: NextRequest) {
  const nickname = request.nextUrl.searchParams.get("nickname")?.trim()

  if (!nickname || nickname.length > 50) {
    return NextResponse.json(
      { error: "Podaj prawidłowy nickname." },
      { status: 400 }
    )
  }

  try {
    const player = await faceitFetch<FaceitPlayer>(
      `/players?nickname=${encodeURIComponent(nickname)}&game=cs2`
    )
    const stats = await faceitFetch<FaceitStats>(
      `/players/${encodeURIComponent(player.player_id)}/stats/cs2`
    )

    return NextResponse.json({
      playerId: player.player_id,
      nickname: player.nickname,
      stats: getAdditionalStats(stats.lifetime ?? {}),
    })
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
