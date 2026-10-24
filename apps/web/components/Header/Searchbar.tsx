"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "ui/input-group"

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
}

export default function Searchbar({
  maxWidth,
  size,
  onSubmit,
  isLoading = false,
}: SearchbarProps) {
  const [value, setValue] = useState("")
  const classes = sizeClasses[size ?? "sm"]

  return (
    <form
      className={`grow basis-0 ${maxWidth ? maxWidthClasses[maxWidth] : ""}`}
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(value)
      }}
    >
      <InputGroup className={classes.group}>
        <InputGroupInput
          className={classes.input}
          placeholder="Search player..."
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
  )
}
