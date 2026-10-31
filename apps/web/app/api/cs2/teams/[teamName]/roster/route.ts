import { NextResponse } from "next/server"
import { parseCitoRoster } from "@/lib/cito-matches"

const CITO_API_BASE_URL = "https://api.citoapi.com/api/v1/cs2"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamName: string }> }
) {
  const { teamName } = await params

  if (
    !teamName.trim() ||
    teamName.length > 100 ||
    /[\/\\\u0000-\u001f]/.test(teamName)
  ) {
    return NextResponse.json(
      { error: "Podano nieprawidłową nazwę drużyny." },
      { status: 400 }
    )
  }

  const apiKey = process.env.CITO_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Brak zmiennej CITO_API_KEY na serwerze." },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `${CITO_API_BASE_URL}/teams/${encodeURIComponent(teamName)}`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!response.ok) {
      const error =
        response.status === 401 || response.status === 403
          ? "API odrzuciło autoryzację. Sprawdź zmienną CITO_API_KEY."
          : `API zwróciło błąd HTTP ${response.status}.`
      return NextResponse.json({ error }, { status: response.status })
    }

    return NextResponse.json({
      players: parseCitoRoster(await response.json()),
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nie udało się pobrać składu drużyny."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
