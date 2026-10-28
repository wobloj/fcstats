"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import AdvancedStats from "@/components/Home/AdvancedStats"
import MapStats from "@/components/Home/MapStats"
import type { FaceitStatValue } from "@/lib/faceit-types"

export default function AdvancedStatsSection({
  playerId,
  stats,
  loading,
  error,
}: {
  playerId: string
  stats: Record<string, FaceitStatValue> | null
  loading: boolean
  error: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <h2 className="text-2xl font-semibold">Advanced Stats</h2>
      <div className="relative">
        <div
          id="advanced-stats-content"
          className={open ? "" : "max-h-[25vh] overflow-hidden"}
        >
          <AdvancedStats stats={stats} loading={loading} error={error} />
          {open && <MapStats playerId={playerId} />}
        </div>
        {!open && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-secondary"
          />
        )}
        <div
          className={
            open
              ? "mt-2 flex justify-center"
              : "absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center"
          }
        >
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={
              open ? "Collapse advanced stats" : "Expand advanced stats"
            }
            aria-expanded={open}
            aria-controls="advanced-stats-content"
            onClick={() => setOpen((isOpen) => !isOpen)}
            className="rounded-full border-0 bg-background shadow-md hover:bg-background"
          >
            {open ? (
              <ChevronUp aria-hidden="true" />
            ) : (
              <ChevronDown aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
