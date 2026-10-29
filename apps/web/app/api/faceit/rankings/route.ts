import { NextRequest, NextResponse } from "next/server"
import { faceitErrorResponse } from "@/lib/faceit-error-response"
import { faceitFetch } from "@/lib/faceit"
import type { FaceitRankingItem } from "@/lib/faceit-types"

const REGIONS = new Set(["EU", "NA", "SA", "SEA", "OCE"])
const MAX_LIMIT = 300
const FACEIT_PAGE_SIZE = 100

type FaceitRankingResponse = {
  items?: FaceitRankingItem[]
}

function parseInteger(value: string | null, fallback: number) {
  if (value === null) return fallback
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") ?? "EU"
  const offset = parseInteger(request.nextUrl.searchParams.get("offset"), 0)
  const limit = parseInteger(request.nextUrl.searchParams.get("limit"), 50)

  if (
    !REGIONS.has(region) ||
    offset === null ||
    offset < 0 ||
    limit === null ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    return NextResponse.json(
      { error: "Podano nieprawidłowy region lub zakres rankingu." },
      { status: 400 }
    )
  }

  try {
    const items: FaceitRankingItem[] = []
    const requestedEnd = offset + limit

    const [, challengerRanking] = await Promise.all([
      (async () => {
        for (
          let pageOffset = offset;
          pageOffset < requestedEnd && items.length < limit;
        ) {
          const pageLimit = Math.min(
            FACEIT_PAGE_SIZE,
            requestedEnd - pageOffset
          )
          const ranking = await faceitFetch<FaceitRankingResponse>(
            `/rankings/games/cs2/regions/${encodeURIComponent(region)}?offset=${pageOffset}&limit=${pageLimit}`
          )

          if (!Array.isArray(ranking.items)) {
            throw new Error("FACEIT_INVALID_RANKING_RESPONSE")
          }

          items.push(...ranking.items)
          if (ranking.items.length < pageLimit) break
          pageOffset += pageLimit
        }
      })(),
      faceitFetch<FaceitRankingResponse>(
        `/rankings/games/cs2/regions/${encodeURIComponent(region)}?offset=999&limit=1`
      ),
    ])

    if (!Array.isArray(challengerRanking.items)) {
      throw new Error("FACEIT_INVALID_RANKING_RESPONSE")
    }

    const challengerPlayer = challengerRanking.items[0]
    const challengerElo =
      typeof challengerPlayer?.faceit_elo === "number" &&
      Number.isSafeInteger(challengerPlayer.faceit_elo) &&
      challengerPlayer.faceit_elo > 0
        ? challengerPlayer.faceit_elo + 1
        : null

    return NextResponse.json({
      items,
      challengerElo,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "FACEIT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Nie znaleziono rankingu dla wybranego regionu." },
        { status: 404 }
      )
    }

    return faceitErrorResponse(error)
  }
}
