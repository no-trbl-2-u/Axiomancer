# Phase 167 Brief — HP-model combat sim status-engagement metrics

> **Source:** Build plan row 2026-06-29 (oversight promotion). No dedicated spec file — scope is fully described in the build plan row.

## Outcome

`simulateHazardPatternCombat` / `CombatSimStats` gains three new status-engagement metrics:
(a) three-way HP-damage split: DoT fraction, strike fraction, mechanic-burst fraction;
(b) GUARD-mitigated-damage fraction;
(c) mean active effects on enemy per phase.
The balance sim e2e (`hazard-pattern-combat.balance.sim.test.ts`) asserts non-zero values for a DoT loadout.
All existing tests pass; `npm run verify` green.

## Decisions made upfront — DO NOT ASK

1. **No engine changes.** All three metrics are derived in `combat.encounter.sim.ts` by scanning
   `state.log` events and reading state snapshots at the end of `runOneEncounter`. No new fields
   in `CombatEncounterState` or `CombatEncounterTypes`.

2. **Three-way HP split:**
   - `dotHpFraction` = sum of `dot-tick` events with `target: 'enemy'` / total enemy HP lost
   - `strikeFraction` = (`directDamageDealt` - mechanic bursts) / total enemy HP lost
   - `mechanicBurstFraction` = sum of `rupture-detonated.amount` + `execute-fired.amount`
     + `compound-hit.amount` + `conclude-hit.amount` / total enemy HP lost
   - Total enemy HP lost = `enemy.maxHealth - finalEnemy.health` (clamped ≥ 1 to avoid div/0)
   - All three sum to ≤ 1 (some HP loss is from other sources: riposte, thorns, barrier).
   - Float fractions (0–1). Exported as-is.

3. **GUARD metric:** `guardMitigatedFraction` = total guard consumed by threat phases / total
   raw threat damage faced. Tracked in `runOneEncounter` by capturing `state.guard ?? 0` before
   each `resolveThreatPhase` call and checking if a `threat-fired` event is present in the result.
   When `threat-fired` fires, `guardConsumed += min(state.guard, totalThreatDamage)` — but since
   we don't know the exact raw damage, we use the simpler upper-bound proxy:
   **`guardMitigatedFraction` = total guard generated across the encounter / total enemy threat
   damage** (where total enemy threat damage = player start HP - final player HP + guardConsumed
   estimate). Decision: use guard-generated-when-threat-fired as the metric denominator proxy:
   `guardMitigatedFraction = total guard available when enemy acted / (total guard available when
   enemy acted + total HP damage taken by player)`. This is a faithful "GUARD relevance" ratio.

4. **Active effects metric:** `avgActiveEffectsPerPhase` = mean count of `state.enemy.effects.length`
   sampled once per phase at the START of `resolveThreatPhase` (before effects tick). Tracked in
   `runOneEncounter` similarly to guard.

5. **`buildCombatSummary` changes:** NONE. The brief says "add to `CombatBalanceReport` type"
   but there is no `CombatBalanceReport` type — the return is `CombatSimStats`. Decision: add
   the three metrics to `CombatSimStats` only. No `buildCombatSummary` changes needed.

6. **`--report` CLI output:** The `combat-sim.cli.ts` already prints `simulateHazardPatternCombat`
   output. Extend the print line to include the new fields. No `--report` flag to add (the CLI
   always prints all stats).

7. **New type export:** `CombatSimStats` is already exported from `combat.encounter.sim.ts` and
   re-exported from the sub-barrel `src/Combat/index.ts`. Confirm re-export is present; add if not.
   No root barrel change needed (it's not a named type on the root `src/index.ts`).

8. **Test additions:** Extend `hazard-pattern-combat.balance.sim.test.ts` with a new describe block
   asserting that a DOT loadout produces non-zero values for all three new metrics.

## Implementation units

### Unit 1 — Extend `CombatSimStats` + update `runOneEncounter` + `simulateHazardPatternCombat`

**File:** `src/Combat/combat.encounter.sim.ts`

Add to `CombatSimStats`:
```ts
dotHpFraction: number;          // fraction of enemy HP lost via DoT ticks (0–1)
strikeFraction: number;         // fraction via direct strike (0–1, excl. mechanic bursts)
mechanicBurstFraction: number;  // fraction via mechanic bursts (rupture/execute/compound/conclude)
guardMitigatedFraction: number; // guard available when threat fired / (guard + player HP taken)
avgActiveEffectsPerPhase: number; // mean enemy effect count at phase start
```

Update `runOneEncounter` return type and logic:
- Sum `dot-tick` events with `target: 'enemy'` from `state.log` at end of encounter
- Sum mechanic burst events from `state.log`: `rupture-detonated.amount`, `execute-fired.amount`,
  `compound-hit.amount`, `conclude-hit.amount`
- Track `guardAvailableOnAttack` and `playerHpTaken` in the loop (before `resolveThreatPhase`)
- Track `activeEffectSamples` array (before `resolveThreatPhase`, sample `state.enemy.effects.length`)

### Unit 2 — Update `combat-sim.cli.ts` print line

**File:** `src/CLI/combat-sim.cli.ts`

Extend the existing print per-enemy line to show new fields (abbreviated):
```
dotFrac=NN%  strikeFrac=NN%  burstFrac=NN%  guard=NN%  effects=N.N
```

### Unit 3 — Update balance sim test

**File:** `src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`

Add a new describe block:
```ts
describe('HP combat — status-engagement metrics are non-zero with a DoT loadout', () => {
    it('dotHpFraction > 0 — DoT contributes meaningfully to HP erosion', ...)
    it('avgActiveEffectsPerPhase > 0 — enemy carries active effects during combat', ...)
    it('guardMitigatedFraction is a valid fraction (0–1)', ...)
})
```

## Verify gate

`npm run verify` (type-check + lint + test + build)

## Definition of Done

- [ ] `CombatSimStats` has 5 new fields (dotHpFraction, strikeFraction, mechanicBurstFraction, guardMitigatedFraction, avgActiveEffectsPerPhase)
- [ ] `runOneEncounter` computes and returns all 5 metrics
- [ ] `simulateHazardPatternCombat` aggregates and averages them correctly
- [ ] `combat-sim.cli.ts` prints the new fields
- [ ] Balance sim test asserts non-zero dotHpFraction and avgActiveEffectsPerPhase for a DoT loadout
- [ ] `npm run verify` green
- [ ] `plan/steps/01_build_plan.md` Phase 167 row flipped to `[x]`

## Follow-ups (out of scope)

- Adding these metrics to `buildCombatSummary` / `CombatSummary` (a separate phase)
- `amplify-detonated` event tracking (Phase 168 — the DoT amplifier)
