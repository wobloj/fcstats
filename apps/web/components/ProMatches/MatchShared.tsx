import Image from "next/image"
import { Trophy } from "lucide-react"
import type { CitoTeam } from "@/lib/cito-matches"

export function formatMatchDate(value?: string) {
  if (!value) {
    return "Termin nieznany"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Termin nieznany"
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatMatchStatus(status: string) {
  const labels: Record<string, string> = {
    live: "Na żywo",
    in_progress: "Na żywo",
    completed: "Zakończony",
    upcoming: "Nadchodzący",
    scheduled: "Zaplanowany",
  }

  return labels[status.toLowerCase()] ?? status.replaceAll("_", " ")
}

export function formatMapName(mapName: string) {
  return mapName
    .replace(/^de_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function TeamLogo({ team }: { team: CitoTeam }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-border/60">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt=""
          aria-hidden="true"
          width={44}
          height={44}
          unoptimized
          className="size-full object-contain p-1"
        />
      ) : (
        <span className="text-sm font-bold text-muted-foreground">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

export function EventLogo({ src, name }: { src?: string; name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-border/60">
      {src ? (
        <Image
          src={src}
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          unoptimized
          className="size-full object-contain p-1"
        />
      ) : (
        <Trophy aria-hidden="true" className="size-4 text-muted-foreground" />
      )}
      <span className="sr-only">{name}</span>
    </div>
  )
}

export function MatchTeam({
  team,
  score,
  winner,
  side,
}: {
  team: CitoTeam
  score: number | null
  winner: boolean
  side: "left" | "right"
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 sm:gap-3 ${
        side === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div className={`min-w-0 flex-1 ${side === "right" ? "text-right" : ""}`}>
        <p className="truncate font-semibold">{team.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {typeof team.worldRanking === "number" && team.worldRanking > 0
            ? ` · #${team.worldRanking}`
            : ""}
        </p>
      </div>
      <TeamLogo team={team} />
      <span
        className={`min-w-6 text-center text-xl font-bold tabular-nums ${
          winner ? "text-primary" : "text-foreground"
        }`}
      >
        {score ?? "–"}
      </span>
    </div>
  )
}
