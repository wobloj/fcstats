"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import Navbar, { MobileNavbar } from "./Navbar"
import Searchbar from "./Searchbar"
import type { SearchbarProps } from "./Searchbar"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

const menuButtonClassName =
  "inline-flex size-9 items-center justify-center rounded-lg border border-transparent transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"

export default function Header({
  searchbarProps,
  hasResults = false,
}: {
  searchbarProps?: Pick<
    SearchbarProps,
    "onSubmit" | "isLoading" | "recentSearches"
  >
  hasResults?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const recentSearches = searchbarProps?.recentSearches
  const onSearchSubmit =
    searchbarProps?.onSubmit ??
    ((nickname: string) => {
      const searchTerm = nickname.trim()
      if (searchTerm) {
        router.push(`/?nickname=${encodeURIComponent(searchTerm)}`)
      }
    })
  const desktopSearchbarProps = {
    onSubmit: onSearchSubmit,
    isLoading: searchbarProps?.isLoading,
  }

  return (
    <header
      className={`relative z-10 flex flex-row items-center justify-between gap-4 bg-background p-6 transition-[margin] duration-700 ease-in-out md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${
        hasResults ? "mb-6" : "mb-20"
      }`}
    >
      <div className="max-w-64 flex-1 grow basis-0">
        <p className="text-md text-primary uppercase">FCStats</p>
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="hidden flex-1 grow basis-0 justify-end md:flex">
        <Searchbar maxWidth="64" {...desktopSearchbarProps} />
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger
          className={`${menuButtonClassName} md:hidden`}
          aria-label="Open navigation menu"
        >
          <Menu aria-hidden="true" className="size-5" />
        </SheetTrigger>
        <SheetContent className="gap-6 overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <SheetTitle>Menu</SheetTitle>
            <SheetClose
              className={menuButtonClassName}
              aria-label="Close navigation menu"
            >
              <X aria-hidden="true" className="size-5" />
            </SheetClose>
          </div>
          <Searchbar
            maxWidth="full"
            size="md"
            onSubmit={(nickname) => {
              setMenuOpen(false)
              return onSearchSubmit(nickname)
            }}
            isLoading={searchbarProps?.isLoading}
            recentSearches={recentSearches}
          />
          <MobileNavbar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
