import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "ui/navigation-menu"

export default function Navbar() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex flex-row items-center gap-4">
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuLink>Dashboard</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuTrigger>Leaderboard</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-27.5">
              <li>
                <NavigationMenuLink
                  render={
                    <Link href="#" className="flex-row items-center gap-2">
                      EU
                    </Link>
                  }
                />
                <NavigationMenuLink
                  render={
                    <Link href="#" className="flex-row items-center gap-2">
                      NA
                    </Link>
                  }
                />
                <NavigationMenuLink
                  render={
                    <Link href="#" className="flex-row items-center gap-2">
                      SA
                    </Link>
                  }
                />
                <NavigationMenuLink
                  render={
                    <Link href="#" className="flex-row items-center gap-2">
                      SEA
                    </Link>
                  }
                />
                <NavigationMenuLink
                  render={
                    <Link href="#" className="flex-row items-center gap-2">
                      OCE
                    </Link>
                  }
                />
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuLink>Pro Matches</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="cursor-pointer">
          <NavigationMenuLink>Compare</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
