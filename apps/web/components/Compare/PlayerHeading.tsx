import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import type { ComparedPlayer } from "./types"

export default function PlayerHeading({
  player,
  side,
}: {
  player: ComparedPlayer
  side: "left" | "right"
}) {
  const { nickname, avatar } = player.profile.player

  return (
    <div
      className={`flex max-w-[45%] min-w-0 gap-2 sm:gap-3 ${
        side === "left"
          ? "flex-row-reverse items-center text-right"
          : "items-center text-left"
      }`}
    >
      <Avatar size="lg">
        {avatar && <AvatarImage src={avatar} alt="" />}
        <AvatarFallback>{nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div
        className={`flex min-w-0 flex-col ${side === "left" ? "items-end" : "items-start"}`}
      >
        <p className="truncate text-lg font-semibold">{nickname}</p>
        <p className="text-sm text-muted-foreground">
          {player.profile.player.games?.cs2?.faceit_elo ?? "–"} ELO
        </p>
      </div>
    </div>
  )
}
