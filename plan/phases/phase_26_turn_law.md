# Phase 26 — The Turn Law (engine + tooling)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

Make "one dice-turn per threat phase" an **engine invariant**, not a
UI-only convention. Today `startTurn` re-rolls a fresh dice tray any
time the draft slot is empty and `state.phase === 'phase-play'` —
nothing stops it from being called a second (or sixtieth) time within
the same phase. The mobile UI and interactive CLI happen to only call
it once per phase; sim policies and the auto CLI farm
`endTurn -> startTurn` loops (up to 60x / phase in the sim, up to
`maxTurns * 6` in the auto CLI) before ever calling
`resolveThreatPhase` — earning Conviction off unpicked dice each
farmed cycle. This phase closes that gap plus three tooling gaps that
made the farming hard to see and hard to measure honestly. Source:
`plan/tuning/2026-07-10-turn-law-and-honest-baseline.md` §1-2.
**Engine + tooling only** — the re-baseline measurement pass is
Phase 27, gated on this phase.

## Current state (verified in code)

- `startTurn` (`combat.engine.ts:411-459`) early-outs on
  `phase !== 'phase-play'` (line 415) and `draftedDieId !== null`
  (line 416) but has **no** guard against "already took a turn this
  phase" — nothing on `CombatEncounterState` tracks that.
- `resolveThreatPhase` (`combat.engine.ts:2208-2481`) sets
  `phase: 'phase-resolve'` in its own return (line 2468) — `startTurn`
  is already blocked here by the existing phase check, so no new
  reset is needed at that point.
- `processBetweenPhases` (`combat.engine.ts:2495-2827`) is the actual
  phase-open: its `next` object (lines 2797-2815) sets
  `phase: 'phase-play'`, `dice: []`, `draftedDieId: null` — the
  correct place to reset the new flag for the fresh phase.
- The farm lives in two near-identical loops:
  - Sim: `policyPlayPhase` (`combat.encounter.sim.ts:200-321`), inner
    `while (working.phase === 'phase-play' && guard < 60)` — the
    `endTurn`/`startTurn` cycle at lines 248-252 can repeat because
    `working.phase` never leaves `'phase-play'` between cycles.
  - Auto CLI: `autoPlayPhase` (`combat.cli.ts:263-329`), same shape,
    `endTurn`/`startTurn` at lines 286-289, `safety < phaseTurnLimit * 6`.
- **Floating dice and Reserve dice are a separate, legitimate power
  source** (`combat.engine.ts:1103-1129`, `playCombatCard`'s
  `poweringSource: 'drafted' | 'reserve' | 'floating' | 'fate-x'`) that
  let ONE drafted turn chain multiple card plays. The law caps TRAY
  ROLLS (`startTurn` calls) per phase, not card plays — this must
  stay legal (protected today by
  `floating-die-persistence.engine.test.ts`).
- Attribution overkill gap: `recordAttribution`
  (`combat.attribution.ts:21-42`) projects DoT damage
  (`damagePerRound × intensity × remainingDuration`) with no ceiling —
  a long DoT chain can log e.g. 740 projected damage against a
  40-max-HP enemy. Direct/mechanic-burst call sites
  (`combat.engine.ts:1526,1542,1587,1901,1914,1926`) pass the raw
  computed amount, not the HP delta `applyDamage` actually clamped to
  0.
- `--stage` CLI gap: `parseCombatArgv` (`combat.cli.ts:162-172`)
  defaults `enemySlug: 'little-belle'` unconditionally; `runCombatCli`
  (`combat.cli.ts:626`) resolves the enemy purely from
  `ENEMY_REGISTRY[flags.enemySlug]` and never consults
  `getStageProfile(flags.stage).enemySlugs`
  (`combat.stage-profiles.ts:59`) even when `--stage` was passed. The
  batch matrix harness (`combat-playtest.cli.ts:104,126`) already
  loops the stage's full `enemySlugs` roster correctly — only the
  single-encounter `combat.cli.ts` path has this gap.
- Auto-mode transcript gap: `autoHazardCombatLoop`
  (`combat.cli.ts:487-517`) only ever `emit()`s `hazardCombat:start`
  (line 493, called once) and `hazardCombat:end` (line 590, called
  once) to the `--json-events` stream; no per-phase event. Interactive
  mode already emits `hazardCombat:card` (line 449) and
  `hazardCombat:resolvedPhase` (line 480) per phase — auto mode has no
  equivalent, so a `--json-events --auto` transcript is silent between
  start and end.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.encounter.types.ts
  CombatEncounterState.turnTakenThisPhase?: boolean   — new field
  CombatEvent: + { kind: 'turn-law-blocked'; phaseIndex: number }

axiomancer-mechanics/src/Combat/combat.engine.ts
  startTurn(): new guard (after the existing two early-outs) refuses
    a second tray this phase; sets turnTakenThisPhase: true on success
  processBetweenPhases(): resets turnTakenThisPhase: false in the
    phase-open `next` object (alongside the existing draftedDieId reset)
  recordAttribution() call sites (7): pass the actual pre-damage HP
    ceiling so the ledger can't log overkill

axiomancer-mechanics/src/Combat/combat.attribution.ts
  recordAttribution(): new enemyHealthRemaining param clamps both the
    projected-DoT forecast and the direct/mechanic damage entry

axiomancer-mechanics/src/Combat/combat.encounter.sim.ts
  policyPlayPhase(): the endTurn/startTurn refresh block breaks out
    (ending the phase) instead of attempting a second startTurn once
    turnTakenThisPhase is already true

axiomancer-mechanics/src/CLI/combat.cli.ts
  autoPlayPhase(): same fix as policyPlayPhase
  autoHazardCombatLoop(): emits a per-phase `hazardCombat:autoPhase`
    JSON event (mirrors the interactive `hazardCombat:resolvedPhase`)
    so --json-events --auto produces a turn-by-turn transcript
  parseCombatArgv() / CombatCliFlags: + enemyExplicit: boolean (true
    only when --enemy was actually passed)
  runCombatCli(): when --stage is given and --enemy was not explicit,
    default the enemy to the FIRST slug in that stage's enemySlugs
    roster instead of the hardcoded 'little-belle'

axiomancer-mechanics/src/Combat/e2e/turn-law.engine.test.ts          — new
axiomancer-mechanics/src/Combat/combat.attribution.test.ts           — new (or
  colocated near existing attribution coverage if a file already exists)
```

## Output schema (locked)

```ts
// combat.encounter.types.ts — CombatEncounterState, additive field
export interface CombatEncounterState {
    // ...existing fields unchanged...
    /** The Turn Law (phase 26) — true once `startTurn` has produced a
     *  dice tray for the CURRENT threat phase; blocks a second
     *  `startTurn` call until `processBetweenPhases` opens the next
     *  phase and clears it. Does NOT gate card plays — floating dice
     *  and Reserve dice remain a separate, legal power source within
     *  the one drafted turn. Optional for back-compat with state
     *  literals (absent = false = pre-law behavior). */
    turnTakenThisPhase?: boolean;
}

// CombatEvent — new variant, inserted before the terminal `combat-ended`
| { kind: 'turn-law-blocked'; phaseIndex: number }
```

`startTurn` guard (inserted immediately after the existing
`draftedDieId !== null` early-out, before dice are rolled):

```ts
if (state.turnTakenThisPhase) {
    const events: CombatEvent[] = [{ kind: 'turn-law-blocked', phaseIndex: state.currentPhaseIndex }];
    return { state: withLog(state, events), events };
}
```

`startTurn`'s success path sets the flag in its returned `next`:

```ts
const next: CombatEncounterState = {
    ...state, player, dice, draftedDieId: null, turn, lastRead: 'none', carriedDie,
    spellsPlayedThisTurn: 0, echoNextSpell: false,
    turnTakenThisPhase: true,
};
```

`processBetweenPhases`'s phase-open `next` (the block that already
resets `dice: []` / `draftedDieId: null`) adds:

```ts
turnTakenThisPhase: false,
```

`recordAttribution` (clamps both the DoT forecast and the direct hit
to what the enemy actually had left):

```ts
export function recordAttribution(
    attribution: Record<string, CombatAttributionRow>,
    cardId: string,
    cardName: string,
    landed: LandedEffect | null,
    damage: number,
    enemyHealthRemaining: number,
): Record<string, CombatAttributionRow> {
    const prev = attribution[cardId] ?? { cardId, name: cardName, dotDamage: 0, damageDealt: 0, phases: 0 };
    const dot = landed?.effect.payload.damageOverTime;
    const rawProjected = dot
        ? dot.damagePerRound * Math.max(1, landed!.active.intensity) * Math.max(1, landed!.active.remainingDuration)
        : 0;
    const ceiling = Math.max(0, enemyHealthRemaining);
    const projected = Math.min(rawProjected, ceiling);
    const clampedDamage = Math.min(Math.max(0, damage), ceiling);
    return {
        ...attribution,
        [cardId]: {
            ...prev,
            dotDamage: prev.dotDamage + projected,
            damageDealt: prev.damageDealt + clampedDamage,
            phases: prev.phases + 1,
        },
    };
}
```

Every call site passes the enemy's HP **immediately before** this
damage instance (capture `const beforeHp = enemy.health;` right before
the `applyDamage` call it corresponds to; the DoT-landed call site at
line 1818 passes `enemy.health` directly since no damage has been
applied yet at that point). `mechanicDamage`/`directDamage` counters
are untouched (out of scope — only the post-combat attribution ledger
is clamped).

`policyPlayPhase` / `autoPlayPhase` refresh-block fix (identical shape
in both files):

```ts
if (working.draftedDieId !== null) working = endTurn(working).state;
if (working.dice.length === 0) {
    if (working.turnTakenThisPhase) break; // Turn Law: no second tray this phase
    working = startTurn(working).state;
    if (working.phase !== 'phase-play') break;
}
```

`autoHazardCombatLoop` per-phase transcript event (added right after
the existing `logState('hazardCombat:autoPhase', ...)` call):

```ts
emit({ type: 'hazardCombat:autoPhase', payload: { phaseCount, events: [] } });
```

(No new event payload plumbing needed beyond marking the phase
boundary — `logState` already captures the full state diff for
`--state-log`; the JSON stream just needs the boundary marker so an
auditor doesn't have to write a bespoke harness to see turn-by-turn
progress, per the audit's own complaint.)

`--stage` enemy default (`runCombatCli`, right before the
`ENEMY_REGISTRY` lookup):

```ts
let enemySlug = flags.enemySlug;
if (!flags.enemyExplicit && flags.stage) {
    const stageProfile = getStageProfile(flags.stage);
    if (stageProfile && stageProfile.enemySlugs.length > 0) {
        enemySlug = stageProfile.enemySlugs[0];
    }
}
const enemyDef = ENEMY_REGISTRY[enemySlug as EnemySlug];
```

`CombatCliFlags` gains `enemyExplicit: boolean` (mirrors
`presetExplicit`); `parseCombatArgv`'s `--enemy` branch sets it `true`.

## Tests

### Unit / e2e (mechanics), `turn-law.engine.test.ts`

- `startTurn` called twice in a row on a fresh `phase-play` state (no
  intervening `endTurn`/`processBetweenPhases`) — the second call is a
  no-op: identical `dice`, `turn`, `draftedDieId` to the first call's
  result, and its `events` is exactly
  `[{ kind: 'turn-law-blocked', phaseIndex: ... }]`.
- After `processBetweenPhases` advances to a new phase, `startTurn`
  succeeds again (flag correctly reset) — a full
  `startTurn -> endTurn -> resolveThreatPhase -> processBetweenPhases
  -> startTurn` cycle rolls a fresh tray the second time.
- `runOneEncounter` (sim) and `autoHazardCombatLoop`-equivalent CLI
  path each produce exactly one `turn-dice-rolled` event per resolved
  phase, never more — pins the farm shut end-to-end (use
  `floating-die-persistence.engine.test.ts`'s
  `initializeCombatEncounter` + `rollEncounterDice` + fixture pattern).
- Floating-die / Reserve regression: re-run (or import-assert against)
  `floating-die-persistence.engine.test.ts` unchanged — floats/Reserve
  still power multiple card plays within the one drafted turn; the
  Turn Law must not touch `playCombatCard`'s powering-source logic.

### Unit, attribution clamp (new or colocated file)

- A DoT with `damagePerRound=100, intensity=3, remainingDuration=5`
  (raw projection 1500) landed on a 40-max-HP enemy records
  `dotDamage === 40`, not 1500.
- A direct/mechanic burst (e.g. rupture) computed as 90 against an
  enemy with 25 HP remaining records `damageDealt` contribution of 25,
  not 90.
- An unclamped case (enemy HP comfortably above the hit) is
  byte-identical to today's numbers — the clamp only ever lowers the
  ledger, never changes it when there's no overkill.

### Unit, `--stage` enemy default

- `parseCombatArgv(['--stage', 'early'])` → `enemyExplicit === false`,
  `stage === 'early'`.
- Running the CLI (or the equivalent unit around `runCombatCli`'s enemy
  resolution helper) with `--stage early` and no `--enemy` resolves to
  `COMBAT_STAGE_PROFILES.early.enemySlugs[0]` (`'grave-larva'`), not
  `'little-belle'`.
- `--stage early --enemy little-belle` still resolves to
  `little-belle` (explicit `--enemy` wins).

Reuse `floating-die-persistence.engine.test.ts`'s fixture helpers
(`makePlayer`, `makeEnemy`, `initializeCombatEncounter` +
`rollEncounterDice`) and `status-depth-combat.engine.test.ts`'s
direct-state-override pattern (`processBetweenPhases({ ...base,
currentPhaseIndex, round })`) for phase-boundary tests — no need to
play full hands to reach the invariant.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + type-check:cli + lint + vitest +
build. `CombatEncounterState`/`CombatEvent` are exported through the
`@mechanics` barrel — additive fields only, so a quick sanity check on
consumers:

```bash
npm run type-check --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

## Deploy gate

```bash
npm run deploy:check
```

CI-green. Touches `axiomancer-mechanics/**` only → `verify-mechanics.yml`
(+ path-filtered mobile/card-editor gates).

## Decisions made upfront — DO NOT ASK

- **Gate on `startTurn` re-entry, not on card plays or die spends.**
  Floating dice and Reserve dice are a deliberate second/third power
  source for a single drafted turn (the "bigger turns" design intent,
  `combat.encounter.types.ts` doc comments) — protected by
  `floating-die-persistence.engine.test.ts`. The Turn Law only caps
  fresh dice-tray rolls per phase.
- **Reset point is `processBetweenPhases`, not `resolveThreatPhase`.**
  `resolveThreatPhase` transitions to `phase-resolve`, which
  `startTurn`'s existing phase check already blocks — no double
  bookkeeping needed. The flag only needs to flip back to `false`
  where the engine actually re-opens `phase-play`.
- **Sim/auto-CLI fix is a `break`, not a full rewrite of the play-out
  loop.** The turn-law-and-honest-baseline doc calls for policies that
  "draft once, play out the hand legally, END" — the existing loop
  already does exactly that once the farm's second `startTurn` is
  refused; the minimal, correct fix is recognizing the blocked state
  and ending the phase's play-out instead of looping uselessly (bound
  by the pre-existing guard counters either way, but the explicit
  check keeps intent legible and avoids emitting spurious
  `turn-law-blocked` events into the log every guard tick).
- **Attribution clamp uses a single-point HP ceiling
  (`enemyHealthRemaining` at the moment of the hit/land), not a
  running multi-tick simulation.** Exactly reproducing "what this DoT
  will really tick for over its full duration accounting for other
  simultaneous effects" would require re-deriving the whole
  round-by-round tick schedule inside the attribution module — a much
  bigger change than the audit asked for ("clamp attribution at damage
  actually applied"). The single ceiling clamp fixes the concrete
  740-vs-40-HP failure mode and can never make the ledger read
  *higher* than reality; it may occasionally under-count a DoT that
  gets renewed/extended after landing (a rarer, much less misleading
  direction of error) — acceptable given Phase 27 re-derives every
  ledger number from scratch anyway.
- **`mechanicDamage`/`directDamage` engine counters are NOT clamped.**
  Only the post-combat attribution ledger (`combat.attribution.ts`) is
  in scope. Those counters feed live engine math (Wall thresholds,
  summary `directDamage` display) that already reads off
  `enemy.health` deltas correctly via `applyDamage`'s own clamp —
  touching them risks an unrelated behavior change outside this
  phase's scope.
- **`--stage` defaults to the roster's FIRST enemy slug, deterministic
  and unseeded-independent**, rather than a seed-derived random pick.
  This is a single-encounter demo CLI (`npm run combat -- --stage X`),
  not the batch matrix (`combat-playtest.cli.ts` already loops every
  slug correctly) — a stable, predictable default is more useful for
  manual spot-checks and bug repro than a seeded roll would be.
  `--enemy` still overrides it explicitly.
- **Auto-mode transcript event is a boundary marker, not a full replay
  log.** `--state-log` already captures the complete per-call state
  diff (`logState('hazardCombat:autoPhase', ...)`, unchanged this
  phase); the new `emit()` call only fixes the specific complaint that
  `--json-events --auto` alone (without `--state-log`) shows nothing
  between start and end. Building a full per-card auto-mode JSON event
  stream (matching interactive mode's `hazardCombat:card` granularity)
  is a larger scope than "the auditor shouldn't need a bespoke
  harness" requires and is left as a follow-up if a future audit needs
  finer granularity.

## Git

```bash
git add axiomancer-mechanics/src/Combat/combat.encounter.types.ts \
        axiomancer-mechanics/src/Combat/combat.engine.ts \
        axiomancer-mechanics/src/Combat/combat.attribution.ts \
        axiomancer-mechanics/src/Combat/combat.encounter.sim.ts \
        axiomancer-mechanics/src/CLI/combat.cli.ts \
        axiomancer-mechanics/src/Combat/e2e/turn-law.engine.test.ts
git commit -m "$(cat <<'EOF'
feat(mechanics): enforce the one-turn-per-phase law — phase 26

- startTurn refuses a second dice tray within the same threat phase
  (new turnTakenThisPhase flag + turn-law-blocked event); reset when
  processBetweenPhases opens the next phase
- sim policies and the auto CLI stop farming endTurn/startTurn cycles
  for extra Conviction — they now end a phase's play-out as soon as
  the law blocks a second tray, instead of looping up to 60x/phase
- recordAttribution clamps both the projected-DoT forecast and direct
  mechanic bursts to the enemy's actual remaining HP at the moment of
  the hit, so a long DoT chain can no longer log more damage than a
  40-HP enemy could ever take
- npm run combat -- --stage X now defaults the enemy to that stage's
  roster (first slug) instead of always little-belle, when --enemy
  isn't given explicitly
- --json-events --auto now emits a per-phase hazardCombat:autoPhase
  boundary event, matching interactive mode's per-phase transcript

Decisions:
- gate keys off startTurn re-entry only — floating/Reserve dice stay
  a legal second power source for one drafted turn (multi-float turns
  are load-bearing, protected by floating-die-persistence tests)
- attribution clamp is a single-point HP-ceiling clamp, not a full
  tick-schedule re-simulation — fixes the concrete overkill failure,
  full historical re-derivation is Phase 27's job
- --stage enemy default picks the roster's first slug deterministically
  (this is the single-encounter demo CLI; the batch matrix harness
  already iterates every slug correctly)
EOF
)"
git push origin main
```

## DoD

Flip Phase 26 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 26 shipped — the Turn Law (engine + tooling)"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- **Phase 27 — Re-baseline.** Full matrix re-run under the Turn Law;
  every plan/tuning number dated before 2026-07-10 gets an asterisk
  until this lands. Gated on this phase.
- A full per-card auto-mode JSON event stream matching interactive
  mode's `hazardCombat:card` granularity (this phase ships only the
  per-phase boundary marker).
- Re-deriving attribution's DoT projection against a true round-by-round
  tick schedule (accounting for simultaneous effects, renewals, and
  extensions) instead of the single-point HP-ceiling clamp — only
  worth doing if Phase 27's re-baseline finds the ledger numbers still
  meaningfully misleading after this clamp.
