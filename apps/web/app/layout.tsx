import { Anta } from "next/font/google"
import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import "flag-icons/css/flag-icons.min.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { Toaster } from "@workspace/ui/components/toast"

export const metadata: Metadata = {
  title: "FCStats",
  description:
    "Explore detailed Counter-Strike 2 FACEIT player stats, ELO, match history, K/D, ADR, win rates, and map performance with FCStats.",
}

const anta = Anta({
  variable: "--font-anta",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", anta.variable)}
    >
      <body>
        <ThemeProvider>
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
