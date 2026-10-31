import Image from "next/image"
import type { CitoRosterPlayer, CitoTeam } from "@/lib/cito-matches"
import { TeamLogo } from "./MatchShared"
import { Marker, MarkerContent } from "@workspace/ui/components/marker"

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
  const coaches = players.filter(isCoach)
  const rosterPlayers = players.filter((player) => !isCoach(player))

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
        <div className="space-y-3">
          {rosterPlayers.length > 0 && (
            <ul className="space-y-2">
              {rosterPlayers.map((player) => (
                <RosterPlayer key={player.id} player={player} />
              ))}
            </ul>
          )}
          {coaches.length > 0 && (
            <div>
              <Marker variant={"separator"}>
                <MarkerContent>Coach</MarkerContent>
              </Marker>
              <ul className="space-y-2">
                {coaches.map((player) => (
                  <RosterPlayer
                    key={player.id}
                    player={player}
                    showRole={false}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Skład tej drużyny nie jest dostępny w danych meczu.
        </p>
      )}
    </div>
  )
}

function isCoach(player: CitoRosterPlayer) {
  return player.role?.trim().toLowerCase() === "coach"
}

function RosterPlayer({
  player,
  showRole = true,
}: {
  player: CitoRosterPlayer
  showRole?: boolean
}) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
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
      <span className="font-medium text-foreground">{player.nickname}</span>
      {player.name && player.name !== player.nickname && (
        <span className="truncate">{player.name}</span>
      )}
      {showRole && player.role && (
        <span className="rounded bg-muted px-2 py-0.5 text-xs">
          {player.role}
        </span>
      )}
      {player.countryCode && /^[a-z]{2}$/i.test(player.countryCode) && (
        <span
          role="img"
          aria-label={player.countryCode.toUpperCase()}
          className={`fi fi-${player.countryCode.toLowerCase()} ml-auto rounded-sm`}
        />
      )}
    </li>
  )
}
