import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { getPlayerMatchHistoryPage } from "@/lib/faceit-match-history"

function isPlayerId(value: string | null): value is string {
  return value !== null && value.length > 0 && value.length <= 100
}

function parseOffset(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null
  }

  const offset = Number(value)
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : null
}

function parseLimit(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null
  }

  const limit = Number(value)
  return Number.isSafeInteger(limit) && limit > 0 ? limit : null
}

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("playerId")
  const offset = parseOffset(request.nextUrl.searchParams.get("offset"))
  const limit = parseLimit(request.nextUrl.searchParams.get("limit")) ?? 5

  if (!isPlayerId(playerId)) {
    return NextResponse.json(
      { error: "Podaj prawidłowe ID gracza." },
      { status: 400 }
    )
  }

  if (offset === null) {
    return NextResponse.json(
      { error: "Podaj prawidłowy offset historii meczów." },
      { status: 400 }
    )
  }

  try {
    return NextResponse.json(
      await getPlayerMatchHistoryPage(playerId, offset, limit)
    )
  } catch (error) {
    return faceitErrorResponse(error)
  }
}
