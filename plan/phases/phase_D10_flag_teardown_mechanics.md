# Phase D10 — Dice-flag teardown (1/3): mechanics engine collapse

> Agent-facing brief. Ship without asking; document judgment calls in the
> commit body. **Engine work on `combat.engine.ts` — pause `/march` + night
> crons before starting** (collision discipline). **Hard dep: Phase D8 must be
> MERGED to `main` first** — D8 is in flight in a parallel worktree and also
> edits `combat.engine.ts` / `combat.starter-deck-presets.ts`; do not start
> until it lands, then rebase and COLLAPSE D8's flag branches rather than
> reverting them.

## Outcome / Why

Owner decision (chat, 2026-07-18): *"go all in on the dice mechanics — remove
the feature flag and commit to the new dice mechanics; remove what was before
it."* THE FLIP already made every app build boot Upgradeable Dice ON
(`axiomancer-mobile/state/combat/flags.ts`); the flag now only carries the
legacy pre-spec-33 model as dead weight plus a dev/triage kill-switch. This
phase makes the flag-ON (spec-33) model the **only** model in the mechanics
package and deletes the legacy flag-OFF code it was hiding behind.

D10 is the first of three (D11 mobile, D12 barrel + dead-symbol removal). It
deliberately KEEPS the barrel exports (`setUpgradeableDice` /
`isUpgradeableDiceEnabled`) alive as shims so mobile + card-editor still
compile between phases — D11 stops mobile using them, D12 deletes them.

**Success state:** with the flag hard-wired ON, the full mechanics verify gate
is green, no legacy dice-model code path is reachable, and
`isUpgradeableDiceEnabled()` returns a constant `true`. The legacy wheel /
STAKE-settle / variety-refresh / legacy-roll / draft-and-normal-play-read
bodies are gone. `draftStanceDie` / `placeStake` survive only as no-op shims
(their callers are rewired in D12).

## Scope order (safe collapse sequence — also the authorized split seam)

Do the subsystems in this order. **§0 split seam (ship-a-phase §10.8, the D6
precedent):** if the tick approaches the context ceiling, ship steps 1–4 as
D10 and carry steps 5–7 to a D10-cont phase — the seam is *"engine behavior
collapsed + green"* (1–4) vs *"legacy/agnostic test rewrite + D8-preset
collapse"* (5–7). Prefer one tick; split only if forced, and say so in the
commit body.

1. **Hard-wire the flag.** `combat.upgradeable-dice.ts:34-45`:
   `isUpgradeableDiceEnabled()` → `return true`; `setUpgradeableDice()` → no-op
   (keep both symbols + the export — D12 removes them). This alone turns every
   branch below into "flag-on always"; do the deletions so no dead `else`
   lingers.
2. **Momentum + STAKE + DRAFT collapse** (`combat.engine.ts`):
   - `:1052` keep `applyStanceAndMomentumV2`; DELETE the `:1053`
     `advanceMomentumWheel` call and the `advanceWheel` (`:248`) +
     `advanceMomentumWheel` (`:277`) bodies.
   - `:889` `placeStake` → permanent no-op (delete the legacy body below the
     early return; keep the symbol). `:3371` keep the passthrough; DELETE the
     `settleStake` (`:3318`) call + body.
   - `:717` `draftStanceDie` → permanent no-op (delete the legacy body; keep
     the symbol). `:1831` keep the any-die powering block; DELETE the legacy
     drafted-die/single-die powering path.
3. **Roll + read + reroll + kindle collapse** (`combat.engine.ts`):
   - `:579` the spec-33 roll block becomes the unconditional roll; DELETE the
     fall-through legacy roll path.
   - `:1909` read is `'none'` for normal play; keep the `poweringSource ===
     'fate-x'` bypass (SHARED — see caveats). Prune only the legacy
     draft/normal-play `resolveRead`/`clampPlayerRead` branch.
   - `:969` `overheatSpentDie` guard drops (body is flag-on-only, KEEP body).
   - `:2704` the `{ face: 'mana' }` spread becomes unconditional; `:2707`
     `kindleBlocked` cap becomes unconditional.
   - `:4454` `v2Reroll` collapses to `skill.kind === 'reroll'` at
     `PRESS_FATE_COST`; DELETE the legacy `skill.cost` reroll arm.
   - `:3064` `chainRefresh` collapses to `false` — remove the term from the
     `refreshed` expression (`:3065`).
   - `:831` keep the Reserve-banking block; DELETE the legacy `else` banking.
   - `:3379`/`:3383` keep `resolveStanceCheck` + the event push (guard reduces
     to `if (phase.stanceCheck)`).
4. **Signature + sim collapse:**
   - `combat.signature.ts:156` keep `rerollMissFacesHonest`; DELETE the
     `rerollSpentDice` branch (`:168`).
   - `combat.encounter.sim.ts:447` the sim always calls `upgradeablePlayPhase`
     (`:321`); DELETE the entire legacy `policyPlayPhase` body below `:447`
     (this removes its draft/stake sim callers, incl. `STAKE_SIM_AMOUNT`).
   - `combat.upgradeable-economy.sim.ts` — DELETE the flag-off control arm
     (`measureStakeGap` / `flagOffAvgRounds`, lines ~376-396) and the
     `wasOn` save/restore scaffolding.
   - `combat-playtest.cli.ts:134-148` — DELETE the `has('upgradeable-dice')`
     opt-in + `wasUpgradeable` save/restore (matrix is always upgradeable now).
5. **Delete legacy-only tests:** `src/Combat/e2e/the-stake.engine.test.ts`
   (STAKE retired), `momentum-wheel.engine.test.ts` (legacy wheel),
   `combat-deck-draft.engine.test.ts` + `reward-draft.sim.test.ts` (legacy
   draft) — audit each; delete or rewrite to `advanceMomentumV2` /
   `upgradeablePlayPhase` as appropriate.
6. **Rewrite flag-agnostic tests that baked in the legacy model** so they pass
   under unconditional flag-on. Highest-risk (they never toggled the flag, so
   they run legacy today): `hazard-pattern-combat.engine.test.ts` (draft
   `:106`, `resolveRead` `:117-129`), the `rerollSpentDice` §4 block in
   `hazard-pattern-combat-helpers.engine.test.ts:332-385`, and the flag-OFF
   canaries in `combat-dice-economy.sim.test.ts` (`.toBe(false)` at `:67/:83/
   :153`, `afterEach(setUpgradeableDice(false))` `:40`) → rewrite to
   flag-state-free assertions of the (now sole) upgradeable economy. Drop the
   redundant `setUpgradeableDice(true)` scaffolding from the flag-on suites
   (`upgradeable-dice`, `die-gear-rail`, etc.) and delete the lone legacy
   sub-case in `upgradeable-dice.engine.test.ts:477-483` (STAKE-refused).
7. **Collapse D8's flag-gated preset construction** in
   `combat.starter-deck-presets.ts` to the sole recipe (whatever shape D8
   shipped — the flag-on "14 inherited + 1 valve" recipe becomes THE recipe;
   delete the flag-off byte-identical branch and its helper's flag guard).

## Reality-check before shipping (mapper caveats — DO NOT over-delete)

- **`resolveRead` / `CombatReadResult` / `fate-x` are SHARED, not legacy.** The
  Fate Engine X-die path (`poweringSource === 'fate-x'`,
  `combat.engine.ts:1883/2064/3091`) keeps its read, and `resolveRead` still
  backs the preview helpers (`:4566/4636/4680`) and
  `hazard-pattern-combat.engine.test.ts`. Prune ONLY the draft/normal-play read
  branch; keep the type, the function, and the `fate-x` bypass.
- **`combat.dice.ts` is partly shared.** KEEP `RESERVE_MAX`, `ripenReserve`,
  `FLOATING_DICE_CAP`, `materializeFloatingDice`, `overheatReserve`,
  `spendDice`, `availableDiceFor`, `combatDieCanPower`,
  `rollPermanentBonusDice`, `MAX_PERMANENT_WILD_DICE` (all imported live at
  `combat.engine.ts:59-62`). Only the legacy roll primitives
  (`rollCombatDice` / `rollTurnDice` / `rollCombatDieColor` /
  `COMBAT_DICE_COUNT` / `TURN_DICE_COUNT`) + `rerollSpentDice` are legacy
  candidates — and their full removal is **D12**, not here.
- **`rerollSpentDice` at `combat.engine.ts:2769`** — inspect this call. If it
  is on a flag-on-live path (OVERHEAT context), `rerollSpentDice` is NOT dead;
  leave it and record the finding for D12. Do not delete `rerollSpentDice` in
  D10.
- **`draftStanceDie` / `placeStake` are barrel-exported and called across
  sim/CLI/autoplay/mobile.** In D10 they become no-op shims (bodies deleted,
  symbols kept). Do NOT delete the symbols or rewire CLI/autoplay here — that
  is D12 (which owns the barrel + caller rewire).

## Decisions made upfront — DO NOT ASK

- **Commit to flag-ON; the flag becomes a constant.** This is the owner's "go
  all in." The D7 "not ready" gate and the STAKE-gap canaries are explicitly
  overridden — do not treat them as blockers; rewrite them.
- **Delete unreachable bodies, shim the still-called symbols.** No-op
  `draftStanceDie`/`placeStake` (D12 removes them); keep the barrel intact so
  mobile/card-editor compile between phases.
- **Keep the SHARED surfaces** (`resolveRead`/`fate-x`, the `combat.dice.ts`
  Reserve/spend helpers, `rerollSpentDice` if `:2769` is live). Over-deletion
  that breaks `fate-x` or the Reserve is a regression, not a cleanup.
- **Rewrite, don't skip, the flag-agnostic tests.** A red suite is not
  "done" — every mechanics test must be green under unconditional flag-on. Net
  test count drops (legacy suites deleted); that is expected.
- **`setUpgradeableDice` stays a callable no-op** so existing `.toBe(true)`
  call sites and the mobile flag hook keep compiling until D11/D12.

## Surface as `[needs-user-call]`

- Nothing expected. The only judgment boundary is the `fate-x`/read shared cut
  and the `:2769` `rerollSpentDice` live-path check — both are code reads, not
  owner calls. Resolve them in-code and note the verdict in the commit body.
  Only a genuine contradiction discovered while collapsing (cite file:line and
  stop that item) warrants surfacing.

## Pages × tests matrix

| Surface | Tests |
|---|---|
| roll / color / whiff law | `upgradeable-dice.engine.test.ts` green with flag scaffolding dropped |
| momentum (null-reset/surge) | `advanceMomentumV2` truth table; no `advanceWheel` reference anywhere |
| STAKE removed | `the-stake.engine.test.ts` deleted; no `settleStake` reference |
| draft removed | draft suites deleted/rewritten; `draftStanceDie` is a no-op |
| Press Fate | honest `rerollMissFacesHonest`; no `rerollSpentDice` in the signature reroll path |
| sim | `combat.encounter.sim.ts` always `upgradeablePlayPhase`; matrix suites green |
| economy canaries | `combat-dice-economy.sim.test.ts` rewritten flag-state-free |
| hazard-pattern regression | `hazard-pattern-combat*.engine.test.ts` green under flag-on |
| `fate-x` intact | `fate-engine.engine.test.ts` + read previews still green (shared read survives) |
| D8 presets | `deck-presets.engine.test.ts` green with the single (ex-flag-on) recipe |
| mobile smoke | `npm run verify -w axiomancer-mobile` green (barrel shim keeps imports valid) |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics     # full engine gate
npm run verify --workspace axiomancer-mobile        # smoke — barrel shim must keep it green
# sanity: legacy model unreachable (only shims / git history may remain)
git grep -nE "advanceWheel|advanceMomentumWheel|settleStake|chainRefresh|policyPlayPhase|rollCombatDice|rollTurnDice" -- 'axiomancer-mechanics/src' ':!*/e2e/*' ':!plan/'
```

Run the mechanics tests twice before claiming deterministic coverage.

## Commit body template

```
refactor(mechanics): collapse the dice flag to spec-33 — phase D10

- Hard-wire isUpgradeableDiceEnabled() to true (setUpgradeableDice → no-op;
  both kept in the barrel as shims for D11/D12). Collapse every flag branch
  in combat.engine.ts / combat.signature.ts / combat.encounter.sim.ts /
  combat.upgradeable-economy.sim.ts / combat-playtest.cli.ts to the flag-on
  side and delete the unreachable legacy bodies: advanceWheel/
  advanceMomentumWheel, settleStake, the variety-chain refresh, the legacy
  roll block, the draft/normal-play resolveRead path, and the legacy
  policyPlayPhase body.
- draftStanceDie / placeStake reduced to no-op shims (bodies gone; symbols +
  callers removed in D12). Shared surfaces kept: resolveRead/fate-x, the
  combat.dice.ts Reserve/spend helpers, rerollSpentDice (<:2769 verdict>).
- Deleted legacy-only tests (the-stake, momentum-wheel, draft) and rewrote
  the flag-agnostic + economy-canary suites to the unconditional model.
- Collapsed D8's flag-gated preset construction to the sole recipe.

Decisions:
- Owner "go all in" (2026-07-18) overrides the D7 not-ready gate; canaries
  rewritten, not honored as blockers.
- Delete unreachable bodies; shim still-called symbols; keep SHARED
  read/fate-x + Reserve helpers. rerollSpentDice :2769 = <live|dead>.
- Split seam used? <no | yes — steps 5-7 carried to D10-cont because …>.
```

## DoD

Flip Phase D10 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash + a Phase log row. `deploy:check` green. Note in the build-plan
group whether the split seam was used.

## Follow-ups (out of scope — later teardown phases)

- **D11 (mobile):** collapse the presenter/`CombatBoard` flag branches, delete
  `state/combat/flags.ts` + the kill-switch + `flags.test.ts`, and
  delete/rewrite the legacy flag-off e2e harnesses.
- **D12 (barrel + dead-symbol removal):** delete the flag shim + the no-op
  `draftStanceDie`/`chooseDraft`/`placeStake` symbols (rewiring residual
  sim/CLI/autoplay callers), fully prune `rerollSpentDice` (per the `:2769`
  verdict) + the legacy roll primitives in `combat.dice.ts`, prune the flag +
  Phase-31 barrel exports, and fold `combat.upgradeable-dice.ts` into the
  canonical `combat.dice.ts`.
- **D-FLIP:** superseded by this teardown — recommend `/oversight` mark it
  `[skipped]`.
