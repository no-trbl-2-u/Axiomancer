# Phase 2 — Fix engine API drift (verify-gate unblocker)

> Retroactive brief. Phase 2 was discharged in commit `527f021`
> ("Fix audit issues") under the `feature/adopt-nexus` branch
> before this brief was authored — this file exists so future
> ticks can see the contract that was actually shipped.
> No code work remains; this is bookkeeping substrate.

## Scope

Unblock `npm run verify` after the `axiomancer-mechanics ^0.4.1`
bump renamed `Consumable.effect → effectId` and added required
fields (`rarity`, `requiredLevel`) on `Equipment`. The autonomous
loop is unsafe at any level until verify is green; this is the
gating phase.

No product behaviour changes — strictly type-and-fixture
migration to match the engine package's new public surface.

## Files touched (as shipped)

```
state/actions.ts                            # consumable.effect → effectId
state/presenters/inventory.modal.engine.ts  # (item as any).effect → effectId
state/e2e/inventory.engine.test.ts          # fixtures: effectId + rarity + requiredLevel
state/e2e/inventory.modal.engine.test.ts    # fixtures: effectId + rarity + requiredLevel
state/e2e/inventory.screen.test.tsx         # fixtures: effectId + rarity + requiredLevel
```

## Verify gate

```bash
npm run verify        # lint + tsc --noEmit + jest
```

Confirmed green at commit `527f021`: 0 type errors, 185 / 185
hermetic e2e tests pass. Lint produces 7 pre-existing
unused-import warnings; no new noise introduced.

## Deploy gate

```bash
npm run deploy:check
```

Stub (exit 0) until phase 11 wires the real EAS Build API poll.
Unchanged by phase 2.

## Tests

No new tests authored. The 3 inventory e2e fixtures already
covered the surface; they were the **failing** fixtures the
phase migrated. Verify-gate green is the test.

## Decisions made upfront — DO NOT ASK

- **Mechanical rename, not semantic migration.** The audit's
  `[HIGH]` row prescribed renaming `effect → effectId`. The new
  `Consumable` type also exposes structured `healAmount?: number`
  and `inlineEffect?: Effect` — semantically richer than the old
  free-form `effect` string. The phase did **not** migrate to
  those fields. Instead it stuffed the existing `"Heal N HP"`
  description string into `effectId` so the existing
  `parseHealAmount` parser keeps working unchanged. **Why:**
  preserves the audit's "mechanical" framing, keeps the diff
  surface minimal, and turns the verify gate green with the
  least churn. A future `/iterate` tick should migrate to the
  structured fields — flagged in `plan/AUDIT.md`'s Done entry
  for [HIGH] engine drift.
- **`rarity: 'common'` and `requiredLevel: 1` on every test
  Equipment fixture.** These are the least-surprising defaults
  for a test sword / dagger / blade; no fixture exercises rarity
  tiers or level gates today.
- **No engine-package version bump.** `^0.4.1` was already
  installed; the phase migrates callers, not the dependency.
- **Push to `feature/adopt-nexus`, not `main`.** Matches the
  established branch pattern for the nexus adoption work; PR
  merge to main is the user's call.

## `[needs-user-call]` rows logged in `plan/AUDIT.md`

None opened by this phase. All four `[needs-user-call]` rows
audit-logged at adoption (hosting/deploy contract, canonical
name, GH PAT scope, README companion docs) are independently
resolved in the same `527f021` commit — see `plan/AUDIT.md`'s
Done section for each resolution path.

## Mobile reflow / responsive considerations

N/A — type-level migration, no UI surface.

## Git

Single atomic commit `527f021` ("Fix audit issues") on
`feature/adopt-nexus`. Phase 2's row flip + Phase log entry
land in a follow-up `plan: phase 2 shipped — engine API drift
fix` commit (per the canonical DoD pattern; phase 1 set the
precedent).

## DoD

After commit + push of the migration (already done at `527f021`):

1. Flip Phase 2's `[ ]` → `[x]` in
   `plan/steps/01_build_plan.md`, append commit hash.
2. Add Phase log entry: `phase 2 — 527f021 — engine API drift
   fix (effect → effectId; rarity + requiredLevel on Equipment)`.
3. Flip the Spec 07 carry-over: in "Already shipped" change
   `[-]` → `[x]` for Spec 07 (close-out shipped in `527f021`),
   and remove the corresponding "Carry-overs" row.
4. Remove the "No `Knowledge-Gaps.md` / `BRAINDUMP.md` /
   `GAME-ROADMAP.md` in this repo today" carry-over (the README
   pointers were removed in `527f021`).

## Confirm deploy

```bash
npm run deploy:check
```

Exit 0 (stub). No further action.

## Follow-ups (out of scope this phase)

- **Structured-consumable migration.** Move from
  `effectId: '<description>'` + `parseHealAmount` to the engine
  package's `healAmount?: number` / `inlineEffect?: Effect`
  fields. Small, contained, schedulable as a single `/iterate`
  tick. See `plan/AUDIT.md` Done [HIGH] for the rationale.
- **Phase 11 deploy-gate wiring** (unrelated; queued).
