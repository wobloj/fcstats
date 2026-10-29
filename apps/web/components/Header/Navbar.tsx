"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "ui/navigation-menu"

const leaderboardRegions = ["EU", "NA", "SA", "SEA", "OCE"]

export default function Navbar() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex flex-row items-center gap-4">
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuLink
            render={
              <Link href="/" className="flex-row items-center gap-2">
                Home
              </Link>
            }
          />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            nativeButton={false}
            render={
              <Link
                href="/leaderboard"
                className="flex-row items-center gap-2"
              />
            }
          >
            Leaderboards
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-32">
              <li>
                {leaderboardRegions.map((region) => (
                  <NavigationMenuLink
                    className={"hover:bg-accent"}
                    key={region}
                    render={
                      <Link
                        href={`/leaderboard?region=${region}`}
                        className="flex-row items-center gap-2"
                      >
                        {region}
                      </Link>
                    }
                  />
                ))}
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuLink
            render={
              <Link href="/pro-matches" className="flex-row items-center gap-2">
                Pro Matches
              </Link>
            }
          />
        </NavigationMenuItem>
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuLink
            render={
              <Link href="/compare" className="flex-row items-center gap-2">
                Compare
              </Link>
            }
          />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export function MobileNavbar({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-2">
      <Link
        href="/"
        onClick={onNavigate}
        className="rounded-lg px-3 py-2.5 text-base font-medium"
      >
        Dashboard
      </Link>
      <Collapsible>
        <div className="flex items-center rounded-lg transition-colors hover:bg-muted">
          <Link
            href="/leaderboard"
            onClick={onNavigate}
            className="flex-1 rounded-lg px-3 py-2.5 text-base font-medium"
          >
            Leaderboards
          </Link>
          <CollapsibleTrigger
            className="rounded-lg px-3 py-2.5 transition-colors"
            aria-label="Show leaderboard regions"
          >
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="ml-3 flex flex-col border-l border-border py-1 pl-3">
          {leaderboardRegions.map((region) => (
            <Link
              key={region}
              href={`/leaderboard?region=${region}`}
              onClick={onNavigate}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {region}
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
      <Link
        href="/pro-matches"
        onClick={onNavigate}
        className="rounded-lg px-3 py-2.5 text-base font-medium"
      >
        Pro Matches
      </Link>
      <Link
        href="/compare"
        onClick={onNavigate}
        className="rounded-lg px-3 py-2.5 text-base font-medium"
      >
        Compare
      </Link>
    </nav>
  )
}
