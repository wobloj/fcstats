import Header from "@/components/Header/Header"

export default function RoutePlaceholderPage({
  title,
}: {
  title: string
}) {
  return (
    <main className="min-h-screen bg-secondary">
      <Header />
      <h1 className="text-center text-3xl font-bold">{title}</h1>
    </main>
  )
}
