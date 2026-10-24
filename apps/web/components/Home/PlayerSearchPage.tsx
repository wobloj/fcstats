"use client"

import { useEffect } from "react"
import Header from "@/components/Header/Header"
import HomePage from "@/components/Home/HomePage"
import PlayerSearchResults from "@/components/Home/PlayerSearchResults"
import useFaceitPlayerSearch from "@/hooks/useFaceitPlayerSearch"
import Loading from "../Loading"

export default function PlayerSearchPage() {
  const search = useFaceitPlayerSearch()

  useEffect(() => {
    document.title = search.data
      ? `FCStats - ${search.data.player.nickname}`
      : "FCStats"
  }, [search.data])

  const searchbarProps = {
    onSubmit: search.searchPlayer,
    isLoading: search.loading,
  }

  return (
    <main className="min-h-screen space-y-8 bg-secondary">
      <Header
        searchbarProps={searchbarProps}
        hasResults={search.data !== null}
      />
      <HomePage
        searchbarProps={searchbarProps}
        hasResults={search.data !== null}
      />

      <section className="mx-auto max-w-7xl space-y-8 px-6 pb-12">
        {search.loading && <Loading customName="Loading user data" />}
        {search.error && (
          <p role="alert" className="text-red-500">
            {search.error}
          </p>
        )}
        {search.data && <PlayerSearchResults data={search.data} />}
      </section>
    </main>
  )
}
