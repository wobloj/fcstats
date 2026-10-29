"use client"

import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@workspace/ui/components/carousel"
import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"

export const REGIONS = [
  { value: "EU", label: "Europe" },
  { value: "NA", label: "North America" },
  { value: "SA", label: "South America" },
  { value: "SEA", label: "Southeast Asia" },
  { value: "OCE", label: "Oceania" },
]

type LeaderboardControlsProps = {
  region: string
  onRegionChange: (region: string | null) => void
  onPlayerSearch: (query: string) => void
}

function RegionCarouselControls() {
  const { canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useCarousel()

  return (
    <div className="pointer-events-none absolute inset-0">
      {canScrollPrev && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card to-transparent"
        />
      )}
      {canScrollNext && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card to-transparent"
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Scroll regions left"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className="pointer-events-auto absolute top-1/2 -left-10 z-20 -translate-y-1/2 rounded-full bg-card shadow active:not-aria-[haspopup]:translate-y-[-50%]"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Scroll regions right"
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="pointer-events-auto absolute top-1/2 -right-10 z-20 -translate-y-1/2 rounded-full bg-card shadow active:not-aria-[haspopup]:translate-y-[-50%]"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}

function PlayerSearchInput({
  onPlayerSearch,
}: {
  onPlayerSearch: (query: string) => void
}) {
  const [playerQuery, setPlayerQuery] = useState("")

  function handlePlayerSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onPlayerSearch(playerQuery.trim())
  }

  return (
    <form onSubmit={handlePlayerSearch} className="w-full sm:w-72">
      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Filter nickname in regional leaderboard"
          placeholder="Filter nickname"
          value={playerQuery}
          onChange={(event) => setPlayerQuery(event.target.value)}
          maxLength={50}
        />
      </InputGroup>
    </form>
  )
}

export default function LeaderboardControls({
  region,
  onRegionChange,
  onPlayerSearch,
}: LeaderboardControlsProps) {
  return (
    <div className="mb-8 flex flex-col items-center justify-between gap-5 rounded-md bg-card p-4 md:flex-row">
      <div className="w-full min-w-0 shrink-0 md:max-w-5/12">
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            dragFree: true,
          }}
          aria-label="Filter leaderboard by region"
          className="relative mr-10 ml-10 md:mr-0"
        >
          <CarouselContent
            role="group"
            aria-label="Regions"
            className="ml-0 gap-2"
          >
            {REGIONS.map((item) => (
              <CarouselItem key={item.value} className="basis-auto pl-0">
                <Button
                  type="button"
                  size="lg"
                  variant={region === item.value ? "default" : "outline"}
                  aria-pressed={region === item.value}
                  onClick={() => onRegionChange(item.value)}
                  className="shrink-0 rounded-none border-none px-6"
                >
                  {item.label} ({item.value})
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <RegionCarouselControls />
        </Carousel>
      </div>
      <PlayerSearchInput onPlayerSearch={onPlayerSearch} />
    </div>
  )
}
