import { NextResponse } from "next/server"

export function faceitErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : ""

  if (message === "FACEIT_NOT_FOUND") {
    return NextResponse.json(
      { error: "Nie znaleziono gracza lub danych." },
      { status: 404 }
    )
  }

  if (message === "FACEIT_RATE_LIMIT") {
    return NextResponse.json(
      { error: "Przekroczono limit FACEIT API." },
      { status: 429 }
    )
  }

  if (message === "FACEIT_AUTH_ERROR") {
    return NextResponse.json(
      { error: "Sprawdź klucz i uprawnienia FACEIT API." },
      { status: 502 }
    )
  }

  if (message === "FACEIT_API_KEY_NOT_CONFIGURED") {
    return NextResponse.json(
      { error: "Brak zmiennej FACEIT_API_KEY na serwerze." },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: "Nie udało się pobrać danych z FACEIT." },
    { status: 502 }
  )
}
