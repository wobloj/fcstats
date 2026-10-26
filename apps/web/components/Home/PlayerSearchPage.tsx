"use client"

import { useEffect, useState } from "react"
import Header from "@/components/Header/Header"
import HomePage from "@/components/Home/HomePage"
import PlayerSearchResults from "@/components/Home/PlayerSearchResults"
import useFaceitPlayerSearch from "@/hooks/useFaceitPlayerSearch"
import Loading from "../Loading"
import { toast } from "@workspace/ui/components/toast"
import type { RecentPlayerSearch } from "@/components/Header/Searchbar"

const RECENT_SEARCHES_STORAGE_KEY = "fcstats-recent-searches"
const MAX_RECENT_SEARCHES = 5

function readRecentSearches(): RecentPlayerSearch[] {
  let stored: string | null
  try {
    stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)
  } catch (error) {
    console.error("Could not read recent searches from local storage.", error)
    return []
  }

  if (!stored) {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch (error) {
    console.error("Recent searches cache contains invalid JSON.", error)
    return []
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .filter(
      (item): item is RecentPlayerSearch =>
        typeof item === "object" &&
        item !== null &&
        "nickname" in item &&
        typeof item.nickname === "string" &&
        item.nickname.length > 0 &&
        (!("avatar" in item) || typeof item.avatar === "string")
    )
    .slice(0, MAX_RECENT_SEARCHES)
}

export default function PlayerSearchPage() {
  const search = useFaceitPlayerSearch()
  const [recentSearches, setRecentSearches] = useState<RecentPlayerSearch[]>([])
  const [recentSearchesLoaded, setRecentSearchesLoaded] = useState(false)

  useEffect(() => {
    setRecentSearches(readRecentSearches())
    setRecentSearchesLoaded(true)
  }, [])

  useEffect(() => {
    if (!recentSearchesLoaded || !search.data) {
      return
    }

    const player = {
      nickname: search.data.player.nickname,
      avatar: search.data.player.avatar,
    }
    setRecentSearches((previous) => {
      return [
        player,
        ...previous.filter(
          (entry) =>
            entry.nickname.toLowerCase() !== player.nickname.toLowerCase()
        ),
      ].slice(0, MAX_RECENT_SEARCHES)
    })
  }, [recentSearchesLoaded, search.data])

  useEffect(() => {
    if (!recentSearchesLoaded) {
      return
    }

    try {
      localStorage.setItem(
        RECENT_SEARCHES_STORAGE_KEY,
        JSON.stringify(recentSearches)
      )
    } catch (error) {
      console.error("Could not save recent searches to local storage.", error)
    }
  }, [recentSearches, recentSearchesLoaded])

  useEffect(() => {
    if (search.error) {
      toast.add({
        type: "error",
        title: "Nie udało się wyszukać gracza",
        description: search.error,
      })
    }
  }, [search.error])

  useEffect(() => {
    document.title = search.data
      ? `FCStats - ${search.data.player.nickname}`
      : "FCStats"
  }, [search.data])

  const searchbarProps = {
    onSubmit: search.searchPlayer,
    isLoading: search.loading,
    recentSearches,
  }

  return (
    <main className="min-h-screen space-y-8 bg-secondary">
      <Header
        searchbarProps={{
          onSubmit: searchbarProps.onSubmit,
          isLoading: searchbarProps.isLoading,
        }}
        hasResults={search.data !== null}
      />
      <HomePage
        searchbarProps={searchbarProps}
        hasResults={search.data !== null}
      />

      <section className="mx-auto max-w-7xl space-y-8 px-6 pb-12">
        {search.loading && <Loading customName="Loading user data" />}
        {search.data && (
          <PlayerSearchResults
            key={search.data.player.player_id}
            data={search.data}
          />
        )}
      </section>
    </main>
  )
}
