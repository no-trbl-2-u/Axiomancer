# Phase 3 — Enemy combat-phase progression / "rage mode" (engine depth)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

Give long fights a **qualitative** escalation beyond the existing numeric
"THE CLOCK" damage ramp (`THREAT_ESCALATION_*`, `combat.engine.ts`): a new,
lockable threat phase — `unlockAfterRound` — that a fight only reaches once
it survives past a round threshold. Every enemy that uses the **generated**
(unauthored) threat sequence (`generateDefaultThreatSequence`) gets one
appended "rage" phase: harder-hitting, self-healing, locked until round 6.
Authored (hand-tuned) sequences are untouched this phase — see Follow-ups.
**Engine only.**

## Design note — Spec 29 vs current engine reality

`axiomancer-mechanics/specs/29-reactive-enemies-telegraphed-intent.md` is a
draft handoff spec proposing Cleanse/Harden/**Enrage**/Adapt-stance enemy
reactions keyed off `CombatThreatPhase.dotPressureRequired` /
`controlPressureRequired` — the two-Pressure-Track win model that was
**removed 2026-06-22** (`bearings.md` — HP is the sole win condition now).
Its "Enrage" concept (§ Open Q1: "a between-phase escalation when a track
crosses X% of threshold") is the closest prior art to this phase's "rage
mode," reinterpreted against the current HP-sole-win engine: there is no
track to cross a percentage of, so the trigger becomes **round survived**
(the build-plan row's own `unlockAfterRound` naming) rather than a track
threshold. Spec 29's Cleanse/Harden/Adapt-stance abilities and its
authored-vs-default reaction-trigger question (§4 Q3, Q6) are **out of
scope** here — this phase ships only the escalation-phase primitive the
build-plan row names, not the full reactive-enemy spec. Spec 29 stays open
for a future phase; do not mark it implemented.

## Current state (verified in code)

- `CombatThreatPhase` (`combat.encounter.types.ts:234`) already models a
  sequence of authored/generated attacks; `currentPhaseIndex` advances by
  exactly one per round in `processBetweenPhases`
  (`combat.engine.ts:1573`), capped at `threatPhases.length - 1` — the fight
  loops its final phase forever once reached. `isFinalPhase` is a
  display-only flag (mobile presenter `intentVM`, `combat-encounter.engine.ts:254`);
  the engine itself never reads it — phase advancement is driven purely by
  array length.
- "THE CLOCK" (`combat.engine.ts:1374-1390`, `THREAT_ESCALATION_PER_ROUND`
  etc.) already multiplies incoming threat damage the longer a fight runs,
  capping at `THREAT_ESCALATION_MAX` (2.0x) a few rounds past
  `THREAT_ESCALATION_GRACE`. This phase adds a second, **discrete** escalation
  layered on top — not a replacement.
- `generateDefaultThreatSequence` (`combat.threat.ts:182`) builds 3 phases
  rotating heart→body→mind, `isFinalPhase` true only on the last. Covers
  every enemy without an entry in `AUTHORED_THREAT_SEQUENCES`
  (`combat.threat-sequences.ts`) — the majority of the ~124-enemy roster; the
  51 authored entries there are hand-tuned per-boss/per-tier (some,
  e.g. `enemy-the-incompleteness`, calibrated to a specific playtest win-rate
  target) and are NOT touched by this phase.
- `AuthoredThreatPhase` (`combat.threat.ts:30`) is the authoring template;
  `resolveAuthored` (`combat.threat.ts:166`) and `generateDefaultThreatSequence`
  both produce `CombatThreatPhase[]`. `buildThreatAction` (`combat.threat.ts:138`)
  already supports an `enemyHeal` rider ("a regenerating phase" per its own
  doc comment) — the rage phase reuses this, no new effect primitive needed.
- `getThreatSequence` (`combat.threat.ts:201`) spreads `...p` for the
  `enemy.threatSequence` explicit-override path, so any new optional field on
  `CombatThreatPhase` threads through automatically — no change needed there.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.encounter.types.ts
  CombatThreatPhase + unlockAfterRound?: number       — new optional field

axiomancer-mechanics/src/Combat/combat.threat.ts
  AuthoredThreatPhase + unlockAfterRound?: number     — new optional field
  resolveAuthored(): thread p.unlockAfterRound through (undefined by default
    — every existing authored sequence is byte-identical)
  generateDefaultThreatSequence(): appends a 4th "rage" phase, locked until
    RAGE_UNLOCK_ROUND; the 3 base phases lose isFinalPhase (the rage phase
    is now the true final)
  + RAGE_UNLOCK_ROUND, RAGE_DAMAGE_WEIGHT, RAGE_HEAL_FRACTION constants

axiomancer-mechanics/src/Combat/combat.engine.ts
  processBetweenPhases(): phase-pointer advance gated on the candidate
    phase's unlockAfterRound vs. the about-to-resolve round; holds at the
    current phase (repeats it) instead of advancing into a still-locked one

axiomancer-mechanics/src/Combat/e2e/rage-phase.engine.test.ts  — new
```

## Output schema (locked)

```ts
// combat.encounter.types.ts — CombatThreatPhase, additive field
export interface CombatThreatPhase {
    // ...existing fields unchanged...
    /** Phase 3 — "rage mode": this phase cannot be entered until the
     *  ABOUT-TO-RESOLVE round (state.round + 1 at phase-advance time) is
     *  >= this value. While locked, `processBetweenPhases` holds the phase
     *  pointer at the last reachable phase (repeating it) instead of
     *  advancing into this one. Undefined = never locked (every phase
     *  authored before this epic behaves exactly as before). */
    unlockAfterRound?: number;
}

// combat.threat.ts — AuthoredThreatPhase, mirrors the above for the
// authoring template (resolveAuthored copies it straight through)
export interface AuthoredThreatPhase {
    // ...existing fields unchanged...
    unlockAfterRound?: number;
}

export const RAGE_UNLOCK_ROUND = 6;    // generated-sequence rage phase unlocks here
export const RAGE_DAMAGE_WEIGHT = 1.6; // vs. the generator's default weight of 1
export const RAGE_HEAL_FRACTION = 0.5; // enemyHeal = round(rageDamage * this)
```

`processBetweenPhases` phase-advance (replaces the current one-line
`Math.min`):

```ts
const resolvedRound = state.round + 1;
const candidateIndex = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
const candidatePhase = state.threatPhases[candidateIndex];
const gated = candidatePhase.unlockAfterRound !== undefined && resolvedRound < candidatePhase.unlockAfterRound;
const nextIndex = gated ? state.currentPhaseIndex : candidateIndex;
```

`generateDefaultThreatSequence` (rage phase appended after the existing 3):

```ts
const rageStance = rotateStance(base, PHASES);
const rageDamage = threatDamageBudget(enemy.level, difficultyMult(enemy), PHASES, RAGE_DAMAGE_WEIGHT);
const rageHeal = Math.round(rageDamage * RAGE_HEAL_FRACTION);
// pushed after the 3 base phases (which now get isFinalPhase: false):
withIntent({
    index: PHASES + 1,
    enemyStance: rageStance,
    threatAction: buildThreatAction(`${enemy.name} loses patience and turns savage`, rageDamage, undefined, undefined, rageHeal),
    isFinalPhase: true,
    unlockAfterRound: RAGE_UNLOCK_ROUND,
    stanceHint: enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[rageStance],
});
```

No new `CombatEvent` kind — the rage phase fires through the existing
`threat-fired` / `phase-resolved` events like any other phase; its
`enemyHeal` rider already emits nothing extra (self-heal is silent HP
change today, same as every other `enemyHeal`-bearing phase). No mobile
change: `intentVM`'s existing `next` preview (keyed off array contents, not
a lock flag) will show the rage phase's `combo` intent as soon as the
pointer holds at phase 3 — an early, honest telegraph consistent with the
full-information doctrine (the whole sequence, including locked phases, is
knowable from combat start).

## Tests

### Unit / e2e (mechanics), `rage-phase.engine.test.ts`

- `generateDefaultThreatSequence` returns 4 phases; phases 0-2 have
  `isFinalPhase: false`; phase 3 has `isFinalPhase: true` and
  `unlockAfterRound === RAGE_UNLOCK_ROUND`; phase 3's `threatAction.effects`
  contains both a `damage` and an `enemyHeal` entry (the "combo" telegraph).
- `processBetweenPhases` called with `currentPhaseIndex` at the last
  pre-rage index (2) and `round` one below the unlock threshold
  (`RAGE_UNLOCK_ROUND - 2`, so `resolvedRound === RAGE_UNLOCK_ROUND - 1`)
  returns `currentPhaseIndex` **unchanged** (still 2) — the pointer holds,
  repeating the pre-rage phase rather than advancing into the locked one.
- Same setup with `round: RAGE_UNLOCK_ROUND - 1` (`resolvedRound ===
  RAGE_UNLOCK_ROUND`) advances `currentPhaseIndex` to 3 (the rage phase) —
  the gate opens exactly at the threshold, not one round early or late.
- Once in the rage phase (`currentPhaseIndex: 3`), a further
  `processBetweenPhases` call stays at 3 (array-length cap, same as any
  final phase looping today).
- `resolveThreatPhase` on a state pinned at the rage phase applies both the
  damage (scaled by `THREAT_DAMAGE_SCALE` / escalation as usual) and the
  enemy self-heal (via the existing `enemyHeal` effect path) — confirms the
  rage phase's heal rider actually fires through the unmodified resolve
  path, not just that the data shape is correct.
- Invariant guard: an authored enemy (e.g. `GraveLarva`, id
  `enemy-grave-larva`, in `AUTHORED_THREAT_SEQUENCES`) run through
  `getThreatSequence` produces a sequence with every phase's
  `unlockAfterRound` `undefined` — authored content is untouched.
- `resolveAuthored` with an `AuthoredThreatPhase` that explicitly sets
  `unlockAfterRound` threads it through unchanged (proves the plumbing for
  a future authored-boss rage phase, even though none is authored yet).

Reuse the `makeEnemy(hp, stance)` fixture pattern from
`hazard-pattern-combat-helpers.engine.test.ts:80` (clones `GraveLarva`,
overrides `id` to a non-authored id so `getThreatSequence` falls through to
the generator) and the direct-state-override pattern from
`status-depth-combat.engine.test.ts` (`processBetweenPhases({ ...base,
currentPhaseIndex, round })`) — no need to play cards or loop full turns to
reach round 6.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + lint + vitest + build. `CombatThreatPhase`
is exported through the `@mechanics` barrel — additive field only, so a
quick sanity check on the consumers:

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

- **Generated sequences only, this phase.** The 51 hand-authored sequences
  in `combat.threat-sequences.ts` (several playtest-calibrated, e.g. the
  L110 `enemy-the-incompleteness` near-impossible ceiling) are left
  untouched — adding an extra phase to a calibrated boss would silently
  shift its tuned win rate. Rage mode ships universally for the
  **unauthored majority** of the roster via `generateDefaultThreatSequence`
  first; authoring rage phases for specific storied bosses is a follow-up
  content phase, not an engine phase.
- **Round-threshold trigger (`unlockAfterRound`), not a Spec-29-style
  reactive predicate.** Matches the build-plan row's own naming; Spec 29's
  broader Cleanse/Harden/Adapt-stance reaction system stays a separate,
  not-yet-implemented spec.
- **Self-heal, not a new effect or bigger number alone.** A flat damage
  multiplier increase would just be "more of THE CLOCK"; the self-heal
  (reusing the already-exported `enemyHeal` rider) makes the rage phase
  punish *slow, non-status attrition* specifically — sustained basic-attack
  trading gets partially healed back, while locked-in DoT keeps ticking
  regardless. This is what makes "fast status finishes are rewarded" true
  mechanically, not just thematically.
- **`RAGE_UNLOCK_ROUND = 6`** — chosen because `THREAT_ESCALATION_MAX`
  (the existing numeric clock) already saturates a few rounds past
  `THREAT_ESCALATION_GRACE` (~round 5-6 for a normal enemy); the rage phase
  picks up qualitatively right where the numeric ramp caps out, rather than
  overlapping or leaving a dead gap.
- **No mobile change.** `intentVM`'s next-phase preview already renders
  whatever the array holds; showing the rage phase as an upcoming "next"
  telegraph several rounds before it actually unlocks is consistent with
  the full-information doctrine (Spec 25) and needs no code change.

## Git

```bash
git add axiomancer-mechanics/src/Combat/combat.encounter.types.ts \
        axiomancer-mechanics/src/Combat/combat.threat.ts \
        axiomancer-mechanics/src/Combat/combat.engine.ts \
        axiomancer-mechanics/src/Combat/e2e/rage-phase.engine.test.ts
git commit -m "$(cat <<'EOF'
feat(mechanics): enemy rage-mode threat phase — phase 3

- add CombatThreatPhase.unlockAfterRound: a phase that can't be entered
  until the resolving round crosses its threshold; processBetweenPhases
  holds the phase pointer (repeats the last reachable phase) while locked
- generateDefaultThreatSequence appends a 4th "rage" phase (harder-hitting
  + self-healing) locked until round 6, for every enemy without an
  authored threat sequence
- resolveAuthored threads unlockAfterRound through for future authored
  rage-phase content (no authored sequence sets it yet)

Decisions:
- scoped to generated (unauthored) sequences only this phase — the 51
  hand-authored sequences (some playtest-calibrated) are untouched;
  authoring boss-specific rage phases is a follow-up content phase
- round-threshold trigger per the build-plan row's own unlockAfterRound
  naming, not Spec 29's broader (and stale, pressure-track-era) reactive
  Cleanse/Harden/Enrage/Adapt-stance system — Spec 29 stays open
- self-heal rider (not a bigger damage number) so the rage phase
  specifically punishes slow non-status attrition, rewarding fast
  status-effect finishes
- RAGE_UNLOCK_ROUND=6 picked to pick up where THE CLOCK's numeric
  escalation (THREAT_ESCALATION_MAX) already saturates
EOF
)"
git push origin main
```

## DoD

Flip Phase 3 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 3 shipped — enemy rage-mode threat phase"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- Author explicit rage phases (`unlockAfterRound` + a thematic self-heal or
  escalation action) for 1-2 storied bosses (e.g. `enemy-death`,
  `enemy-beelzebub`) — a content-authoring phase, not an engine change; the
  plumbing already supports it (`resolveAuthored` threads the field
  through).
- Spec 29's full reactive-enemy system (Cleanse / Harden / Adapt-stance,
  authored-vs-default reaction triggers) — this phase implements only the
  escalation-phase primitive, not the rest of that draft spec.
- Balance-sim population witnesses for how the rage phase shifts
  slow-finishing-policy win rates — folds into build-plan Phase 4
  ("Balance-sim population witnesses for the HP kill-paths").
