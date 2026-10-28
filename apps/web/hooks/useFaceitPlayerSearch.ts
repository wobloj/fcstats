"use client"

import { useCallback, useState } from "react"
import type { FaceitPlayerData } from "@/lib/faceit-types"

export default function useFaceitPlayerSearch() {
  const [data, setData] = useState<FaceitPlayerData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const searchPlayer = useCallback(
    async (nickname: string) => {
      const searchTerm = nickname.trim()
      if (!searchTerm || loading) return

      setLoading(true)
      setError("")

      try {
        const response = await fetch(
          `/api/faceit/player?nickname=${encodeURIComponent(searchTerm)}`
        )
        const result = (await response.json()) as FaceitPlayerData & {
          error?: string
        }

        if (!response.ok) {
          throw new Error(result.error ?? "Wystąpił błąd.")
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd połączenia.")
      } finally {
        setLoading(false)
      }
    },
    [loading]
  )

  return {
    data,
    error,
    loading,
    searchPlayer,
  }
}
