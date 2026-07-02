# Phase 15 — Split `combat.resolver.ts` into per-phase helpers

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

`src/Combat/combat.resolver.ts` shrinks from ~1,000 LOC to a thin
orchestrator (~150–200 LOC): the `RoundEvent` discriminated union, the
`RoundResolution` interface, and the `resolveCombatRound` function which
delegates to six per-phase helpers living in `src/Combat/phases/`. Every
existing test (`src/Combat/e2e/combat.resolver.test.ts` + sibling tests)
stays green throughout. The public API (`src/index.ts`, `src/Combat/index.ts`)
is unchanged — this is an internal-only refactor.

## Source spec

No dedicated `specs/15-*.md` file — this is a structural-debt phase
tracked since critique-1 (see `plan/CRITIQUE.md` MED finding
"combat.resolver.ts is 1000 lines — phase logic is unsplit"). The file's
own header already documents the six discrete event-emission phases:
`round-start`, `action-restriction`, `advantage`, `stance-effects`,
`scenario`, `round-end`.

Resolved questions:

1. **Where do extracted phase functions live?**
   New subdir `src/Combat/phases/`, one file per phase
   (`round-start.ts`, `action-restriction.ts`, `advantage.ts`,
   `stance-effects.ts`, `scenario.ts`, `round-end.ts`). Nesting under
   `phases/` avoids a name collision with the existing
   `src/Combat/advantage.ts` (which owns `determineAdvantage` /
   `resolveEffectiveAdvantage` and stays put).
2. **Event-emission contract — push or return?**
   Push. Each phase function takes a `events: RoundEvent[]` argument and
   appends to it. Reason: the current scenario helpers
   (`resolveAttackVsAttack` etc.) already push into a shared array, and
   converting them to return event lists would balloon the diff into
   every helper signature. Push-style preserves the exact code path the
   tests already exercise.
3. **Function signature shape?**
   Each phase helper takes a small `{ state-fragment, events, ... }`
   bundle and returns the updated state slice. Specifically:
   - `runRoundStartPhase(player, enemy, events) → { player, enemy, lethal: boolean }`
   - `runActionRestrictionPhase(player, enemy, playerAction, enemyAction, events) → { playerStance, enemyStance, playerActionFinal, enemyActionFinal, playerCanAct, enemyCanAct }`
   - `runAdvantagePhase(player, enemy, playerStance, enemyStance, playerActionFinal, enemyActionFinal, events) → { playerAdvantage, enemyAdvantage }`
   - `runStanceEffectsPhase(player, enemy, playerStance, enemyStance, playerActionFinal, enemyActionFinal, playerCanAct, enemyCanAct, round, tier1Overrides, events) → { player, enemy }`
   - `runScenarioPhase(state, player, enemy, playerStance, enemyStance, playerAction, playerActionFinal, enemyActionFinal, playerAdvantage, enemyAdvantage, combatResources, friendshipCounter, round, skillLookup, events) → { player, enemy, combatResources, friendshipCounter }`
   - `runRoundEndPhase(player, enemy, events) → { player, enemy }`
4. **Where do the scenario sub-helpers live?**
   `resolveAttackVsAttack`, `resolvePlayerAttackEnemyDefend`,
   `resolvePlayerDefendEnemyAttack`, `resolveAttackHit`, `runActionProcs`,
   `equipmentTriggersFor`, `playerWonAttackContest`, `toRoundEvent` all
   move into `phases/scenario.ts` (the only file that uses them).
   `passiveDefense` and `activeDefense` move with them. None of these are
   re-exported via the public barrel today (confirmed by grep), so the
   move is internal-only.
5. **What about `SideContext`?**
   Internal helper interface — moves into `phases/scenario.ts` alongside
   `resolveAttackHit`.
6. **Stance-token generation block?**
   The "after scenario resolution, generate stance tokens" block in
   `resolveCombatRound` (the `playerBasicAttacked` / `playerBasicDefended`
   branches calling `generateBasicActionResources`) folds into
   `runScenarioPhase`. The scenario phase returns the final
   `combatResources`.
7. **Debug dump (`COMBAT_DEBUG=1`)?**
   Stays in the orchestrator. It's a single conditional read of the
   final state and not phase-specific.
8. **Event type declarations?**
   Stay in `combat.resolver.ts`. The types are re-exported from
   `src/Combat/index.ts` and `src/index.ts`, so moving them would
   ripple. Keeping them at the orchestrator clarifies that the resolver
   owns the contract; phases consume the type.

## Implementation units (commit per unit)

Each unit ends green: `npm run type-check && npm test` must pass before
committing. Run the verify gate (`npm run verify`) at the end of Unit 7.

### Unit 1 — Extract `runRoundStartPhase`

File: `src/Combat/phases/round-start.ts` (new)

```ts
import { Character } from '../../Character/types';
import { Enemy } from '../../Enemy/types';
import { processRoundStartEffects } from '../effects';
import type { RoundEvent } from '../combat.resolver';

export interface RoundStartResult {
    player: Character;
    enemy: Enemy;
    /** True when start-phase ticks dropped either combatant to 0 HP; the
     *  caller should short-circuit the rest of the round. */
    lethal: boolean;
}

export function runRoundStartPhase(
    player: Character, enemy: Enemy, events: RoundEvent[],
): RoundStartResult { /* lift lines 660–679 from combat.resolver.ts */ }
```

Resolver: replace lines ~659–679 with a single call to
`runRoundStartPhase`. Keep the early-exit branch in the orchestrator
(it still composes the `RoundResolution`).

Commit: `refactor(combat): extract runRoundStartPhase into phases/round-start.ts`

### Unit 2 — Extract `runActionRestrictionPhase`

File: `src/Combat/phases/action-restriction.ts` (new)

Signature:
```ts
export interface ActionRestrictionResult {
    playerStance: Stance;
    enemyStance: Stance;
    playerActionFinal: Action | 'skip';
    enemyActionFinal:  Action | 'skip';
    playerCanAct: boolean;
    enemyCanAct: boolean;
}

export function runActionRestrictionPhase(
    player, enemy, playerAction, enemyAction, events,
): ActionRestrictionResult { /* lift lines 681–712 */ }
```

Resolver: replace lines ~681–712 with the call; destructure the result
into the variables the rest of the round uses.

Commit: `refactor(combat): extract runActionRestrictionPhase`

### Unit 3 — Extract `runAdvantagePhase`

File: `src/Combat/phases/advantage.ts` (new)

```ts
export interface AdvantagePhaseResult {
    playerAdvantage: Advantage;
    enemyAdvantage:  Advantage;
}

export function runAdvantagePhase(
    player, enemy, playerStance, enemyStance,
    playerActionFinal, enemyActionFinal, events,
): AdvantagePhaseResult { /* lift lines 714–731 */ }
```

Note: imports from sibling `../advantage.ts` (`determineAdvantage`,
`resolveEffectiveAdvantage`). The two `events.push({ phase: 'advantage', ... })`
calls move into this function.

Commit: `refactor(combat): extract runAdvantagePhase`

### Unit 4 — Extract `runStanceEffectsPhase`

File: `src/Combat/phases/stance-effects.ts` (new)

```ts
export interface StanceEffectsResult { player: Character; enemy: Enemy; }

export function runStanceEffectsPhase(
    player, enemy,
    playerStance, enemyStance,
    playerActionFinal, enemyActionFinal,
    playerCanAct, enemyCanAct,
    round, tier1Overrides,
    events,
): StanceEffectsResult { /* lift lines 733–780 */ }
```

Resolver: replace the clear-Tier-1 + apply-Tier-1 block with this call.

Commit: `refactor(combat): extract runStanceEffectsPhase`

### Unit 5 — Extract `runScenarioPhase` (the big one)

File: `src/Combat/phases/scenario.ts` (new)

Move into this file:
- `passiveDefense` and `activeDefense` helpers (currently lines 248–261).
- `SideContext` interface (line 267).
- `resolveAttackVsAttack`, `resolvePlayerAttackEnemyDefend`,
  `resolvePlayerDefendEnemyAttack`, `resolveAttackHit` (lines 283–532).
- `RunProcsParams`, `equipmentTriggersFor`, `runActionProcs` (lines 534–622).
- `playerWonAttackContest` (lines 972–980).
- `toRoundEvent` (lines 983–1011).
- The big `resolveCombatRound` block from `// 5. Scenario resolution.`
  through the stance-token generation (lines 782–933).

Public export from `phases/scenario.ts`:
```ts
export interface ScenarioPhaseResult {
    player: Character;
    enemy: Enemy;
    combatResources: CombatResources;
    friendshipCounter: number;
}

export function runScenarioPhase(
    state: CombatState,
    player: Character, enemy: Enemy,
    playerStance: Stance, enemyStance: Stance,
    playerAction: CombatAction,
    playerActionFinal: Action | 'skip',
    enemyActionFinal:  Action | 'skip',
    playerAdvantage: Advantage, enemyAdvantage: Advantage,
    combatResources: CombatResources,
    friendshipCounter: number,
    round: number,
    skillLookup: SkillLookup | undefined,
    events: RoundEvent[],
): ScenarioPhaseResult { ... }
```

The `state.enemy.tier1Overrides` reference in the current code is read
only inside the stance-effects phase; this phase does not need it.

Drop `export` from helpers that are now private to `phases/scenario.ts`
(`resolveAttackVsAttack`, `resolvePlayerAttackEnemyDefend`,
`resolvePlayerDefendEnemyAttack`). Confirmed not re-exported through
`src/Combat/index.ts` or `src/index.ts`.

Commit: `refactor(combat): extract runScenarioPhase (skill/item/attack/defend)`

### Unit 6 — Extract `runRoundEndPhase`

File: `src/Combat/phases/round-end.ts` (new)

```ts
export interface RoundEndResult { player: Character; enemy: Enemy; }

export function runRoundEndPhase(
    player: Character, enemy: Enemy, events: RoundEvent[],
): RoundEndResult { /* lift lines 935–944 */ }
```

Commit: `refactor(combat): extract runRoundEndPhase`

### Unit 7 — Tighten the orchestrator + verify gate

After Units 1–6, `resolveCombatRound` is a top-to-bottom call sequence:
1. `runRoundStartPhase` (early-exit on lethal).
2. `runActionRestrictionPhase`.
3. `runAdvantagePhase`.
4. `runStanceEffectsPhase`.
5. `runScenarioPhase`.
6. `runRoundEndPhase`.
7. Compose the `newCombat` state. Run debug dump. Return.

Strip the now-orphaned imports that the phases own
(`processRoundStartEffects`, `processRoundEndEffects`,
`clearTier1EffectsForStance`, `applyTier1CombatEffect`,
`determineAdvantage`, `resolveEffectiveAdvantage`, `canAct`,
`createDieRoll`, `getActiveRollModifier`, `getAttackStat`, `getBaseStat`,
`getDefenseStat`, `getEffectiveStats`, `calculateFinalDamage`,
`applyDamage`, `lookupEffect`, `getStudyMarkIntensity`,
`getThornsReflect`, `removeRandomBuff`, `extendRandomBuffDuration`,
`rollForCombatEffects`, `applyProcOutcome`, `applyFumbleOutcome`,
`getEquipmentProcTriggers`, `useConsumableEffect`, `useInventoryConsumable`,
`lookupEffectById`, `isConsumable`, the `Consumable` type,
`canUseSkill`, `executeSkill`, `generateBasicActionResources`,
`BasicActionOutcome`, `SkillEvent`, `SkillLookup`, `CombatResources`,
`ResourceCost`, `SkillCategory`, `DEFENSE_MULTIPLIERS`,
`PASSIVE_DEFENSE_MULTIPLIER`, etc.) The remaining imports should be
limited to types (`Character`, `Enemy`, `ActiveEffect`, `Effect`,
`EffectApplicationResult`, `EffectTier`, `CombatAction`, `CombatState`,
`Stance`, `Action`, `Advantage`) plus the six phase helpers plus
`getRng` and `dumpEffectState` for the debug dump and `SkillLookup` for
the function signature.

Run `npm run verify`. Expected: all green. If any test fails, the diff
in that unit has a behavioural bug — find and fix before continuing.

Update the top-of-file comment to point at `phases/` for the per-phase
implementations.

Commit: `refactor(combat): phase 15 — orchestrator is now a thin composition`

### Unit 8 — DoD

Tick Phase 15 in `plan/steps/01_build_plan.md` with the final orchestrator
commit hash. Add a one-line entry under `plan/CRITIQUE.md` Done.

Commit: `plan: phase 15 shipped — combat.resolver split into 6 phase helpers`

## Decisions made upfront — DO NOT ASK

- **No public-API change.** `src/index.ts` and `src/Combat/index.ts`
  exports do not move. `resolveCombatRound` keeps its signature. The
  `RoundEvent` types stay declared in `combat.resolver.ts` so re-exports
  through both barrels keep working unchanged.
- **No test rewrites.** The existing `src/Combat/e2e/combat.resolver.test.ts`
  is the contract. If the refactor breaks a test, the refactor is wrong;
  fix the refactor.
- **No new tests in this phase.** Per-phase unit tests would be nice but
  are out of scope — the existing e2e suite covers the orchestrator path
  end-to-end. File per-phase tests as a follow-up if the refactor reveals
  a coverage gap (Unit 5 is the most likely place).
- **Push-style events, not return-style.** See §Source spec Q2.
- **`phases/` subdir, not flat `src/Combat/`.** See §Source spec Q1.
- **Internal helpers lose their `export` keyword** when they move into
  `phases/scenario.ts` and have no external callers (`resolveAttackVsAttack`,
  `resolvePlayerAttackEnemyDefend`, `resolvePlayerDefendEnemyAttack`).
  Confirmed unused outside `combat.resolver.ts` by grep.
- **Debug dump (`COMBAT_DEBUG=1`) stays in the orchestrator.**

## Verify gate

```bash
npm run type-check      # must exit 0 after every unit
npm test                # must exit 0 after every unit
npm run verify          # must exit 0 at the end of Unit 7
npm run deploy:check    # must exit 0 at the end of Unit 8
```

## Commit body template (summary commit if units coalesce)

```
refactor(combat): phase 15 — split combat.resolver into per-phase helpers

- Move round-start / action-restriction / advantage / stance-effects /
  scenario / round-end logic from combat.resolver.ts into
  src/Combat/phases/<phase>.ts
- combat.resolver.ts shrinks from ~1,000 LOC to a thin orchestrator
  that owns the RoundEvent types and the resolveCombatRound entry point
- Public API unchanged; existing e2e suite stays green

Decisions:
- Push-style event emission preserves existing helper signatures and
  keeps the diff bounded; return-style would have rippled into every
  attack/proc helper.

Closes #<phase-issue-number if captured>
```

## Definition of Done

- [ ] `src/Combat/phases/round-start.ts` exists with `runRoundStartPhase`
- [ ] `src/Combat/phases/action-restriction.ts` exists with `runActionRestrictionPhase`
- [ ] `src/Combat/phases/advantage.ts` exists with `runAdvantagePhase`
- [ ] `src/Combat/phases/stance-effects.ts` exists with `runStanceEffectsPhase`
- [ ] `src/Combat/phases/scenario.ts` exists with `runScenarioPhase` plus all the formerly-internal attack/proc helpers
- [ ] `src/Combat/phases/round-end.ts` exists with `runRoundEndPhase`
- [ ] `src/Combat/combat.resolver.ts` is ≤300 LOC; `resolveCombatRound` is a 30–60-line orchestrator
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] `plan/steps/01_build_plan.md` Phase 15 row flipped to `[x]` with commit hash
- [ ] The CRITIQUE-1 MED finding "combat.resolver.ts is 1000 lines" is closed under the Done section

## Follow-ups (out of scope)

- Per-phase unit tests (each `phases/<phase>.test.ts`) — file as a Z-LOW
  candidate in `plan/PHASE_CANDIDATES.md` if Unit 5 reveals coverage gaps.
- Return-style refactor (each phase returns `{ state, events }` instead
  of mutating a shared array) — strictly larger project; tracked under
  Follow-ups for a possible Phase 26.
- Splitting `phases/scenario.ts` further (skill, item, attack-vs-attack
  sub-files) — wait until after this lands; the scenario file will still
  be the largest of the six but cleanly bounded.
