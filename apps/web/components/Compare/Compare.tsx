"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import CompareResults from "./CompareResults"
import CompareSearchForm from "./CompareSearchForm"
import { fetchCompareResult } from "./compare-service"
import type { CompareResult } from "./types"

export default function Compare({
  initialPlayer1 = "",
  initialPlayer2 = "",
}: {
  initialPlayer1?: string
  initialPlayer2?: string
}) {
  const router = useRouter()
  const handledQueryRef = useRef("")
  const [firstNickname, setFirstNickname] = useState(initialPlayer1)
  const [secondNickname, setSecondNickname] = useState(initialPlayer2)
  const [comparison, setComparison] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadComparison = useCallback(
    async (firstSearch: string, secondSearch: string) => {
      setLoading(true)
      setError("")
      setComparison(null)

      try {
        setComparison(await fetchCompareResult(firstSearch, secondSearch))
        return true
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się pobrać danych graczy."
        )
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const firstSearch = initialPlayer1.trim()
    const secondSearch = initialPlayer2.trim()
    setFirstNickname(firstSearch)
    setSecondNickname(secondSearch)

    if (!firstSearch || !secondSearch) {
      return
    }

    const queryKey = JSON.stringify([firstSearch, secondSearch])
    if (handledQueryRef.current === queryKey) {
      return
    }

    handledQueryRef.current = queryKey
    void loadComparison(firstSearch, secondSearch)
  }, [initialPlayer1, initialPlayer2, loadComparison])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const firstSearch = firstNickname.trim()
    const secondSearch = secondNickname.trim()
    if (!firstSearch || !secondSearch || loading) {
      return
    }

    if (await loadComparison(firstSearch, secondSearch)) {
      handledQueryRef.current = JSON.stringify([firstSearch, secondSearch])
      const params = new URLSearchParams({
        player1: firstSearch,
        player2: secondSearch,
      })
      router.replace(`/compare?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-7xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8">
      <CompareSearchForm
        firstNickname={firstNickname}
        secondNickname={secondNickname}
        loading={loading}
        error={error}
        onFirstNicknameChange={setFirstNickname}
        onSecondNicknameChange={setSecondNickname}
        onSubmit={handleSubmit}
      />
      {comparison && <CompareResults comparison={comparison} />}
    </main>
  )
}
