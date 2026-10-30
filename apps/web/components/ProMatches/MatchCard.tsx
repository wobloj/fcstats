"use client"

import { useCallback, useRef, useState } from "react"
import {
  ChevronDown,
  Clock3,
  MapPinned,
  Radio,
  Trophy,
  UsersRound,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import type {
  CitoMatch,
  CitoRosterPlayer,
  CitoTeam,
  MatchFeedName,
} from "@/lib/cito-matches"
import MatchRoster from "./MatchRoster"
import {
  EventLogo,
  formatMapName,
  formatMatchDate,
  formatMatchStatus,
  MatchTeam,
} from "./MatchShared"

export default function MatchCard({
  match,
  feed,
}: {
  match: CitoMatch
  feed: MatchFeedName
}) {
  const [rosters, setRosters] = useState<Record<string, CitoRosterPlayer[]>>({})
  const [loadingRosters, setLoadingRosters] = useState<Record<string, boolean>>(
    {}
  )
  const [rosterErrors, setRosterErrors] = useState<Record<string, string>>({})
  const requestedRosters = useRef(new Set<string>())
  const isLive = feed === "live"
  const team1Won =
    match.team1Score !== null &&
    match.team2Score !== null &&
    match.team1Score > match.team2Score
  const team2Won =
    match.team1Score !== null &&
    match.team2Score !== null &&
    match.team2Score > match.team1Score
  const team1MapWon =
    match.currentMapScore?.team1 !== null &&
    match.currentMapScore?.team1 !== undefined &&
    match.currentMapScore.team2 !== null &&
    match.currentMapScore.team1 > match.currentMapScore.team2
  const team2MapWon =
    match.currentMapScore?.team1 !== null &&
    match.currentMapScore?.team1 !== undefined &&
    match.currentMapScore.team2 !== null &&
    match.currentMapScore.team2 > match.currentMapScore.team1
  const displayedTeam1Score = isLive
    ? (match.currentMapScore?.team1 ?? match.team1Score)
    : match.team1Score
  const displayedTeam2Score = isLive
    ? (match.currentMapScore?.team2 ?? match.team2Score)
    : match.team2Score
  const displayedTeam1Winner = match.currentMapScore ? team1MapWon : team1Won
  const displayedTeam2Winner = match.currentMapScore ? team2MapWon : team2Won

  const loadRoster = useCallback(async (team: CitoTeam) => {
    if (team.roster.length > 0 || requestedRosters.current.has(team.id)) {
      return
    }

    requestedRosters.current.add(team.id)
    setLoadingRosters((current) => ({ ...current, [team.id]: true }))
    setRosterErrors((current) => ({ ...current, [team.id]: "" }))

    try {
      const response = await fetch(
        `/api/cs2/teams/${encodeURIComponent(team.id)}/roster`,
        { cache: "no-store" }
      )
      const result = (await response.json()) as {
        players?: CitoRosterPlayer[]
        error?: string
      }
      const players = result.players

      if (!response.ok) {
        throw new Error(result.error ?? "Nie udało się pobrać składu.")
      }
      if (!Array.isArray(players)) {
        throw new Error("Odpowiedź API nie zawiera składu drużyny.")
      }

      setRosters((current) => ({ ...current, [team.id]: players }))
    } catch (error) {
      requestedRosters.current.delete(team.id)
      setRosterErrors((current) => ({
        ...current,
        [team.id]:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać składu drużyny.",
      }))
    } finally {
      setLoadingRosters((current) => ({ ...current, [team.id]: false }))
    }
  }, [])

  return (
    <Collapsible
      className="w-full overflow-hidden rounded-xl border border-border/70 bg-card"
      onOpenChange={(open) => {
        if (open) {
          void loadRoster(match.team1)
          void loadRoster(match.team2)
        }
      }}
    >
      <CollapsibleTrigger
        aria-label={`Pokaż szczegóły meczu ${match.team1.name} kontra ${match.team2.name}`}
        className="group flex w-full flex-col gap-4 p-4 text-left transition-colors hover:bg-muted/40 sm:p-5"
      >
        <div className="items-between flex flex-col justify-between gap-2">
          <div className="flex flex-row items-center justify-between">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <EventLogo src={match.eventLogoUrl} name={match.eventName} />
              <span className="truncate font-medium">{match.eventName}</span>
              {match.stageName && (
                <span className="hidden text-muted-foreground sm:inline">
                  · {match.stageName}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <span
                className={`flex flex-row items-center gap-1 ${
                  isLive
                    ? "rounded-full bg-red-500/10 px-2 py-1 font-medium text-red-500"
                    : "rounded-full bg-muted px-2 py-1"
                } `}
              >
                {isLive ? (
                  <Radio
                    aria-hidden="true"
                    className="size-4 shrink-0 text-red-500"
                  />
                ) : (
                  <Trophy
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )}
                {formatMatchStatus(match.status)}
              </span>
            </div>
          </div>
          <span className="flex items-center justify-end gap-1 text-xs">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {formatMatchDate(match.startsAt)}
          </span>
        </div>

        <div className="flex flex-col justify-center">
          {match.currentMapScore && (
            <span className="text-center text-xs">
              {match.team1Score ?? "–"} : {match.team2Score ?? "–"}
            </span>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <MatchTeam
              team={match.team1}
              score={displayedTeam1Score}
              winner={displayedTeam1Winner}
              side="left"
            />
            <span className="text-xs font-medium text-muted-foreground">
              VS
            </span>
            <MatchTeam
              team={match.team2}
              score={displayedTeam2Score}
              winner={displayedTeam2Winner}
              side="right"
            />
          </div>
        </div>

        {(match.currentMap || match.currentMapScore) && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              {match.currentMap && (
                <>
                  <MapPinned aria-hidden="true" className="size-3.5" />
                  <span className="font-medium text-foreground">
                    {formatMapName(match.currentMap)}
                  </span>
                </>
              )}
              {match.currentRound !== undefined && (
                <span>Round {match.currentRound}</span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>{match.bestOf ? `BO${match.bestOf}` : "Mecz turniejowy"}</span>
          <div className="flex flex-row">
            <p>Advanced</p>
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-data-panel-open:rotate-180"
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border/60 bg-muted/20">
        <div className="space-y-5 p-4 sm:p-5">
          <section aria-label="Roaster">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <UsersRound
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Roaster
            </h3>
            <div className="flex flex-col gap-3">
              <MatchRoster
                team={match.team1}
                players={rosters[match.team1.id] ?? match.team1.roster}
                loading={loadingRosters[match.team1.id] ?? false}
                error={rosterErrors[match.team1.id]}
              />
              <MatchRoster
                team={match.team2}
                players={rosters[match.team2.id] ?? match.team2.roster}
                loading={loadingRosters[match.team2.id] ?? false}
                error={rosterErrors[match.team2.id]}
              />
            </div>
          </section>

          {(match.maps.length > 0 ||
            match.vetoOrder.length > 0 ||
            match.currentMap) && (
            <div className="grid gap-5 md:grid-cols-2">
              {(match.maps.length > 0 || match.currentMap) && (
                <section aria-label="Wyniki map">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <MapPinned
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                    Maps
                  </h3>
                  <ul className="space-y-2">
                    {match.currentMap && match.maps.length === 0 && (
                      <li className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm">
                        <span className="font-medium">
                          {formatMapName(match.currentMap)}
                        </span>
                        <span className="text-muted-foreground">
                          {match.currentMapScore?.team1 !== null &&
                          match.currentMapScore?.team1 !== undefined &&
                          match.currentMapScore.team2 !== null
                            ? `${match.currentMapScore.team1} : ${match.currentMapScore.team2}`
                            : "Mecz w toku"}
                        </span>
                      </li>
                    )}
                    {match.maps.map((map) => (
                      <li
                        key={map.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{map.mapName}</span>
                        <span className="text-muted-foreground">
                          {map.team1Score !== null && map.team2Score !== null
                            ? `${map.team1Score} : ${map.team2Score}`
                            : map.status
                              ? formatMatchStatus(map.status)
                              : "Wynik nieznany"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {match.vetoOrder.length > 0 && (
                <section aria-label="Kolejność veto">
                  <h3 className="mb-3 text-sm font-semibold">Kolejność veto</h3>
                  <ol className="space-y-2">
                    {match.vetoOrder.map((action, index) => (
                      <li
                        key={`${match.id}-veto-${index}`}
                        className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm text-muted-foreground"
                      >
                        {action.raw}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
