"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxChip,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import MatchHistoryCard from "@/components/PlayerStats/MatchHistoryCard"
import type { FaceitPlayerData } from "@/lib/faceit-types"
import { useId, useState } from "react"
import Loading from "@/components/Loading"

const MAP_OPTIONS = [
  "Ancient",
  "Anubis",
  "Cache",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass",
  "Train",
  "Vertigo",
]

const MAX_VISIBLE = 2

export default function MatchHistorySection({
  history,
  hasMore,
  loading,
  error,
  selectedMaps,
  onSelectedMapsChange,
  onLoadMore,
}: {
  history: FaceitPlayerData["history"]
  hasMore: boolean
  loading: boolean
  error: string
  selectedMaps: string[]
  onSelectedMapsChange: (maps: string[]) => void
  onLoadMore: () => void
}) {
  const id = useId()
  const anchor = useComboboxAnchor()
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="min-h-64">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Last matches</h2>
        <Combobox
          multiple
          autoHighlight
          value={selectedMaps}
          onValueChange={onSelectedMapsChange}
          items={MAP_OPTIONS}
        >
          <ComboboxChips className={"w-72"} ref={anchor}>
            <ComboboxValue>
              {(values: string[]) => {
                const visibleValues = expanded
                  ? values
                  : values.slice(0, MAX_VISIBLE)
                const hiddenCount = values.length - MAX_VISIBLE

                return (
                  <>
                    {visibleValues.map((value: string) => (
                      <ComboboxChip key={value}>{value}</ComboboxChip>
                    ))}
                    {values.length > MAX_VISIBLE && (
                      <ComboboxChip
                        key="toggle"
                        showRemove={false}
                        className="cursor-pointer"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          setExpanded((prev) => !prev)
                        }}
                      >
                        {expanded ? "Show Less" : `+${hiddenCount} more`}
                      </ComboboxChip>
                    )}
                  </>
                )
              }}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {MAP_OPTIONS.map((map) => (
                <ComboboxItem key={map} value={map}>
                  {map}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {history === null ? (
        <p className="text-gray-500">Nie udało się pobrać historii meczów.</p>
      ) : history.length === 0 && loading ? (
        <Loading />
      ) : history.length === 0 ? (
        <p className="text-gray-500">Brak meczów do wyświetlenia.</p>
      ) : (
        <div className="rounded-md bg-card p-2">
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead>Result/Map</TableHead>
                <TableHead>Score </TableHead>
                <TableHead className="text-center">K-D-A(Ratio)</TableHead>
                <TableHead className="text-center">ADR</TableHead>
                <TableHead className="text-end">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((match) => (
                <MatchHistoryCard key={match.match_id} match={match} />
              ))}
            </TableBody>
            <TableFooter className="bg-card">
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex items-center justify-between">
                    <span>
                      Załadowano {history.length} meczów
                      {loading ? " (ładowanie...)" : ""}
                    </span>
                    {hasMore && (
                      <Button onClick={onLoadMore} disabled={loading}>
                        {loading ? "Ładowanie..." : "Load more"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-red-500">
          {error}
        </p>
      )}
    </section>
  )
}
