import type { FormEvent } from "react"
import { Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import Loading from "@/components/Loading"

export default function CompareSearchForm({
  firstNickname,
  secondNickname,
  loading,
  error,
  onFirstNicknameChange,
  onSecondNicknameChange,
  onSubmit,
}: {
  firstNickname: string
  secondNickname: string
  loading: boolean
  error: string
  onFirstNicknameChange: (nickname: string) => void
  onSecondNicknameChange: (nickname: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="mx-auto space-y-4">
      <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
        FACEIT
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Compare players
      </h1>
      <p className="mt-2 text-sm text-muted-foreground/50">
        Enter two FACEIT nicknames to compare their CS2 stats.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col items-center">
        <div className="relative flex w-full flex-col gap-1">
          <Input
            autoComplete="off"
            className="h-12 w-full rounded-none px-4 transition-colors placeholder:text-muted-foreground"
            disabled={loading}
            maxLength={50}
            onChange={(event) => onFirstNicknameChange(event.target.value)}
            placeholder="First Player"
            required
            value={firstNickname}
          />
          <Input
            autoComplete="off"
            className="h-12 w-full rounded-none px-4 transition-colors placeholder:text-muted-foreground"
            disabled={loading}
            maxLength={50}
            onChange={(event) => onSecondNicknameChange(event.target.value)}
            placeholder="Second player"
            required
            value={secondNickname}
          />
          <span
            aria-hidden="true"
            className="absolute top-5 left-1/2 shrink-0 -translate-x-1/2 translate-y-1/2 rounded-full border border-border bg-card px-3 py-1 text-sm font-bold text-primary"
          >
            VS
          </span>
        </div>

        <Button
          className="mt-6 h-12 w-full px-6 sm:w-max"
          disabled={loading || !firstNickname.trim() || !secondNickname.trim()}
          type="submit"
        >
          <Search aria-hidden="true" />
          Compare
        </Button>
      </form>
      {loading && (
        <div role="status" className="pt-2 text-sm text-muted-foreground">
          <Loading customName="Loading both players and their stats" />
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </section>
  )
}
