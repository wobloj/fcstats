# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

## FACEIT player statistics API

- `GET /api/faceit/player?nickname=<nickname>` returns player details, the first
  five match-history entries, and the selected `basicStats` summary.
- `GET /api/faceit/player/history?playerId=<player-id>&offset=<offset>` returns
  the next five history entries, including the score from the player's
  perspective, map, and available per-match kills, deaths, assists, K/D, and
  ADR.
- `GET /api/faceit/player/stats?nickname=<nickname>` returns the remaining
  lifetime statistics, excluding fields used by the summary.
- `GET /api/faceit/player/stats/range?playerId=<player-id>&range=30d|90d`
  calculates summary statistics from the player's matches completed in the
  requested number of days. The route fetches each match's stats from FACEIT.

The basic-stat mapping is in `apps/web/lib/faceit-stats.ts`. Add a definition
there and its corresponding property to `FaceitBasicStats` in
`apps/web/lib/faceit-types.ts`; add a display card in
`apps/web/components/Home/PlayerSearchResults.tsx` if it should appear in the
UI. `avgDamage` is calculated as total damage divided by matches. The FACEIT
field used for `kda` is `Average K/D Ratio`, so it represents K/D rather than a
K/D/A ratio.
