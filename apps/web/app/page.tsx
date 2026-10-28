import PlayerSearchPage from "@/components/Home/PlayerSearchPage"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ nickname?: string | string[] }>
}) {
  const { nickname } = await searchParams

  return (
    <PlayerSearchPage
      initialNickname={Array.isArray(nickname) ? nickname[0] : nickname}
    />
  )
}
