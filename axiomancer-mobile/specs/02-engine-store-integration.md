# Spec 02 — Engine Store Integration

> Status: [DONE on 2026-05-11 — see commit efef5f5]

## Goal

Replace the per-screen `useState` mock fixtures with a single
app-wide game store powered by `axiomancer-mechanics`'s
`createGameStore`. Every screen reads from the store; UI actions
dispatch through the store; the engine remains the only place state
mutates.

**Success state:** A `GameStoreProvider` lives at the root of the app
shell. A `useGameState` hook returns a typed slice; a `useGameActions`
hook returns the dispatchable action creators. At least one screen
(combat) reads its data via the store rather than a literal in
`useState`. No screen calls a reducer directly.

## Why now / dependencies

- **Unblocks:** Spec 03 (presenter layer needs a real state source),
  Spec 04+ (every screen wiring), Spec 09 (persistence adapter must
  attach to the store).
- **Depends on:** Spec 01 (need `npm test` to ship the hermetic e2e
  for the provider lifecycle).

## Current state

- `axiomancer-mechanics@^0.1.1` is in `package.json` `dependencies`.
- No file in this repo imports from it today.
- Every screen owns its own mock state via `useState` + literal
  fixtures (e.g. `app/(tabs)/combat.tsx` lines 56–72; `character.tsx`
  lines 11–33).
- No store provider, no React Context, no Zustand integration in this
  repo.
- The engine ships `createGameStore(adapter, initial?)` — confirm the
  exact shape by reading the package's `dist/index.d.ts` or
  `node_modules/axiomancer-mechanics/dist/Game/index.d.ts`.

## Open questions

1. **Provider shape.**
   - (A) **(default)** Thin React Context exposing the Zustand store
     instance directly; consumers call `useStore(selector)` — no extra
     hook.
   - (B) Two custom hooks (`useGameState`, `useGameActions`) wrapping
     the store, hiding Zustand from consumers.
   - (C) Redux Toolkit shim — engine-as-reducer, app-side dispatching.
   > Your answer: **B** — the spec's success state explicitly names
   > `useGameState` and `useGameActions`; the Context exposes the
   > vanilla store and the two hooks wrap it.

2. **Where the store is created.** The engine's `createGameStore`
   takes a persistence adapter. For runtime:
   - (A) **(default)** Lazily in the provider, with the engine's
     `nullAdapter` until Spec 09 ships an `AsyncStorage` adapter.
   - (B) Inject from outside (the test harness or
     `app/_layout.tsx`) so tests can pass a `memoryAdapter`.
   - (C) Both — module-level singleton for the app, injectable for
     tests.
   > Your answer: **C** — the provider creates a store lazily from
   > `nullAdapter` by default, but accepts an `adapter` prop so the
   > hermetic e2e can inject a `memoryAdapter`.

3. **Initial game state.** Production app starts with…
   - (A) An empty / minimal `GameState` (player at level 1, no enemy,
     no quest). User picks character on first launch.
   - (B) A pre-baked tutorial state (matches today's mock data so the
     UI looks identical the first time you boot it).
   - (C) Defer to Spec 06 (character creation flow) and ship empty
     for now.
   > Your answer: **C** — production boots from `createNewGameState()`
   > (level-1 player, `combat: null`). Screens that need richer state
   > bootstrap it themselves until the relevant flow ships.

4. **Selector ergonomics.** Components today destructure the whole
   mock object. With the engine state, that pattern would re-render
   every screen on every state change. Pick the encouraged pattern:
   - (A) **(default)** Per-field selectors: `useGameState(s => s.player.hp)`.
   - (B) View-model selectors that memoize the whole slice for one
     screen (Spec 03's job).
   - (C) Both — fine-grained for components, view-model for screens.
   > Your answer: **A** — `useGameState(s => s.player.hp)`. Spec 03
   > will layer view-model selectors on top.

5. **Action API.** The engine exposes reducer functions
   (`startCombat`, `setPhase`, `applyDamage`, ...). The mobile app
   calls them via the store's `setState` / `getState` methods. Should
   we wrap them in a typed action layer, or expose `store.getState()`
   directly?
   - (A) **(default)** Typed action wrappers in
     `state/actions.ts` so screens never reach into the engine's
     internals.
   - (B) Direct — `store.getState().startCombat(enemy)`.
   > Your answer: **A** — typed action wrappers in
   > `state/actions.ts`. Screens call `useGameActions().startCombat(...)`,
   > never `store.getState()` directly.

6. **Dev tools.** Reactotron / Flipper integration?
   - (A) **(default)** Skip for now — revisit if debugging gets painful.
   - (B) Add Reactotron with a redux-like inspector for engine state.
   > Your answer: **A** — skip until needed.

## Proposed approach

1. **Inspect the published engine API.** Read the engine's
   `node_modules/axiomancer-mechanics/dist/index.d.ts`; confirm
   `createGameStore`, `nullAdapter`, `GameState`, the action shape,
   and the persistence adapter interface.
2. **Add `state/store.ts`** — module exporting `createAppStore(adapter)`
   that wraps `createGameStore` with the chosen initial state.
3. **Add `state/GameStoreProvider.tsx`** + `useGameStore` hook(s) per
   Q1.
4. **Add typed action layer (`state/actions.ts`)** if Q5 picks (A).
5. **Mount the provider** in `app/_layout.tsx` so every route is
   inside it.
6. **Migrate `app/(tabs)/combat.tsx` first** (it's the most complex
   and will surface the most issues). Replace `enemy` and `player`
   literals with selectors.
7. **Hermetic e2e under `state/e2e/store.engine.test.ts`** —
   - Happy path: provider boots with `memoryAdapter`, store has the
     expected initial state.
   - Action: dispatching `startCombat(enemy)` updates state.
   - Lifecycle invariant: `memoryAdapter.save` is called only when
     the action expects it (combat start vs. mid-action).
   - Selector stability: a selector returning a primitive returns
     `===`-equal results when unrelated state changes.
8. **Document the wiring in `docs/state.md`** — tiny doc, ~30 lines:
   what's a selector, what's an action, how to add a new one.

## Acceptance checklist

- [x] All 6 questions answered.
- [x] `state/store.ts`, `state/GameStoreProvider.tsx`, and (Q5=A)
      `state/actions.ts` exist.
- [x] `app/_layout.tsx` wraps the route stack in the provider.
- [x] `app/(tabs)/combat.tsx` reads at least its `player` and `enemy`
      slices from the store; no literal fixture remains for those
      fields.
- [x] Hermetic e2e under `state/e2e/store.engine.test.ts` covers
      happy path, action dispatch, and adapter invocation pattern.
- [x] `npx tsc --noEmit` clean. `npm test` clean for Spec 02's new
      suite (11 tests); two pre-existing failures in
      `combat-hud.engine.test.ts` (`vm.manaPercent`) are unrelated —
      the engine does not yet model mana, and that test predates this
      work on `main`.

## Out of scope

- Migrating every screen — Specs 04–08 do that one screen at a time.
- A presenter layer / view-model contract — Spec 03.
- AsyncStorage persistence — Spec 09.
- Character creation flow — Spec 06.
