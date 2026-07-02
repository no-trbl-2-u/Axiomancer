# Current state — 2026-05-13 (frozen baseline)

> **Frozen baseline.** This file is the nexus-adoption snapshot from
> 2026-05-13 — see `plan/README.md`. Nearly every "Known broken /
> decayed" or "What's missing for v1" item below has shipped in the
> phases that followed (Phase 09 game loop, Phase 11 RNG, Phase 12
> package architecture, Phase 13 ESLint fix, Phase 17 unified CLI,
> Phases 21 / 26 / 27 / 29 / 30 / 34 / 35, etc.). For the live
> picture, read `plan/steps/01_build_plan.md` Status block and the
> shipped commits — this file remains as a historical reference for
> what the codebase looked like before the autonomous loop took over.

## What's there

- **Tech stack:** TypeScript strict, Vitest, tsc + tsc-alias, ESLint, npm
- **LOC:** ~8k (src/ only, excluding CLI and tests)
- **Test coverage:** hermetic vitest e2e tests present for each shipped
  module; unit tests colocated. `npm test` green.
- **Build:** green (`npm run build` → `dist/`)
- **Type-check:** green (`npm run type-check`)
- **Lint:** **red** — ESLint config has a pre-existing issue:
  `@typescript-eslint/no-explicit-any` referenced without the plugin being
  registered. `npm run lint` fails. `npm run type-check` is the reliable
  static check. Tracked as a Known Broken item.
- **Deploy:** not applicable — npm library, no hosting provider.

## What works

All specs 01–08 shipped:

- [x] Effects engine (Tier 1 DoTs, stat mods, action restrictions)
- [x] Combat round resolver (`resolveCombatRound`)
- [x] Tier 2/3 effect procs (`Stance × action` tables)
- [x] Skills engine + 12 early-game skills library
- [x] Equipment engine + 50 pieces + 12 consumables
- [x] Character progression (XP, levelling, skill learning)
- [x] Enemy library + AI (random, scripted, conditional)
- [x] World map (nodes, continents, quests, dialogue, hazards)
- [x] CLIs: `combat.cli.ts`, `character.cli.ts` (interactive, not published)
- [x] `createGameStore` (Zustand) scoped to combat + inventory + equipment + save

## Known broken / decayed

1. **ESLint config** — `npm run lint` fails. See `AGENTS.md` Caveats.
   [needs-user-call: low priority; type-check covers the gap]
2. **`game.reducer.ts`** is intentionally minimal — `createNewGameState` +
   `GAME_STATE_VERSION` only. No `gameReducer` dispatch yet.
3. **`store.ts` world gap** — no `moveToNode` / `processNode` actions on
   GameStore yet; consumers must compose reducers directly.
4. **Combat actions** are modelled via the `Action` type (no
   `actions.constants.ts` / `COMBAT_ACTION` — removed at `6fc2a08`); no
   game-level action-constant module.

## What's missing for v1

- Spec 09: `gameReducer`, full game loop, `game.cli.ts`
- Spec 10: Moral/difficulty meter
- Spec 11: RNG seeding + test harness
- Spec 12: Package architecture, event surface, React Native adapter doc

## Conventions worth keeping

- Commit style: `<type>(<scope>): <short description>` (feat, fix, refactor,
  chore, docs, test)
- Module structure: each module in its own folder with colocated tests
- Hermetic e2e per module: `src/<Module>/e2e/<feature>.engine.test.ts`
- `npm` (not pnpm) as package manager
- No `Co-Authored-By:`, no emojis

## Conventions worth breaking

- None identified — current structure is clean and consistent.
