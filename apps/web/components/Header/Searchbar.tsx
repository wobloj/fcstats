"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "ui/input-group"

export type RecentPlayerSearch = {
  nickname: string
  avatar?: string
}

const animatedPlaceholderNicknames = [
  "donk666",
  "m0NESY",
  "ZywOo",
  "s1mplecsgod",
]

const maxWidthClasses = {
  "64": "max-w-64",
  full: "max-w-full",
} as const

const sizeClasses = {
  sm: {
    group: "h-8",
    input: "h-full px-2 text-xs",
    addon: "gap-1.5 py-0 text-xs",
    icon: "size-3.5",
    button: "h-6 px-2 text-xs",
  },
  md: {
    group: "h-12",
    input: "h-full px-3 text-sm",
    addon: "py-0 text-sm",
    icon: "size-4",
    button: "h-9 px-3 text-sm",
  },
  lg: {
    group: "h-14",
    input: "h-full px-3.5 text-base",
    addon: "gap-2.5 py-0 text-base",
    icon: "size-5",
    button: "h-10 px-3.5 text-base",
  },
} as const

export type SearchbarProps = {
  maxWidth?: keyof typeof maxWidthClasses
  size?: keyof typeof sizeClasses
  onSubmit: (nickname: string) => void | Promise<void>
  isLoading?: boolean
  recentSearches?: RecentPlayerSearch[]
  animatePlaceholder?: boolean
}

export default function Searchbar({
  maxWidth,
  size,
  onSubmit,
  isLoading = false,
  recentSearches = [],
  animatePlaceholder = false,
}: SearchbarProps) {
  const [value, setValue] = useState("")
  const [animatedPlaceholderText, setAnimatedPlaceholderText] = useState("")
  const classes = sizeClasses[size ?? "sm"]

  useEffect(() => {
    if (!animatePlaceholder || value.length > 0) {
      setAnimatedPlaceholderText("")
      return
    }

    let nicknameIndex = 0
    let characterIndex = 0
    let deleting = false
    let timeoutId: ReturnType<typeof setTimeout>

    const animate = () => {
      const nickname = animatedPlaceholderNicknames[nicknameIndex]
      if (nickname === undefined) {
        throw new Error(
          "Add at least one nickname to the animated placeholder list."
        )
      }

      if (!deleting) {
        characterIndex += 1
        setAnimatedPlaceholderText(nickname.slice(0, characterIndex))

        if (characterIndex === nickname.length) {
          deleting = true
          timeoutId = setTimeout(animate, 1200)
        } else {
          timeoutId = setTimeout(animate, 110)
        }

        return
      }

      characterIndex -= 1
      setAnimatedPlaceholderText(nickname.slice(0, characterIndex))

      if (characterIndex === 0) {
        deleting = false
        nicknameIndex =
          (nicknameIndex + 1) % animatedPlaceholderNicknames.length
        timeoutId = setTimeout(animate, 400)
      } else {
        timeoutId = setTimeout(animate, 55)
      }
    }

    timeoutId = setTimeout(animate, 400)

    return () => clearTimeout(timeoutId)
  }, [animatePlaceholder, value])

  return (
    <div
      className={`grow basis-0 ${maxWidth ? maxWidthClasses[maxWidth] : ""}`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit(value)
        }}
      >
        <InputGroup className={classes.group}>
          <InputGroupInput
            className={classes.input}
            placeholder={
              "type: " + animatePlaceholder
                ? animatedPlaceholderText || "Search player..."
                : "Search player..."
            }
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <InputGroupAddon className={classes.addon}>
            <Search className={classes.icon} />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end" className={classes.addon}>
            <InputGroupButton
              type="submit"
              className={classes.button}
              variant="default"
              disabled={isLoading || !value.trim()}
            >
              {isLoading ? "Searching..." : "Search"}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
      {recentSearches.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Recent:</span>
          {recentSearches.map((player) => (
            <button
              key={player.nickname}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setValue(player.nickname)
                void onSubmit(player.nickname)
              }}
              className="flex items-center gap-2 rounded-md bg-card px-2 py-1 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <Avatar size="sm">
                {player.avatar && <AvatarImage src={player.avatar} alt="" />}
                <AvatarFallback>
                  {player.nickname.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-40 truncate">{player.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
