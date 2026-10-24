import React from "react"
import RippleSpinner from "./shadcn-space/Spinner"

export default function Loading({
  customName = "Loading",
}: {
  customName?: string
}) {
  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <p>{customName}</p>
      <RippleSpinner size="sm" />
    </div>
  )
}
