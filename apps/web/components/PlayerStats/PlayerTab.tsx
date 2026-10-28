import Avatars from "@/components/PlayerStats/Avatars"
import type { FaceitGame, FaceitPlayerData } from "@/lib/faceit-types"
import PlayerBaseInfo from "./PlayerBaseInfo"

export default function PlayerTab({
  avatarUrl,
  data,
  game,
}: {
  avatarUrl?: string
  data: FaceitPlayerData
  game?: FaceitGame
}) {
  return (
    <section
      className={`grid min-w-0 gap-4 rounded-md bg-card p-5 md:flex md:flex-wrap md:items-center ${
        avatarUrl ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1"
      }`}
    >
      {avatarUrl && (
        <div className="col-start-1 row-start-1 md:contents">
          <Avatars avatarUrl={avatarUrl} skillLevel={game?.skill_level} />
        </div>
      )}
      <PlayerBaseInfo data={data} game={game} hasAvatar={Boolean(avatarUrl)} />
    </section>
  )
}
