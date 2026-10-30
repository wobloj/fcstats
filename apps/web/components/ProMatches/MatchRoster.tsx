import Image from "next/image"
import { UsersRound } from "lucide-react"
import type { CitoRosterPlayer, CitoTeam } from "@/lib/cito-matches"
import { Marker, MarkerContent } from "ui/marker"
import { Avatar } from "@workspace/ui/components/avatar"
import { TeamLogo } from "./MatchShared"

export default function MatchRoster({
  team,
  players,
  loading,
  error,
}: {
  team: CitoTeam
  players: CitoRosterPlayer[]
  loading: boolean
  error?: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <TeamLogo team={team} />
        {team.name}
      </h4>
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Ładowanie składu…
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : players.length > 0 ? (
        <ul className="space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {player.imageUrl ? (
                <Image
                  src={player.imageUrl}
                  alt=""
                  aria-hidden="true"
                  width={28}
                  height={28}
                  unoptimized
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  {player.nickname.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="font-medium text-foreground">
                {player.nickname}
              </span>
              {player.name && player.name !== player.nickname && (
                <span className="truncate">{player.name}</span>
              )}
              {player.countryCode && /^[a-z]{2}$/i.test(player.countryCode) && (
                <span
                  role="img"
                  aria-label={player.countryCode.toUpperCase()}
                  className={`fi fi-${player.countryCode.toLowerCase()} ml-auto rounded-sm`}
                />
              )}
            </li>
          ))}
          <Marker variant={"separator"}>
            <MarkerContent>Coach</MarkerContent>
          </Marker>
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Skład tej drużyny nie jest dostępny w danych meczu.
        </p>
      )}
    </div>
  )
}
