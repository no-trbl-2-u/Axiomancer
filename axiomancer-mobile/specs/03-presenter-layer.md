# Spec 03 — Presenter Layer

> Status: [DONE on 2026-05-12 — see commit e378f99]

## Goal

Define the contract between engine state and screens: a pure presenter
function per screen, `select<Screen>ViewModel(state, args?) =>
ViewModel`, that maps engine state to UI props. Screens become "dumb"
components that render the view-model — no math, no shaping, no
direct engine access.

**Success state:** Every screen has a sibling `*.engine.ts` file
exporting the canonical `select…ViewModel` for that screen, plus the
`ViewModel` type. Screens import only from the presenter and from
shared `components/`. The presenters are 100% covered by hermetic
e2e tests.

## Why now / dependencies

- **Unblocks:** Specs 04–08 (each screen wiring follows the contract
  defined here). Without this, every screen has to invent its own
  shape and the hermetic-e2e standard becomes inconsistent.
- **Depends on:** Spec 01 (test harness), Spec 02 (engine store —
  presenters consume `GameState`).

## Current state

- No presenter files exist. Every screen does its own data shaping
  inline (e.g. `combat.tsx` line 74: `BEATS[selectedStance] === enemy.lastStance`).
- Spec 01 ships *one* reference presenter
  (`selectCombatHudViewModel`) — this spec generalises that pattern
  to the whole app.

## Open questions

1. **Naming convention.** Pick one:
   - (A) **(default)** `select<Screen>ViewModel` (e.g.
     `selectCombatViewModel`). Matches Redux norms; clear "this
     selects from state" semantics.
   - (B) `compute<Screen>` — terser, describes what it does.
   - (C) `derive<Screen>VM` — terser still; `VM` suffix for the type.
   > Your answer: A

2. **Argument shape.** The presenter takes `state` plus what?
   - (A) **(default)** Just `state` — plus an optional `localUi` arg
     for purely-ephemeral UI state the engine doesn't track (selected
     stance preview, open modal). The screen passes its `useState` as
     the second arg.
   - (B) Just `state` — every UI-only piece becomes engine state too.
   - (C) `(state, props)` — the screen's route params are the second
     arg.
   > Your answer: A

3. **View-model immutability.** Should the returned object be deeply
   frozen in dev?
   - (A) **(default)** Yes (`Object.freeze` recursive in dev,
     no-op in prod) so screens can't accidentally mutate it.
   - (B) No — trust the team.
   > Your answer: A

4. **Memoisation.** Presenters are called on every state change. To
   avoid recomputing the same VM for unrelated state changes:
   - (A) **(default)** Use Zustand's selector + shallow-equal
     subscription; the presenter itself is pure but uncached.
   - (B) Reselect-style memoised selectors with explicit input
     selectors.
   - (C) Skip — the JSON-shaped VMs are cheap; React's render is the
     bottleneck.
   > Your answer: A

5. **What exactly belongs in the VM vs. on the component?** Style /
   layout / colours stay on the component. The VM owns:
   - (A) **(default)** Display strings (already-localised, already-
     formatted), numeric ratios `[0, 1]`, status flags
     (`canPickStance: boolean`), event handlers (the screen wires
     handlers to action dispatchers; the VM exposes a list of
     "what's clickable"); icons / palette by name (the component
     resolves them).
   - (B) Just data — the component decides everything cosmetic.
   - (C) Everything cosmetic too — VM names colours by `AXM.*`
     token.
   > Your answer: B

6. **Localisation.** The current UI hard-codes English. VM strings
   could go through an `i18n` step now or later:
   - (A) **(default)** Later — VM owns raw strings keyed `tHeart`,
     `tBody` etc. only when there's a real locale need.
   - (B) Now — wrap every visible string in `t(…)` with English as
     the only catalog.
   > Your answer: A

## Proposed approach

1. **Lock down the VM contract** in `docs/presenters.md` (new) — one
   page describing the conventions answered above.
2. **Generate the empty engine files** for each screen — landed under
   `state/presenters/<screen>.engine.ts` (not the original
   `app/(tabs)/<screen>/<screen>.engine.ts`; non-route files cannot
   live inside `app/` because Expo Router's `require.context` walks
   it. The route-tree guard in
   [`state/e2e/route-tree.engine.test.ts`](../state/e2e/route-tree.engine.test.ts)
   pins this convention, settled in Spec 01):
   - `state/presenters/combat.engine.ts`
   - `state/presenters/character.engine.ts`
   - `state/presenters/inventory.engine.ts`
   - `state/presenters/exploration.engine.ts`
   - `state/presenters/event.engine.ts`
   Each exports its `ViewModel` type and a stub `select…ViewModel`
   that returns a constant fixture (combat is fully wired against the
   engine — see step 4).
3. **Mirror the test scaffolds** at
   `state/e2e/<screen>.engine.test.ts`. Each test pins the VM shape,
   asserts the deep-freeze invariant, and includes a store-lifecycle
   assertion that selection does not call `adapter.save`.
4. **Promote the Spec 01 reference** `combat-hud.engine.ts` into the
   new combat presenter by composition — `selectCombatViewModel`
   embeds `selectCombatHudViewModel`'s output under a `hud` field.
   `combat.tsx` drops its direct `axiomancer-mechanics` import and
   routes `FRIENDSHIP_COUNTER_MAX` through the VM.
5. **Update `docs/testing.md`** to reference the new convention as
   the "highest-level public entry point" for screen-level e2e and
   to name `combat.engine.test.ts` as a second canonical reference.
6. Subsequent specs (04 onward) replace each stub with a real
   implementation.

## Acceptance checklist

- [x] All 6 questions answered.
- [x] `docs/presenters.md` ships.
- [x] Five `*.engine.ts` files exist with stubs + types + tests
      (`combat`, `character`, `inventory`, `exploration`, `event`).
- [x] `npm test` and `npx tsc --noEmit` are clean (88 tests, green
      twice in a row).
- [x] No screen imports `axiomancer-mechanics` directly anymore;
      `combat.tsx`'s former `FRIENDSHIP_COUNTER_MAX` import now flows
      through `selectCombatViewModel`'s `friendshipCounterMax` field.

## Out of scope

- Implementing each screen's real presenter — Specs 04–08.
- i18n catalogue (deferred per Q6 unless flipped).
- Cross-screen view-models (e.g. a global HUD that shows on every
  screen) — Spec 10.
