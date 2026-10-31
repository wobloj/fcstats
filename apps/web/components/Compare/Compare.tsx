"use client"

import { useState, type FormEvent } from "react"
import CompareResults from "./CompareResults"
import CompareSearchForm from "./CompareSearchForm"
import { fetchCompareResult } from "./compare-service"
import type { CompareResult } from "./types"

export default function Compare() {
  const [firstNickname, setFirstNickname] = useState("")
  const [secondNickname, setSecondNickname] = useState("")
  const [comparison, setComparison] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const firstSearch = firstNickname.trim()
    const secondSearch = secondNickname.trim()
    if (!firstSearch || !secondSearch || loading) {
      return
    }

    setLoading(true)
    setError("")
    setComparison(null)

    try {
      setComparison(await fetchCompareResult(firstSearch, secondSearch))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się pobrać danych graczy."
      )
    } finally {
      setLoading(false)
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
