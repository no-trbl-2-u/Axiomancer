# Phase 3 — Spec 02: Engine store integration

> Retroactive brief. Phase 3 was discharged in commit `efef5f5`
> ("Engine store integration") on 2026-05-11 — before the loop
> was adopted. This file exists so future ticks can see the
> contract that was shipped. No code work remains; this is
> bookkeeping substrate.

## Scope

Replace per-screen `useState` mock fixtures with a single
app-wide game store powered by `axiomancer-mechanics`'s
`createGameStore`. The store is the only place state mutates;
screens read via selectors and dispatch via typed action
wrappers.

See `specs/02-engine-store-integration.md` for the locked
contract; that spec is the source of truth.

## Files shipped (as of `efef5f5`)

```
state/GameStoreProvider.tsx        # React Context + Zustand store; useGameState + useGameActions
state/store.ts                     # createAppStore() — thin wrapper around createGameStore
state/actions.ts                   # typed AppActions layer; screens never reach into the engine
state/e2e/store.engine.test.ts     # hermetic e2e for the provider + store lifecycle (190 lines)
app/_layout.tsx                    # mounts <GameStoreProvider> at the root
app/(tabs)/combat.tsx              # first screen migrated to useGameState / useGameActions
docs/state.md                      # state-layer overview (companion to AGENTS.md)
```

Specs 04 (Combat), 06 (Inventory), 07 (Exploration) — shipped
in later commits — extended the same pattern to their screens.
Spec 05 (Character) is queued as Phase 5; until it ships, the
character tab still uses local `useState`, which is by design
per Spec 02's "one screen migrated" success bar.

## Verify gate

```bash
npm run verify        # lint + tsc --noEmit + jest
```

Confirmed green at this branch's HEAD: 185 / 185 hermetic e2e
tests pass.

## Deploy gate

```bash
npm run deploy:check
```

Stub (exit 0) until phase 11 wires the real EAS Build API poll.
Unchanged by phase 3.

## Tests

`state/e2e/store.engine.test.ts` (~190 lines) covers:

- Provider lifecycle — `<GameStoreProvider>` lazily creates a
  store, accepts an injected store / adapter for tests.
- `useGameState(selector)` re-renders only when the selected
  value changes by reference identity.
- `useGameActions()` returns dispatchable wrappers; screens
  never see the raw `store.getState()`.
- Memory-adapter injection — the same hooks run identically
  under a `memoryAdapter` so subsequent specs can stay hermetic.

All later phase tests inherit this harness via
`createAppStore({ adapter: createMemoryAdapter() })`.

## Decisions made upfront — DO NOT ASK

Mirrored from `specs/02-engine-store-integration.md`'s "Open
questions" block, where each was resolved before code shipped:

1. **Provider shape:** B — Context exposes the vanilla
   Zustand store; `useGameState(selector)` and `useGameActions()`
   are the documented entry points. Consumers never see Zustand
   directly.
2. **Store creation:** C — module-level lazy create from
   `nullAdapter` for the app, but the provider accepts an
   `adapter` or `store` prop so hermetic e2e can inject a
   `memoryAdapter`.
3. **Initial game state:** C — boots from
   `createNewGameState()` (level-1 player, `combat: null`);
   screens that need richer state bootstrap it themselves.
4. **Selector ergonomics:** A — per-field selectors
   (`useGameState(s => s.player.hp)`). Spec 03 (Phase 4) will
   layer view-model selectors on top.
5. **Action API:** A — typed wrappers in `state/actions.ts`;
   screens call `useGameActions().startCombat(...)`, never
   `store.getState()` directly.
6. **Dev tools:** A — Reactotron / Flipper skipped for now.

No new decisions made by this retroactive brief.

## `[needs-user-call]` rows logged in `plan/AUDIT.md`

None opened by this phase.

## Mobile reflow / responsive considerations

N/A — state-layer phase, no UI surface.

## Git

Single atomic commit `efef5f5` ("Engine store integration") on
the trunk that eventually became `main`. Phase 3's row flip +
Phase log entry land in a follow-up `plan: phase 3 shipped —
engine store integration` commit (canonical DoD pattern).

## DoD

After commit + push of the implementation (already done at
`efef5f5`):

1. Flip Spec 02 status header from `[READY FOR REVIEW —
   2026-05-11]` to `[DONE on 2026-05-11 — see commit efef5f5]`.
2. Move Spec 02 from "Next up" to "Already shipped" in
   `plan/steps/01_build_plan.md`.
3. Flip Phase 3's `[ ]` → `[x]`, append commit hash.
4. Add Phase log entry: `phase 3 — efef5f5 — engine store
   integration (Spec 02; <GameStoreProvider>, useGameState,
   useGameActions, typed action wrappers, hermetic e2e harness)`.

## Confirm deploy

```bash
npm run deploy:check
```

Exit 0 (stub). No further action.

## Follow-ups (out of scope this phase)

- **Spec 03 (Phase 4) — Presenter layer.** Lock the
  `select<Screen>ViewModel(state) → ViewModel` contract that
  Specs 04, 06, 07 already exemplify. `docs/presenters.md`
  pre-dates the lock — Phase 4 rewrites it.
- **Spec 09 (Phase 7) — `AsyncStorage` persistence adapter.**
  Replaces the `nullAdapter` default at provider mount.
