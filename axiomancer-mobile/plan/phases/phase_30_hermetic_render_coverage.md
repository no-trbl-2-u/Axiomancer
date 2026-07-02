# Phase 30 — Hermetic render coverage + production bug fix pass

> **Status: [ ] — sized 2-4 ticks.** Promoted via `/oversight`
> 2026-05-16 in response to three user-observed runtime bugs that
> the hermetic VM-shape suite did not catch. See
> `plan/CRITIQUE.md` Done section (the deferred tabs row references
> this phase) and `plan/AUDIT.md` Top Findings 2026-05-16 for the
> bug rows.

## Outcome

The shipped hermetic-test pattern — VM-shape e2e per screen — has
a strategic gap: it doesn't render the full screen tree, so three
classes of regression pass the verify gate but break the deployed
app:

1. **Crashes on mount.** The screen renders fine in isolation
   under VM-shape tests, but throws when mounted as a real React
   tree (e.g. `useStore` getSnapshot identity churn, infinite
   re-render loops).
2. **Blank renders.** The screen returns a render tree that
   collapses to nothing because the VM is empty or a guard short-
   circuits the whole body. VM-shape tests pin the VM but not
   whether the screen actually paints content.
3. **Template-string leaks.** A `<Stack.Screen title=...>` prop
   or a JSX template literal renders as the raw template
   (`{ TAB NAME }"--index"`) instead of the resolved string.
   VM-shape tests don't render any of expo-router's chrome.

Phase 30 ships a `state/e2e/smoke-render.engine.test.tsx` harness
that catches all three shapes for each primary surface, **plus**
the three concrete fixes the user reported.

## Sub-tick decomposition

- **Tick A — Harness scaffold + character-screen fix.** New
  `state/e2e/smoke-render.engine.test.tsx`. Mounts each of:
  `<CharacterScreen>`, `<InventoryScreen>`, `<CombatScreen>`,
  `<ExplorationScreen>`, `<EventScreen>` at fresh-store boot
  under `<GameStoreProvider>` + `<CombatModeProvider>` with a
  minimal `useRouter` mock. Two contract suites:
  (i) `render(...)` doesn't throw;
  (ii) rendered tree contains no `{...}` or `${...}`
  bracketed strings (incl. accessibilityLabel props).
  **Surfaced bug:** the character screen infinite-looped on
  mount — `useGameState(selectCharacterViewModel)` returns a
  frozen-new object every call, churning `useSyncExternalStore`.
  **Fix:** subscribe to slim slice (`s.player`) + `useMemo` the
  VM, mirroring the pattern fixed for event screen in the prior
  session. Lands in the same commit as the harness so verify
  stays green.
- **Tick B — Tab title rendering bug.** Mount the `<Tabs>` layout
  (`app/(tabs)/_layout.tsx`) under the harness; widen the
  template-leak assertion to cover the tab bar's title strings.
  The user reports tab labels rendering as
  `{ TAB NAME }"--index"`. Likely candidates: an expo-router
  config regression, an interpolation in a `Stack.Screen
  options` callback that returns the raw template string, or a
  `name="(...)"`-derived default-title surface. Diagnose by
  inspecting the rendered tab tree; fix in `_layout.tsx`; pin
  with a new assertion.
- **Tick C — Combat encounter blank.** The user reports the
  combat encounter screen renders blank. Suspect surfaces:
  the event modal in combat-prelude state (renders the
  encounter brief before the fight starts) or the combat tab
  when an active fight exists with sparse VM data. Add a
  harness case that boots into each path with a populated
  store and asserts the primary heading + body have non-empty
  text. Fix whichever VM / screen path collapses to nothing.
- **Tick D — (optional / contingency) regression catchnet.**
  If Ticks A-C uncover related smaller bugs, batch the fixes
  here; otherwise skip and close the phase.

If `/ship-a-phase` reaches verify-red between sub-ticks, halt
and re-plan; do not stack.

## Decisions made upfront — DO NOT ASK

1. **Single test file.** All three contract suites live in
   `state/e2e/smoke-render.engine.test.tsx`. Splitting per
   screen would replicate boilerplate.
2. **Minimal mocks.** Only `expo-router` is mocked
   (`useRouter` returns no-op functions). Anything else
   mocked means we're hiding the runtime path.
3. **Template-leak heuristic.** Regex
   `/\{[\s\w.-]+\}|\$\{[^}]+\}/`. Conservative — catches
   obvious leaks without false-positiving on `{` in JSON-ish
   accessibility values. If false positives appear, narrow
   to require word-character + space inside braces; do not
   relax the test.
4. **Tick A is the canonical fix pattern.** Subsequent ticks
   borrow the harness shape: write a failing assertion, ship
   the fix, the assertion goes green in the same commit.
   Verify never goes red between commits.
5. **Tab tests use the live `_layout.tsx`** — no fixture
   substitute. The whole point is to catch expo-router
   integration regressions.
6. **Combat blank diagnosis goes through the VM first.** If
   the issue is "VM returns empty for an active combat
   state," that's a presenter fix, not a screen fix. If the
   VM is populated but the screen still renders nothing, that's
   a screen fix.
7. **Absorbs the rejected expand-pass-8 Phase-31 candidate**
   (presenter-copy invariant guard). The render harness
   catches inline ritual literals as a strict superset of
   what the grep-based guard would have caught, because any
   inline literal that's wrong-shaped renders as visible text
   that the bracket-leak heuristic flags. No separate
   presenter-copy test ships.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at baseline 391/391 (post-`c89b4a7`).
- `@testing-library/react-native@13.x` + `jest-expo` already
  configured; existing screen tests (`inventory.screen.test.tsx`,
  `combat.screen.test.tsx`, `event.screen.test.tsx`) provide
  the import + mock template.
- The prior-session fix to event screen
  (`useMemo` + slim slices) is the template for Tick A's
  character-screen fix.

**Out (ships across sub-ticks):**

- `state/e2e/smoke-render.engine.test.tsx` — new (Tick A).
- `app/(tabs)/character/index.tsx` — subscribe-and-memoize
  refactor (Tick A).
- `app/(tabs)/_layout.tsx` — Tab title rendering fix (Tick B).
- Whichever surface fails the combat-blank assertion (Tick C).
- AUDIT.md — move the three production-bug rows Pending → Done
  as their fixes land.

## Pages × tests matrix

| Surface | Tick | Test cases (delta) |
|---|---|---|
| Character screen render | A | +2 (no-throw, no-template-leak) |
| Inventory screen render | A | +2 |
| Combat screen render | A | +2 |
| Exploration screen render | A | +2 |
| Event modal render (empty) | A | +2 |
| Tab bar render | B | +1 no-template-leak + +1 each-title-non-empty |
| Event modal render (encounter) | C | +1 non-empty body |
| Combat tab render (active combat) | C | +1 non-empty body |

Approx **+10-14** hermetic tests across the phase. Verify
target: ~401-405 after Tick A; ~404-410 after Tick C.

## Verify gate

```bash
pnpm verify
```

Baseline 391/391 (post-`c89b4a7`). Target green; +10-14 tests
after ship.

## Deploy gate

Stub (manual EAS, no auto-deploy). Note: this phase exists in
part because deploy verify can't see render-tree bugs; the
hermetic harness is the substitute.

## Commit body template (Tick A)

```
feat(spec30 tick A): smoke-render hermetic harness + character-screen fix

Phase 30 sub-tick A — closes the test-strategy gap that allowed
three user-observed runtime bugs to pass verify. New
state/e2e/smoke-render.engine.test.tsx mounts each primary
surface at fresh-store boot and asserts (i) no throw + (ii) no
`{ ... }` template-string leaks in rendered output.

Lands one of the three reported bugs alongside the harness:
the character tab was infinite-looping on mount because
`useGameState(selectCharacterViewModel)` returned a frozen-new
object every call, churning `useSyncExternalStore`. Fixed by
subscribing to the player slice and memoizing the VM via
useMemo — mirrors the pattern fixed in event screen earlier.

- state/e2e/smoke-render.engine.test.tsx (new): +10 cases
  covering character / inventory / combat / exploration / event
  with the two contract suites.
- app/(tabs)/character/index.tsx: identity-churn fix.

Verify: 401/401 (was 391; +10 from the harness).
```
