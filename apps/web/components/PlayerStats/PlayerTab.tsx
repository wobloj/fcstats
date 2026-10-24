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
    <section className="flex flex-wrap items-center gap-4 rounded-md bg-card p-5">
      {avatarUrl && (
        <Avatars avatarUrl={avatarUrl} skillLevel={game?.skill_level} />
      )}
      <PlayerBaseInfo data={data} game={game} />
    </section>
  )
}
