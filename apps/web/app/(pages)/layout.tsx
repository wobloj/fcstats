import Header from "@/components/Header/Header"
import DecorativeGlow from "@/components/DecorativeGlow"

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative isolate min-h-screen bg-secondary">
      <DecorativeGlow />
      <Header />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
