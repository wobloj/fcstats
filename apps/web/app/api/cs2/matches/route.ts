import { NextResponse } from "next/server"
import {
  parseCitoMatches,
  type MatchFeedName,
  type MatchFeedResult,
  type ProMatchesResponse,
} from "@/lib/cito-matches"

const CITO_API_BASE_URL = "https://api.citoapi.com/api/v1/cs2"

const FEED_PATHS: Record<MatchFeedName, string> = {
  live: "/live",
  upcoming: "/matches/upcoming",
  recent: "/matches/recent",
}

async function loadFeed(
  feed: MatchFeedName,
  apiKey: string
): Promise<MatchFeedResult> {
  try {
    const response = await fetch(`${CITO_API_BASE_URL}${FEED_PATHS[feed]}`, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const error =
        response.status === 401 || response.status === 403
          ? "API odrzuciło autoryzację. Sprawdź zmienną CITO_API_KEY."
          : `API zwróciło błąd HTTP ${response.status}.`
      return { matches: [], error }
    }

    return { matches: parseCitoMatches(await response.json()) }
  } catch (error) {
    return {
      matches: [],
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się pobrać danych z API.",
    }
  }
}

export async function GET() {
  const apiKey = process.env.CITO_API_KEY

  if (!apiKey) {
    const error = "Brak zmiennej CITO_API_KEY na serwerze."
    const result: ProMatchesResponse = {
      live: { matches: [], error },
      upcoming: { matches: [], error },
      recent: { matches: [], error },
    }

    return NextResponse.json(result, { status: 500 })
  }

  const [live, upcoming, recent] = await Promise.all([
    loadFeed("live", apiKey),
    loadFeed("upcoming", apiKey),
    loadFeed("recent", apiKey),
  ])
  const result: ProMatchesResponse = { live, upcoming, recent }
  const hasSuccessfulFeed = [live, upcoming, recent].some((feed) => !feed.error)

  return NextResponse.json(result, {
    status: hasSuccessfulFeed ? 200 : 502,
  })
}
