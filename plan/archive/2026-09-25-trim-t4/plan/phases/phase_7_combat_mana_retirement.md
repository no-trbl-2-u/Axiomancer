# Phase 7 — `combatMana` slice retirement (dead-code + doc cleanup)

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

The build-plan row frames this as a live migration: *"`combatMana`
-> engine `combatResources` migration: retire the slice deprecated
since Phase 105 but still load-bearing in StatusCard / HUD /
actions (mobile; verify Phase 156 didn't already ship it first)."*

Investigation (this phase's Step 3 research) found the migration
**already happened functionally**, just not cleanly: commit
`4cb504a5` ("rip remaining legacy combat; consume mechanics 0.37.0",
2026-06-30) deleted `GameState.combat` / `store.updateCombat`
entirely as part of finishing the legacy turn-based combat removal.
That silently orphaned the mobile-only `combatMana` slice
(`CombatManaState`, Phase 60d) — it was never wired onto
`AppStoreState` to begin with after that commit, so there is no live
`combatMana` field anywhere in the codebase today. `grep -rn
"combatMana"` across the repo returns **only comments** in four
files (`state/store.ts`'s `CombatManaState` JSDoc, `state/actions.ts`'s
top docblock, `StatusCard.tsx`, `combat-hud.engine.ts`) plus two
stale bullets in `plan/CURRENT-STATE.md` / `plan/AUDIT.md` [2.0] — no
component or store selector reads or writes it. `CombatManaState`
itself (the interface) has exactly one reference in the whole repo:
its own declaration.

So "Phase 156" (a pre-monorepo mechanics-package phase number,
unrelated to this repo's Phase 156 status-combo work referenced
elsewhere) or whatever shipped the actual functional retirement is
moot to chase down — reality has already moved past the build-plan
row's premise. What's left, and what this phase actually ships, is
**cleanup**: delete the dead type, fix the four stale comments so
they describe current behavior instead of a migration that never
finished being described accurately, and drain the corresponding
`plan/CURRENT-STATE.md` / `plan/AUDIT.md` [2.0] entries. Zero
behavior change; `npm run verify --workspace axiomancer-mobile`
must stay green with the existing test suite unmodified in
assertions (only comments/dead code move).

**Explicitly not in scope:** the engine's live `CombatResources` /
`CombatState.combatResources` type (`axiomancer-mechanics/src/Cards/types.ts`,
`Combat/types.ts`) and the Hazard-Pattern combat's dice-based resource
system (`CombatManaDie`, `state/presenters/combat-encounter.engine.ts`)
are real, live, unrelated code — nothing here touches them. Also out
of scope: `selectCombatHudViewModel`'s `manaPercent` is permanently
pinned to `1.0` by existing tests (the persistent top-bar HUD
intentionally shows only the out-of-combat overworld player; live
in-combat resources render in the Hazard-Pattern panel's own dice
tray) — that pinned behavior is correct today and this phase does
not change it, only makes the surrounding comments say so honestly.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

None. No route, no CLI, no store-shape/type-contract change visible
to any consumer (`CombatManaState` has no external references to
migrate).

## Content / data reads

None — no engine/content reads touched. This phase is comment +
dead-type cleanup only.

## Components / handlers

- `axiomancer-mobile/state/store.ts` — delete the unused
  `CombatManaState` interface (lines ~63-76). Zero other references
  in the repo.
- `axiomancer-mobile/state/actions.ts` — rewrite the top-of-file
  docblock (lines 1-16): drop the Phase 60d `combatMana` slice
  narrative (false — that slice doesn't exist), replace with a
  short accurate note that in-combat resource accounting is fully
  engine-owned by the Hazard-Pattern driver (no mobile-side mana
  bookkeeping remains).
- `axiomancer-mobile/state/presenters/combat-hud.engine.ts` —
  rewrite the `selectCombatHudViewModel` JSDoc (lines ~44-55) and
  the inline comment above the `combatResources` assignment (lines
  ~67-70) to state plainly: there is no live combat-resources source
  wired to this persistent top-bar HUD (state.combat was removed in
  mechanics 0.37.0), so `manaPercent` is intentionally always `1.0`
  (full) — real in-combat resources are shown by the Hazard-Pattern
  panel's own dice tray, not this bar. Also simplify the
  `hudOverrides.hideMana ? null : null` no-op ternary to a plain
  `const combatResources: CombatResources | null = null;` with a
  one-line comment — same value in both branches today, the ternary
  reads as if `hideMana` still does something when it doesn't;
  behavior is unchanged (still always `null` -> `manaPercent` always
  `1`, matching the existing pinned tests).
- `axiomancer-mobile/components/StatusCard.tsx` — reword the
  Phase-62 comment (lines ~31-33) to drop the `combatMana` slice
  reference; keep the substance (status card intentionally shows
  only out-of-combat HP, no mana bar).
- `axiomancer-mobile/components/DebugHudOverrides.tsx` — reword the
  `HIDE MANA` bullet in the top docblock (line 6) from `forces
  combatMana: null` (never true) to `forces the HUD presenter's mana
  read to null` (matches what the code actually does).

No new files, no new primitives — this is an edit-in-place cleanup
of five existing files plus two plan-state docs.

## Cross-links

**In:** none (nothing downstream references `CombatManaState`).

**Out:** none (no new surface).

**Retro-fit:** `plan/CURRENT-STATE.md` line 51 — replace the
`combatMana` slice deprecated-but-load-bearing bullet with nothing
(the debt item is closed) or a corrected one-liner if the bullet
list would otherwise look truncated. `plan/AUDIT.md` [2.0] moves
from Pending to Done with a `drained` note.

## Output schema / contracts

No type/contract change to any exported shape. `CombatManaState` is
deleted; it was never exported from a public barrel (`state/store.ts`
is mobile-internal, not part of the `@mechanics` public surface), so
this is not a semver-relevant removal.

## Composition

N/A — no new UI.

## Empty / loading / error states

N/A — no behavior change. `manaPercent` stays `1.0` in every case,
exactly as today's tests already assert.

## Decisions made upfront — DO NOT ASK

- **This is a cleanup phase, not a migration.** The functional
  migration this build-plan row describes already happened (as a
  side effect of the unrelated 0.37.0 legacy-combat removal, commit
  `4cb504a5`). Re-litigating "how should combatMana map onto
  combatResources" would be solving an already-solved, no-longer-
  relevant problem. Decide-and-ship per the autonomy contract: ship
  the cleanup that's actually left.
- **Delete `CombatManaState`, don't deprecate-and-keep.** Zero
  external references; keeping a dead, misleadingly-named interface
  around for "compatibility" protects nothing (bearings.md's
  backwards-compat-shim guidance is for live consumers, and this
  type has none).
- **Don't touch `manaPercent`'s pinned `1.0` behavior.** Existing
  tests (`combat-hud.engine.test.ts` in both `__tests__/` and
  `e2e/`) explicitly assert `manaPercent === 1.0` across hideMana
  true/false — that's locked-in intended behavior post-0.37.0, not
  a bug this phase should "fix." Changing it would be new scope
  (deciding what the top-bar HUD should show for in-combat
  resources) that belongs to a dedicated phase/spec, not a
  retirement cleanup.
- **Don't touch `CombatManaDie` or engine `CombatResources`.**
  Name-similar but functionally unrelated live code (Hazard-Pattern
  combat's dice system, and the engine's per-combat resource pool
  respectively) — out of scope, zero benefit to touching, real risk
  if conflated.
- **`plan/AUDIT.md` [2.0] closes as "drained — already resolved
  functionally; Phase 7 shipped the doc/dead-code cleanup."**
  Matches the `## Done` section's existing convention (see the
  `resolveCombatRound` / Hazard v2 entries).

## Mobile reflow / responsive

N/A — no UI change.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `state/store.ts` | none needed — deleting an unused type has no runtime behavior; `npm run type-check --workspace axiomancer-mobile` is the check | — |
| `combat-hud.engine.ts` | existing `__tests__/combat-hud.engine.test.ts` + `e2e/combat-hud.engine.test.ts` must stay green unmodified (they assert the exact behavior this phase preserves) | same files (already e2e-styled) |
| `actions.ts`, `StatusCard.tsx`, `DebugHudOverrides.tsx` | comment-only edits; existing suites (`__tests__/DebugHudOverrides.test.tsx`, any `StatusCard` tests, `actions.ts` consumers) stay green unmodified | — |

No new tests — there is no new behavior to cover. The verify gate's
job this phase is proving zero regression, not proving new
functionality.

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

## Commit body template

```
chore(mobile): retire dead combatMana slice + fix stale HUD comments — phase 7

- Delete unused `CombatManaState` interface (state/store.ts) — zero
  references anywhere in the repo; the mobile-only Phase 60d mana
  slice it described was already orphaned when legacy combat
  (GameState.combat) was removed in mechanics 0.37.0 (4cb504a5)
- Rewrite stale `combatMana`-referencing comments in actions.ts,
  combat-hud.engine.ts, StatusCard.tsx, DebugHudOverrides.tsx to
  describe current (already-correct) behavior instead of a
  migration narrative that no longer matches the code
- Simplify combat-hud.engine.ts's `hideMana ? null : null` no-op
  ternary to a plain null assignment with an honest comment — no
  behavior change, manaPercent still always 1.0 as pinned by
  existing tests
- Drain plan/CURRENT-STATE.md + plan/AUDIT.md [2.0] combatMana bullets

Decisions:
- Treated as cleanup, not migration — the functional retirement this
  build-plan row describes already happened as a side effect of the
  0.37.0 legacy-combat removal; re-litigating the mapping would
  solve an already-solved problem
- Left manaPercent's pinned 1.0 behavior untouched — locked in by
  existing tests, deciding what the top-bar HUD should show for
  in-combat resources is separate, undecided scope
- Did not touch CombatManaDie or engine CombatResources — name-
  similar but unrelated live code

Closes #<phase-issue-number>
```

## DoD

Flip Phase 7's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- `selectCombatHudViewModel` (`combat-hud.engine.ts`) has zero live
  UI consumers — no screen imports it outside its own tests and
  `DebugHudOverrides.tsx`'s doc comment. Whether the persistent
  top-bar HUD it was built for still exists, or should be wired up,
  or should be deleted entirely, is a separate investigation — flag
  to `plan/AUDIT.md` as a new finding, not resolved here.
- `hideStance` (`DevOverridesSlice.hud`) is stored and toggled by
  `DebugHudOverrides.tsx` but never read by `selectCombatHudViewModel`
  (no `stance` field on `CombatHudViewModel`) — looks like a parallel
  partially-wired feature. Not part of this build-plan row; separate
  follow-up if worth chasing.
