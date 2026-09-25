# Phase 10 — Multi-screen integration test harness

> Status row: `plan/steps/01_build_plan.md` § Cross-cutting / debt.
> Package: `axiomancer-mobile`. Type: test-only (no product surface
> change); closes a testing-methodology gap flagged in
> `plan/CURRENT-STATE.md` ("Hermetic tests are blind to cross-screen
> integration regressions — the FIGHT-modal-unmount class. Real gap.").

## Outcome

Close the specific, historically-proven blind spot: a state
transition that's correct for one screen in isolation (the encounter
modal's mount condition) silently breaks a *different* screen (the
tab bar's visibility/lock) because both derive from overlapping-but-
not-identical state, and nothing exercises them **together**. Ship
one Jest test file that mounts two real screens at once and drives
the actual regression's transition, plus one Playwright script that
proves the same contract survives in a real browser.

## Background — the regression this pins

Commit `a18ee12b` (`feat(spec63c): modal-contained encounter session
— fix mid-encounter unmount + lock tab bar`) fixed two linked bugs
from one root cause: `ExplorationScreen`'s modal-mount gate and
`(tabs)/_layout.tsx`'s tab-bar-lock gate each read state that looked
equivalent but wasn't (`selectHasActiveEvent` short-circuits false
the instant `state.combat`/hazard-combat starts). The fix introduced
`inEncounterModal` (`state/combat-mode.tsx`) as the single flag both
screens now key off. `components/event/__tests__/EncounterModalOverlay.test.tsx`
("combat mode survives vm.kind change") pinned the fix, but **only
at the single-component level** — it re-renders `<EncounterModalOverlay>`
with a manually-flipped `vm` prop; it never renders the actual
`ExplorationScreen` + `(tabs)/_layout.tsx` together, so a *new* drift
between the two screens' gates (a fresh consumer added to one but
not the other) would not be caught by anything short of a real
two-screen mount. That is exactly what ships here.

`docs/E2E_INVENTORY.md` §9 already anticipated this need and
recommended "extending `smoke-render.engine.test.tsx` with deeper
mount probes... rather than reaching for a Detox / Playwright layer."
This phase honors that recommendation for the Jest half (a new
dedicated file, same `withProviders` + `seedActiveEvent` pattern
`smoke-render.engine.test.tsx` already established) and adds a
narrowly-scoped Playwright script for the browser half, using the
existing `scripts/*-e2e.mjs` pattern (`encounter-routing-e2e.mjs`) —
not a new framework layer.

## Scope

**In scope:**
1. New hermetic Jest file:
   `axiomancer-mobile/state/e2e/cross-screen-integration.engine.test.tsx`.
2. New Playwright script:
   `axiomancer-mobile/scripts/exploration-combat-roundtrip-e2e.mjs`
   + `package.json` wiring (`e2e:exploration-roundtrip`, folded into
   `e2e:minigames`).
3. Doc-sync: `docs/E2E_INVENTORY.md` (new pattern **P6 — Cross-screen
   integration**, new inventory row, §9 gap-closure note) and
   `plan/CURRENT-STATE.md` (the "Real gap" line updated to reflect
   the specific class is now pinned).

**Out of scope (follow-ups, noted at the end):**
- Deduplicating the six `scripts/*-e2e.mjs` boot-rig copies into a
  shared `scripts/e2e-lib.mjs` helper. Real debt (each script
  re-implements `runExpoExport`/`startStaticServer`), but a 6-file
  refactor is a different blast radius than "close the blind spot" —
  and touching working, currently-green e2e scripts for a pure
  dedup isn't worth the regression risk in the same phase that adds
  new coverage. Filed as a follow-up.
- A full-provider harness that also mounts the six `*Gate` components
  (`EventGate`, `HazardGate`, …) from `app/_layout.tsx`. The two
  screens in scope here (`ExplorationScreen`, `(tabs)/_layout.tsx`)
  are the actual pair the historical regression touched; broadening
  to the full root-layout tree is a separate, larger harness effort.
- Round-tripping the other four minigame kinds (hazard/rest/gather/
  treasure/quest routes) through Playwright. Those are separate
  full-screen modal routes reached without a natural in-app "back"
  action short of completing/fleeing each minigame — a materially
  bigger script per kind. The `encounter` (combat-prelude) kind is
  the one with a deterministic, immediate return path (FLEE, no RNG
  roll — see `pickEventChoiceAction`'s flee branch, `state/actions.ts:1701`)
  and is also the one the historical bug actually hit, so it is the
  right first round-trip to ship.

## Jest layer — `cross-screen-integration.engine.test.tsx`

**Pattern:** new **P6 — Cross-screen integration** (see doc-sync
below). Mounts `ExplorationScreen` (`app/(tabs)/exploration`) and
`TabLayout` (`app/(tabs)/_layout`) **together** under one real store
+ `CombatModeProvider`, so both screens react to the same
`inEncounterModal` flag from one source of truth — exactly the seam
the regression broke.

**Providers:** mirrors `smoke-render.engine.test.tsx`'s `withProviders`
(`AestheticModeProvider` → `CombatModeProvider` → `GameStoreProvider`;
no `TooltipProvider` needed — precedent: `smoke-render.engine.test.tsx`
mounts `ExplorationScreen` successfully without it).

**`expo-router` mock:** `useRouter` stub (existing pattern) plus a
local `Tabs`/`Tabs.Screen` mock (component names prefixed `mock`
for Jest's hoist-safety lint) that renders a plain `View` per screen
and records the `screenOptions`/`options` it was called with via
`jest.fn()` — so the test asserts on the **real props `TabLayout`
computed**, not a re-implementation of its logic.

**Event fixture:** reuse the `kind: 'encounter'` `ResolveMapEventResult`
shape already proven in `smoke-render.engine.test.tsx` (`ENCOUNTER_EVENT`
— composes to VM kind `'combat-prelude'`) and its `seedActiveEvent`
helper, restated locally (kept file-local; not worth extracting a
shared fixture module for one field's reuse across two files).

**Cases (`describe('integration: exploration + tab-bar lock survive the
encounter-modal lifecycle')`):**
1. Fresh store, no event: `encounter-modal-fight` absent; the real
   `Tabs` mock's last `screenOptions.tabBarStyle.display` is not
   `'none'`; `character/index`'s `Tabs.Screen` `options.href` is
   `undefined` (unlocked).
2. Seed `ENCOUNTER_EVENT`, render: `encounter-modal-fight` present;
   tab bar style `display === 'none'`; `character/index` `href === null`
   (locked) — the prelude arms both screens together.
3. Press `encounter-modal-fight`: assert `store.getState().event.pending`
   is `null` (the engine cleared the slice — the exact moment the
   historical bug fired) **and** `encounter-modal-overlay` is still
   mounted **and** the tab bar is still `display: 'none'` / `character/index`
   still locked. This is the regression pin: both screens must stay
   locked together across the event-slice-clears boundary, driven by
   `inEncounterModal` + `inCombat`, not by the (now-false) `hasEvent`.
4. From a fresh seed, press `encounter-modal-flee` instead: assert the
   modal is gone **and** the tab bar / `character/index` href are back
   to the unlocked baseline — the round-trip close.

## Playwright layer — `exploration-combat-roundtrip-e2e.mjs`

Mirrors `encounter-routing-e2e.mjs`'s boot rig (`runExpoExport` +
`startStaticServer`, 390×844 viewport, `BUILD_PROFILE=preview`) —
copy-and-adapt, per that file's own precedent (no new shared module;
see Follow-ups).

**Flow (deterministic, no RNG dependency):**
1. `goto('/character')` → `self-dev-tools-link` → wait for `/dev`.
2. Click `debug-trigger-encounter-encounter` (the COMBAT dev trigger
   — `components/DebugTriggerEncounter.tsx`; jumps to
   `/(tabs)/exploration` and arms the combat-prelude in-place, no
   map-walk / RNG needed).
3. `waitForURL` ends with `/exploration`; assert `encounter-modal-fight`
   visible; assert the `Character tab` (`accessibilityLabel` → web
   `aria-label`) tab icon is **not visible** (the tab bar's
   `display: 'none'` lock — the browser-level proof the Jest mock
   props actually manifest as real layout).
4. Click `encounter-modal-flee`; assert `encounter-modal-fight` /
   `encounter-modal-overlay` gone; assert `Character tab` visible
   again; assert `map-canvas-wrapper` still visible (the map survived
   the round trip, not just the chrome).

**Exit codes:** mirrors `encounter-routing-e2e.mjs` (0 pass / 1
assertion fail / 3 boot failure).

**Wiring:** `package.json` `"e2e:exploration-roundtrip": "node
scripts/exploration-combat-roundtrip-e2e.mjs"`; append to the
`e2e:minigames` composite chain with its own `*_REUSE_EXPORT` env
flag, matching the existing chain's convention.

## Doc-sync

- `docs/E2E_INVENTORY.md` §2 table: add a **P6 — Cross-screen
  integration** row ("Mounting two real, related screens together
  (e.g. a tab screen + its tab layout) under one store and driving a
  real state transition between them; asserts the two screens' derived
  UI state stays consistent across the transition" / mounts full
  screens / real engine).
- §3 inventory: add
  `cross-screen-integration.engine.test.tsx | P6 | ExplorationScreen +
  (tabs)/_layout mounted together; inEncounterModal drives both the
  encounter-modal mount AND the tab-bar lock in lockstep across the
  FIGHT event-slice-clear boundary (pins commit a18ee12b's regression
  class at the two-screen level) | 1 | 4`.
- §9: append a line noting this file is the "deeper mount probe"
  extension of `smoke-render.engine.test.tsx` the section already
  called for, plus the new Playwright script as the browser-level
  companion (still out of scope for the *hermetic* suite proper, but
  now closing the gap at the integration layer).
- `plan/CURRENT-STATE.md` line 82-83: update "Hermetic tests are
  blind to cross-screen integration regressions (the FIGHT-modal-unmount
  class). Real gap." → note the class is now pinned by
  `cross-screen-integration.engine.test.tsx` +
  `exploration-combat-roundtrip-e2e.mjs`; keep the general caution
  (only this one seam is covered, not cross-screen integration
  broadly) so the line still does its job as a standing reminder.

## Decisions made upfront — DO NOT ASK

- **Which two screens:** `ExplorationScreen` + `(tabs)/_layout.tsx`.
  They're the literal pair the historical bug broke; any other pair
  would be manufacturing a seam rather than closing the documented one.
- **Mock `Tabs`/`Tabs.Screen`, don't render the real navigator:** the
  existing hermetic suite mocks `expo-router` everywhere (jest-expo
  has no real navigation container in the test environment); a
  props-capturing mock lets the test assert on TabLayout's actual
  computed props without needing a real `NavigationContainer`. The
  Playwright script is what proves the props manifest as real layout.
- **Reuse the `ENCOUNTER_EVENT` fixture shape, not a new one:**
  `smoke-render.engine.test.tsx` already proved this exact fixture
  renders `ExplorationScreen`'s combat-prelude branch without
  throwing; reusing it (restated locally, not cross-imported — test
  fixtures don't need a shared module for one reused literal) keeps
  the new test's engine-state assumptions consistent with existing
  coverage.
- **FLEE, not full combat playthrough, for the Playwright round-trip:**
  `pickEventChoiceAction`'s flee branch (`state/actions.ts:1701`) is
  unconditional (a fixed morale shift, no RNG roll) — deterministic
  and fast. Playing a full hazard combat to victory/defeat in the
  browser is what `scripts/combat-encounter-e2e.mjs` already does
  (direct-to-`/combat-encounter`, seeded); duplicating that here for
  a "return to map" check would be redundant scope, not new coverage.
- **No shared `scripts/e2e-lib.mjs` in this phase:** noted under
  Follow-ups. Real debt, wrong blast radius for this phase.
- **`__esModule` / component naming for the `expo-router` mock:**
  name the mock components `mockTabsComponent` / `mockTabsScreenComponent`
  (jest's hoist-safety babel plugin allows references to identifiers
  whose name starts with `mock`, so the mock factory can define
  `jest.fn()`-wrapped components without a "used before defined"
  hoisting violation) — mirrors the existing repo convention of
  inlining `jest.mock('expo-router', () => ({...}))` per test file
  (`smoke-render.engine.test.tsx`, `app-components.engine.test.tsx`)
  rather than a shared `__mocks__/expo-router.ts`.

## Pages × tests matrix

| Surface | Test file | New/extended |
|---|---|---|
| `ExplorationScreen` + `(tabs)/_layout` (Jest) | `state/e2e/cross-screen-integration.engine.test.tsx` | New |
| `/exploration` combat-prelude round-trip (browser) | `scripts/exploration-combat-roundtrip-e2e.mjs` | New |
| `docs/E2E_INVENTORY.md` | — | Extended (P6 row + gap note) |
| `plan/CURRENT-STATE.md` | — | Extended (gotcha line updated) |

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Scoped to mobile (no mechanics public-surface change). The new
Playwright script itself is exercised manually
(`node scripts/exploration-combat-roundtrip-e2e.mjs`) before commit,
same as `encounter-routing-e2e.mjs`'s own precedent — CI's
`verify-mobile.yml` `e2e-minigames` job picks it up going forward via
the `e2e:minigames` composite.

## Commit body template

```
test(mobile): cross-screen integration harness — phase 10

- <bullet 1>
- <bullet 2>

Decisions:
- <as listed above, condensed>

Closes #<phase-issue-number>
```

## DoD

- New Jest file green under `npm run verify --workspace axiomancer-mobile`.
- New Playwright script passes locally
  (`node scripts/exploration-combat-roundtrip-e2e.mjs`).
- `docs/E2E_INVENTORY.md` + `plan/CURRENT-STATE.md` updated.
- `plan/steps/01_build_plan.md` phase 10 row ticked `[x]` with commit hash.

## Follow-ups (out of scope)

- Shared `scripts/e2e-lib.mjs` to dedupe the boot rig across all
  `scripts/*-e2e.mjs` files.
- Full-provider (`*Gate`-inclusive) cross-screen harness.
- Round-trip coverage for hazard/rest/gather/treasure/quest full-screen
  modal routes (each needs its own completion-or-flee path designed).
