export default function RoutePlaceholderPage({ title }: { title: string }) {
  return (
    <main className="relative z-10 min-h-screen">
      <h1 className="text-center text-3xl font-bold">{title}</h1>
    </main>
  )
}
