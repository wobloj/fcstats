"use client"

import { useCallback, useEffect, useState } from "react"
import { Database, FlaskConical, Radio, RefreshCw } from "lucide-react"
import Loading from "@/components/Loading"
import type { ProMatchesResponse } from "@/lib/cito-matches"
import MatchFeedSection, { MATCH_FEEDS } from "./MatchFeedSection"
import { DEMO_MATCHES } from "./mock-data"

export default function ProMatches() {
  const [data, setData] = useState<ProMatchesResponse | null>(null)
  const [mode, setMode] = useState<"welcome" | "demo" | "live">("welcome")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadMatches = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/cs2/matches", { cache: "no-store" })
      const result = (await response.json()) as ProMatchesResponse

      if (!response.ok && !result.live?.error && !result.upcoming?.error) {
        throw new Error("Nie udało się pobrać meczów CS2.")
      }

      setData(result)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się pobrać meczów CS2."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mode !== "live") {
      return
    }

    void loadMatches()
    const intervalId = window.setInterval(() => {
      void loadMatches()
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [loadMatches, mode])

  if (mode === "welcome") {
    return (
      <main className="fixed inset-0 z-100 flex min-h-screen w-full items-center justify-center bg-background/95 p-4 backdrop-blur-md">
        <section
          aria-labelledby="pro-matches-test-heading"
          aria-modal="true"
          className="w-full max-w-xl sm:p-10"
          role="dialog"
        >
          <div className="flex flex-row items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FlaskConical aria-hidden="true" className="size-7" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
                Matches
              </p>
              <h1
                id="pro-matches-test-heading"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                This section is in testing phase
              </h1>
            </div>
          </div>
          <p className="mt-4 text-center leading-relaxed text-muted-foreground">
            Choose between example data or try to load data from API. Loading
            data from API does not provide stability. Loading example data shows
            how this site looks.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setData(DEMO_MATCHES)
                setMode("demo")
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Database aria-hidden="true" className="size-4" />
              Load example data
            </button>
            <button
              type="button"
              onClick={() => setMode("live")}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-medium transition-colors hover:bg-muted"
            >
              <Radio aria-hidden="true" className="size-4" />
              Load data from API
            </button>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground/50">
            Example data are local and does not provide correct informations.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="relative z-10 min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium tracking-[0.2em] text-primary uppercase">
              Counter-Strike 2
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Official matches
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Follow currently, upcoming or recent played official matches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (mode === "demo") {
                setData(DEMO_MATCHES)
                return
              }

              void loadMatches()
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
            {mode === "demo" ? "Reset test data" : "Refresh"}
          </button>
        </div>

        {mode === "demo" && (
          <div
            role="status"
            className="mb-8 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
          >
            <Database aria-hidden="true" className="size-4 shrink-0" />
            Wyświetlasz przykładowe dane testowe. Żadne zapytania do Cito nie są
            wysyłane.
          </div>
        )}

        {loading && !data ? (
          <div
            role="status"
            className="flex min-h-40 items-center justify-center rounded-xl border border-border/70 bg-card"
          >
            <Loading customName="Ładowanie meczów" />
          </div>
        ) : error && !data ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        ) : (
          <div className="space-y-12">
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {MATCH_FEEDS.map((feed) => (
              <MatchFeedSection
                key={feed.id}
                feed={feed}
                result={data?.[feed.id]}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
