# Effects

Developer reference for every status effect in Axiomancer Mechanics. For an individual
effect deep-dive (data fields, combat interaction, test cases) see the per-effect
documents in [`docs/effects/`](./effects/).

---

## Table of Contents

1. [Overview](#overview)
2. [Tier Scale & Resistance Rules](#tier-scale--resistance-rules)
3. [Stacking Modes](#stacking-modes)
4. [Payload Field Reference](#payload-field-reference)
5. [ActiveEffect Runtime Fields](#activeeffect-runtime-fields)
6. [Combat Consumption Map](#combat-consumption-map)
7. [Round Order](#round-order)
8. [Tier 1 Auto-Effects](#tier-1-auto-effects)
9. [Complete Effects Table — Buffs (40)](#complete-effects-table--buffs-40)
10. [Complete Effects Table — Debuffs (48)](#complete-effects-table--debuffs-48)
11. [Effect Engine API](#effect-engine-api)
12. [Implementation Status](#implementation-status)
13. [Pending](#pending)

---

## Audit summary (Phase 79)

Audit shipped at Phase 79 (commit `3d213bd` 2026-05-24) walked
all 88 effects (40 buffs + 48 debuffs) against four axes: per-effect
test coverage, doc coverage, spec acceptance, and engine resolution
shape. Full per-tier / per-category verdict tables in
[`plan/phases/phase_79_general_effects_audit.md`](../plan/phases/phase_79_general_effects_audit.md).

**Coverage gap surfaced.** 56 of 88 (64%) effects carry **zero direct
test-file references** by effect id. Larger gap than Phase 78's
8-of-21 skills audit (38%), but structurally different: many of the 56
uncovered effects share the same engine resolution path (`applyEffect`
+ `tickAllEffects` + tier-keyed `resolveEffectApplication` dispatch),
so the per-case test cost is lower than per-skill cases. The gap
concentrates by category — stat (20/25 uncovered), defense (14/19),
advantage (13/14), control (10/17), damage (5/10); regeneration is
100% covered.

**Tier distribution snapshot (Phase 80 baseline).** Tier 1 (12
effects, 8 buffs + 4 debuffs) auto-applies, no roll — Phase 80 no-op.
Tier 2 buffs (30) use caster-side d20 fumble/crit. Tier 2 debuffs (43
effects, the load-bearing surface) currently use target-roll-to-resist
(DR = effect.resistDR + attackerHeartBonus + equipmentBonus) with
Nat-20 rebound and Nat-1 double-duration. Tier 3 (3 effects) are
"only Nat-20 escapes." Phase 80 direction (a) removes the target-resist
roll on Tier 2 debuffs; keeps Tier 2 buff caster fumble/crit per the
audit's D8 recommendation (final call lives with Phase 80's brief
drafter).

**Doc + spec.** Complete Effects Tables list all 88 IDs; headings
"Buffs (40)" + "Debuffs (48)" match live counts. Spec 01 acceptance
ticks all rows; no library/spec divergence.

**Phase 80 / 83 framing.** 1 MED + 5 LOW aggregate findings filed in
`plan/CRITIQUE.md` Pending — 28 of 43 Tier 2 debuffs uncovered is the
primary surface for Phase 83 (post-Phase-80 effect-application test
sweep). /iterate drains the 5 LOW aggregate rows category-by-category
between now and Phase 83.

**Phase 80 status (shipped 2026-05-24).** Direction (a) pure split
shipped in `src/Combat/resist.ts`: Tier 2 debuffs + Tier 3 effects
**always land**. Target-resist roll removed; Nat-20 rebound (Tier 2
debuff) removed; Nat-1 overwhelmed-double-duration removed; Tier 3
Nat-20 miraculous escape removed. Tier 1 + Tier 2 buffs unchanged per
D2 (caster-side variance is not target-resist). The damage-side of
direction (a) ("damage rolls separately + applies resistance") is
**deferred to a follow-up phase** per Phase 80 D1 — `calculateSkillDamage`
stays deterministic for now; the damage-resist primitive lives in a
new Pending candidate. Phase 84 removed the dead-code
`effect-rebounded` variant and renamed `effect-resisted` to
`buff-fumbled` (only fires on Tier 2 buff caster fumble).
The revisit-if-unbalanced
caveat lives at `plan/PHASE_CANDIDATES.md` Promoted Phase 80 row +
the brief at `plan/phases/phase_80_skills_always_land_pure_split.md`.

---

## Overview

Effects are temporary modifiers applied to combatants during battle. Every effect is stored
as an `ActiveEffect` instance on `character.effects` or
`enemy.effects`. Effect data is loaded at runtime from
`src/Effects/buffs.library.json` and `src/Effects/debuffs.library.json` and keyed into an
in-memory `Map` by `effect.id` via `src/Effects/effects.library.ts`.

All effect application logic lives in `src/Effects/index.ts`. All combat-time helpers
(resist resolution, tick, regen, roll modifiers, thorns, mark, Heart specials) live in
`src/Combat/index.ts`. The round resolver (`src/Combat/combat.resolver.ts` and the
per-phase files under `src/Combat/phases/`) wires them together; the interactive demo
CLI (`src/CLI/game.cli.ts`) drives the resolver from a tabbed prompt.

---

## Tier Scale & Resistance Rules

| Tier   | Resist DR   | Rule                                                              |
|--------|-------------|-------------------------------------------------------------------|
| Tier 1 | —           | Auto-applies. No resist roll. Always lands.                       |
| Tier 2 | 12 – 14     | Resist roll required (buff: fumble only; debuff: roll vs DR).     |
| Tier 3 | 17 – 18     | Only a natural 20 on the resist roll repels it.                   |

Each effect carries two resist fields (copied onto the `ActiveEffect` for fast lookup):

- `resistedBy: Stance` — which stat the **target** uses to resist (`heart`, `body`, `mind`)
- `resistDR: number` — base difficulty of the resist roll

**RPS Rule:** Body effects are resisted by Mind. Mind effects by Heart. Heart effects by Body.

### Tier 2 — Buff (caster rolls)

| Result    | Outcome                                         |
|-----------|-------------------------------------------------|
| Natural 1 | Fumble — concentration shattered, buff fizzles. |
| Natural 20 | Crit focus — buff applies at **2× intensity**. |
| Any other | Auto-succeeds.                                  |

### Tier 2 — Debuff (always lands)

Post-Phase-80: no target-resist roll. No rebound. No overwhelmed.
The debuff lands unconditionally at its authored intensity + duration.

### Tier 3 (always lands)

Post-Phase-80: no Nat-20 escape. Inescapable — always lands at
authored intensity + duration.

---

## Stacking Modes

| Mode        | Behaviour                                                                                                  |
|-------------|-------------------------------------------------------------------------------------------------------------|
| `none`      | Strongest instance wins. Equal or weaker re-application is ignored. Duration is **not** refreshed.          |
| `intensity` | `intensity` increments by `intensityDelta` each application (capped at `MAX_EFFECT_INTENSITY = 10`). Duration resets or extends additively per `ApplyEffectOptions`. |
| `duration`  | `remainingDuration` extends by `effect.duration` on reapply (capped at `MAX_EFFECT_DURATION = 10`).         |

`ApplyEffectOptions` (used by Tier 1 system):

| Field            | Default           | Purpose                                                        |
|------------------|-------------------|----------------------------------------------------------------|
| `intensityDelta` | `1`               | How much intensity increases (also the initial intensity).     |
| `durationMode`   | `'reset'`         | `'reset'` resets to `effect.duration`; `'additive'` adds delta.|
| `durationDelta`  | `intensityDelta`  | How much duration increases in additive mode.                  |

---

## Payload Field Reference

Every effect's mechanical modifications live in its `payload` object.

```jsonc
{
  "payload": {
    // Modifies base or derived stats. LIVE: applied via getEffectiveStats(). A
    // `body`/`mind`/`heart` target re-derives every dependent derived stat.
    // Targets like `physicalAttack` patch the derived stat directly. All
    // modifiers scale with intensity (Q2). Multipliers compose additively (Q3).
    "statModifiers": [
      { "stat": "body", "value": 2, "isMultiplier": false },
      { "stat": "physicalAttack", "value": 1.5, "isMultiplier": true }
    ],

    // Flat bonus/penalty added to EVERY attack/damage dice roll.
    // LIVE: summed by getActiveRollModifier() in src/Combat/index.ts.
    "rollModifier": 2,

    // Per-stack roll bonus/penalty. Total = rollModifierPerIntensity × intensity.
    // LIVE: included in getActiveRollModifier() sum.
    "rollModifierPerIntensity": 1,

    // Flat bonus/penalty added to defence values, intensity-scaled.
    // LIVE: surfaced as `getEffectiveStats().defenseDelta`. Folded into the
    // defending damage path via `getDefenseStat` and into passive (no-defend)
    // hits via `getPassiveDefense` so it always applies.
    "defenseModifier": 3,

    // Damage-over-time. LIVE: consumed by `processDamageOverTime()`.
    // `tickPhase` selects when the tick fires; missing → 'start'. Per Q5,
    // DoT damage is unresisted (bypasses damageType-keyed defense) — the
    // damageType is informational only and reserved for future immunities.
    "damageOverTime": {
      "damagePerRound": 3,
      "damageType": "body",
      "tickPhase": "start"          // 'start' | 'end' (default 'start')
    },

    // Per-round HP regen. LIVE:
    //   healthPerRound > 0 → applyRegen() (heals; clamped at maxHealth)
    //   healthPerRound < 0 → applyDrain() (raw HP loss; bypasses defense — Q6)
    "regeneration": {
      "healthPerRound": 3
    },

    // Damage per intensity reflected to attacker when bearer is hit.
    // LIVE: consumed by getThornsReflect() in src/Combat/effects.ts.
    "reflectDamage": 1,

    // Action restrictions. LIVE: resolved by canAct() (Q7 precedence).
    //   skipTurn: bearer loses their action regardless of stance.
    //   forcedStance: overrides bearer's chosen stance (charm).
    //   blockedStances: bearer cannot use those stances (silence).
    "actionRestriction": {
      "skipTurn": false,
      "blockedStances": ["heart"],
      "forcedStance": null
    },

    // Advantage/disadvantage grants. LIVE: resolved by
    // resolveEffectiveAdvantage(). Per Q8 the grant overrides the matchup
    // result outright. (If unbalanced, propose canceling overrides instead.)
    "advantageModifier": {
      "grantAdvantage":    ["body"],
      "grantDisadvantage": ["body", "mind", "heart"]
    }
  }
}
```

### Runtime aggregation (pre-loop, verified at Phase 48)

Active effects' `statModifiers` + `defenseModifier` are aggregated and
applied to combatant stats at every stat-accessor call — the engine
has never read raw `Character.derivedStats` in combat math. The
pipeline:

```
applyEffect (rolls intensity / duration / resist)
    → ActiveEffect attached to combatant.effects
        → getActiveEffectModifiers(effects)        // one-pass aggregation
            → { statFlat, statMultBonus, defenseDelta, ... }
                → getEffectiveStats(combatant)     // folds into stats
                    → { baseStats, derivedStats, nonCombatStats, defenseDelta }
                        → getAttackStat / getDefenseStat / getSaveStat
                          getBaseStat / getSaveStat                    // src/Combat/stats.ts
                            → resolveCombatRound (every stat read)
```

Aggregation rules:

- **Intensity scaling is unconditional.** Every numeric modifier
  contributes `value × intensity`. Multipliers contribute
  `(value - 1) × intensity` to a stat-mult-bonus that composes
  additively per Q3: `final = base × (1 + Σ bonus)`.
- **Base-stat targets re-derive every dependent.** A `statModifiers:
  [{ stat: 'body', value: 2 }]` buff bumps body, then `physicalAttack`,
  `physicalSkill`, `physicalDefense`, `luck`, and (for Characters) the
  `physicalSave` / `physicalTest` non-combat pair all re-derive from
  the effective body.
- **Derived-stat targets patch directly.** A `statModifiers: [{ stat:
  'physicalDefense', value: -2 }]` debuff drops the derived defense
  after re-derivation, without disturbing the base stat.
- **`defenseModifier` is stance-agnostic.** Folded into `defenseDelta`
  and added by `getDefenseStat` on top of the (effective) stance
  defense.

Verified at Phase 48 (`c892801`) via
`src/Combat/e2e/effect-stat-modifiers.engine.test.ts` — 8 hermetic
cases pin the public stat-accessor surface against the live
library effects (`buff_body_attack_up`, `buff_max_hp_up`,
`buff_barrier`, `debuff_all_stats_down`).

### Payload field implementation status

| Field                     | Status   | Where consumed                              |
|---------------------------|----------|---------------------------------------------|
| `rollModifier`            | **LIVE** | `getActiveRollModifier()` — `src/Combat/effects.ts` |
| `rollModifierPerIntensity` | **LIVE** | `getActiveRollModifier()` — scaled by `intensity` |
| `reflectDamage`           | **LIVE** | `getThornsReflect()` — `src/Combat/effects.ts` |
| `regeneration.healthPerRound` | **LIVE** | `applyRegen()` (positive) / `applyDrain()` (negative) — `src/Combat/effects.ts` |
| `statModifiers`           | **LIVE** | `getEffectiveStats()` re-derives stats; consumed by `getAttackStat` / `getDefenseStat` / `getSaveStat` — `src/Combat/stats.ts` |
| `defenseModifier`         | **LIVE** | `getEffectiveStats().defenseDelta`; folded into defending paths via `getDefenseStat` and into passive damage paths via the scenario phase — `src/Combat/stats.ts`, `src/Combat/phases/scenario.ts` |
| `damageOverTime`          | **LIVE** | `processDamageOverTime()` — `src/Combat/effects.ts`, split by `tickPhase` (`'start'` / `'end'`) |
| `advantageModifier`       | **LIVE** | `resolveEffectiveAdvantage()` — `src/Combat/advantage.ts` (grants override matchup per Q8) |
| `actionRestriction`       | **LIVE** | `canAct()` — `src/Combat/effect-modifiers.ts` (skipTurn / forcedStance / blockedStances per Q7) |

---

## ActiveEffect Runtime Fields

When an effect is applied, an `ActiveEffect` instance is created and stored on the
combatant:

```typescript
{
  effectId:          string;            // references Effect.id in the library
  remainingDuration: number;            // rounds until expiry; -1 = permanent
  intensity:         number;            // stack level for intensity-stacking effects
  appliedAt:         number;            // which combat round the effect was first applied
  tier:              1 | 2 | 3;
  resistedBy?:       Stance;            // copied from Effect for fast resist lookup
  resistDR?:         number;            // copied from Effect for fast resist lookup
  sourceId?:         string;            // ID of who applied it (Phase 38 attribution)
}
```

### Attribution — `sourceId` (Phase 38)

Every `applyEffect` call on the combat / skill path stamps the new
`ActiveEffect` with a `sourceId` so consumers can answer "who applied
this?" without inferring from context. The convention:

| Surface | sourceId | Set by |
|---|---|---|
| Skill engine (skill caster on opponent or self) | `player.id` | `src/Skills/skill.engine.ts` |
| Combat proc (primary application) | `actor.id` | `src/Combat/combat-effects.ts` |
| Combat proc (rebound onto attacker) | `actor.id` (original attacker) | `src/Combat/combat-effects.ts` |
| Combat fumble (self-application) | `actor.id` | `src/Combat/phases/scenario.ts` (passes `actor.id` to `applyFumbleOutcome`) |
| Equipment passive | `item.id` | `src/Character/equipment.reducer.ts` |
| Environmental hazard (MapEvents) | _undefined_ | `src/World/MapEvents/handlers.ts` (no combatant source — deliberate) |

When an existing effect stacks (`intensity` or `duration`),
`applyEffect` uses **last-writer-wins**: a fresh `applyEffect` call
with a `sourceId` replaces the prior; an omitted `sourceId` preserves
the existing one. Rationale: if enemy A stuns the player and enemy B
re-stuns before the stun expires, the live attribution should be B
(the most recent applier).

`sourceId` round-trips through `JSON.stringify` / `JSON.parse`
unchanged — pinned by
`src/Effects/e2e/source-id.engine.test.ts` so a future state-shape
migration cannot silently strip it.

`remainingDuration` special values:

| Value | Meaning                          |
|-------|----------------------------------|
| `-1`  | Permanent (never ticks down).    |
| `0`   | Duration effect expires at end of round (instant effects: `duration: 0` in data). |
| `> 0` | Normal timed effect.             |

---

## Combat Consumption Map

This section details **exactly which combat code path reads each payload field** and the
specific function in which it happens.

### `rollModifier` and `rollModifierPerIntensity`

**Function:** `getActiveRollModifier(target)` — `src/Combat/index.ts`

```
total = Σ (def.payload.rollModifier + def.payload.rollModifierPerIntensity × ae.intensity)
        for each ae in target.effects
```

Called from the scenario phase (`src/Combat/phases/scenario.ts`) to adjust attack and
damage rolls before they are applied. Both fields are summed across **all** active
effects simultaneously.

### `reflectDamage`

**Function:** `getThornsReflect(bearer)` — `src/Combat/index.ts`

```
total = Σ (def.payload.reflectDamage × ae.intensity)
        for each ae in bearer.effects
```

Called from the scenario phase (`src/Combat/phases/scenario.ts`) after a successful
hit on the bearer. The total is dealt as reflect damage back to the attacker. Scales
with `intensity` — higher stacks deal more thorns.

### `regeneration.healthPerRound`

**Function:** `applyRegen(target)` — `src/Combat/index.ts`

```
healed = Σ (def.payload.regeneration.healthPerRound × ae.intensity)
         for each ae where healthPerRound > 0
```

Called at the **start of each round** before the player makes a choice. Scales with
`intensity` — stacking regen effects heal more per round. Negative
`healthPerRound` values in the data (e.g. `debuff_disease`, `debuff_hp_decay`)
are routed through `applyDrain` (`src/Combat/effects.ts`) on the same round-start
pass — drain ticks BEFORE start-of-round DoT and emits its own `round-start:drain`
event.

### `tier1_mind_mark` intensity (Exposed Reasoning)

**Function:** `getStudyMarkIntensity(target)` — `src/Combat/index.ts`

```
intensity = target.effects
              .find(e => e.effectId === 'tier1_mind_mark')
              ?.intensity ?? 0
```

Called from the scenario phase (`src/Combat/phases/scenario.ts`) during Mind/Attack
resolution. The mark's intensity is added as a flat damage bonus to the attack roll.

### Buff stripping and extension (Heart/Attack special)

**Functions:** `removeRandomBuff(target)` and `extendRandomBuffDuration(target, amount)`
— `src/Combat/index.ts`

- `removeRandomBuff`: picks a random `buff`-typed active effect from the **enemy** and
  removes it entirely.
- `extendRandomBuffDuration`: picks a random `buff`-typed active effect from the
  **player** and adds rounds (capped at `MAX_EFFECT_DURATION`).

Both are called from the scenario phase (`src/Combat/phases/scenario.ts`) when the
player's Heart/Attack hits.

### Duration ticking

**Function:** `tickAllEffects(target)` — `src/Combat/index.ts`

Called at the **end of each round** for both player and enemy. Each non-permanent effect
has `remainingDuration` decremented by 1. Effects reaching `0` are removed and returned
as `expired[]` so the CLI can display expiry messages.

### Tier 1 application

**Function:** `applyTier1CombatEffect`
— `src/Effects/index.ts`

Called once per combatant per round, right after clearing stale Tier 1 buffs. The Tier 1
map (`TIER1_EFFECT_MAP`) keys on `(stance, action)` and returns an `effectId`, `target`
(`'self'` or `'opponent'`), and optional `ApplyEffectOptions`. Mind actions target the
opponent; all other stances target self.

### Stance-switch buff clearing

**Function:** `clearTier1EffectsForStance(activeEffects, currentType)`
— `src/Effects/index.ts`

Removes any active Tier 1 buff whose effect ID contains a **different** stance prefix
than the current action. Debuffs applied to the actor by an opponent are never cleared
here. Called once per combatant per round, before Tier 1 application.

### Resist resolution (Tier 2 / Tier 3)

**Function:** `resolveEffectApplication(target, activeEffect, effectType, attackerHeartBonus, equipmentBonus)`
— `src/Combat/index.ts`

Post-Phase-80 (direction (a) pure split): Tier 2 debuffs and Tier 3
effects **always land** — no target-resist roll. Only Tier 2 buffs still
roll (caster-side d20 for fumble/crit). `getSaveStat` remains on the
public barrel for consumer use but is no longer called by this pipeline.

---

## Round Order

The combat CLI processes effects in this order each round:

```
1. processRoundStartEffects   — applyRegen → applyDrain → start-phase DoT
2. canAct                     — resolves skipTurn / forcedStance / blockedStances (Q7)
3. resolveEffectiveAdvantage  — folds advantageModifier grants/denies into matchup (Q8)
4. clearTier1EffectsForStance — Remove stale Tier 1 stance buffs
5. applyTier1CombatEffect     — Apply new Tier 1 stance effect (skipped combatants don't apply)
6. Resolve attacks:
     a. getEffectiveStats        — base + derived stat modifiers, defenseDelta
     b. getActiveRollModifier    — flat + per-intensity roll mods
     c. getStudyMarkIntensity    — Mind mark damage bonus
     d. getThornsReflect         — Post-hit reflect damage
     e. removeRandomBuff         — Heart/Attack: strip enemy buff
     f. extendRandomBuffDuration — Heart/Attack: extend player buff
7. processRoundEndEffects     — end-phase DoT (e.g. bleed) → tickAllEffects + expiry
```

---

## Tier 1 Auto-Effects

Every basic `attack` or `defend` action automatically applies a Tier 1 stance effect with
no resist roll. Switching stances removes the previous stance's self-buff immediately.

| Action         | Effect ID               | Effect Name         | Target   | Stack delta | payload summary                                      |
|----------------|-------------------------|---------------------|----------|-------------|------------------------------------------------------|
| Body + Attack  | `tier1_body_attack`     | Ad Baculum          | self     | +1 int / reset dur | `+physicalAttack 1`, `rollModifierPerIntensity 1` |
| Body + Defend  | `tier1_body_defend`     | Briar Stance        | self     | +1 int / reset dur | `reflectDamage 1` per intensity                   |
| Mind + Attack  | `tier1_mind_mark`       | Exposed Reasoning   | opponent | +1 int / +1 dur    | `{}` — intensity used as Mind damage bonus        |
| Mind + Defend  | `tier1_mind_mark`       | Exposed Reasoning   | opponent | +3 int / +3 dur    | `{}` — intensity used as Mind damage bonus        |
| Heart + Attack | `tier1_heart_attack`    | Fleeting Kindness   | self     | +1 int / reset dur | `rollModifier -5`; strip enemy buff + extend player buff on hit |
| Heart + Defend | `tier1_heart_defend`    | Vital Empathy       | self     | +1 int / reset dur | `regeneration.healthPerRound 1` per intensity     |

---

## Complete Effects Table — Buffs (40)

Full per-effect documentation: [`docs/effects/buffs/`](./effects/buffs/)

| ID | Name | Tier | Category | Dur | Stack | resistedBy | resistDR | Payload Summary |
|----|------|------|----------|-----|-------|-----------|---------|-----------------|
| `tier1_body_attack` | Ad Baculum | Tier 1 | stat | 2 | intensity | — | — | `+physicalAttack 1`, `rollModifierPerIntensity 1` |
| `tier1_body_defend` | Briar Stance | Tier 1 | defense | 3 | intensity | — | — | `reflectDamage 1` per intensity |
| `tier1_heart_defend` | Vital Empathy | Tier 1 | regeneration | 3 | intensity | — | — | `healthPerRound 1` per intensity |
| `tier1_heart_attack` | Fleeting Kindness | Tier 1 | stat | 2 | intensity | — | — | `rollModifier -5` |
| `buff_body_attack_up` | Achilles' Momentum | Tier 2 | stat | 3 | intensity | mind | 13 | `+body 2`, `+physicalSkill 3`, `rollModifier +2` |
| `buff_mind_attack_up` | Schrödinger's Focus | Tier 2 | stat | 3 | intensity | heart | 13 | `+mind 2`, `+mentalSkill 3`, `rollModifier +2` |
| `buff_heart_attack_up` | Bootstrap Passion | Tier 2 | stat | 3 | intensity | body | 13 | `+heart 2`, `+emotionalSkill 3`, `rollModifier +2` |
| `buff_body_defense_up` | Theseus' Constitution | Tier 2 | defense | 4 | duration | mind | 12 | `+body 2`, `+physicalDefense 3`, `defenseModifier +2` |
| `buff_mind_defense_up` | Epistemic Shield | Tier 2 | defense | 4 | duration | heart | 12 | `+mind 2`, `+mentalDefense 3`, `defenseModifier +2` |
| `buff_heart_defense_up` | Paradox of Tolerance | Tier 2 | defense | 4 | duration | body | 12 | `+heart 2`, `+emotionalDefense 3`, `defenseModifier +2` |
| `buff_defend_up` | Hilbert's Shelter | Tier 2 | defense | 3 | none | heart | 14 | `defenseModifier +4`, `+body/mind/heart 1`, `+physDef/menDef/emoDef 2` |
| `buff_accuracy_up` | Bertrand's Precision | Tier 2 | advantage | 3 | intensity | heart | 13 | `rollModifier +3`, `+physSkill/menSkill/emoSkill 2` |
| `buff_evasion_up` | Arrow's Impossibility | Tier 2 | defense | 3 | duration | mind | 13 | `defenseModifier +3`, `+allDefense 2`, `grantDisadvantage [body,mind,heart]` |
| `buff_critical_rate_up` | Observer's Collapse | Tier 2 | advantage | 4 | intensity | heart | 12 | `rollModifier +2`, `+luck 2` |
| `buff_critical_damage_up` | Banach-Tarski Strike | Tier 2 | damage | 3 | none | mind | 14 | `×body 1.5`, `×mind 1.5`, `×heart 1.5` (multipliers) |
| `buff_haste` | Twin's Dilation | Tier 3 | advantage | 2 | none | mind | 17 | `rollModifier +4`, `grantAdvantage [body,mind,heart]` |
| `buff_regeneration` | Tristram's Recovery | Tier 2 | regeneration | 5 | intensity | mind | 12 | `healthPerRound 3` per intensity |
| `buff_max_hp_up` | Galileo's Infinity | Tier 2 | stat | 5 | none | mind | 13 | `×body 1.25` (multiplier) |
| `buff_barrier` | Gabriel's Horn | Tier 2 | defense | 3 | none | heart | 13 | `defenseModifier +5` |
| `buff_damage_reduction` | Dichotomy Shield | Tier 2 | defense | 3 | none | heart | 13 | `defenseModifier +5` |
| `buff_invincibility` | EPR Entanglement | Tier 3 | defense | 1 | none | heart | 18 | `defenseModifier +99` |
| `buff_taunt` | Crocodile's Promise | Tier 2 | control | 3 | none | body | 12 | `defenseModifier +2`, `+body 1` |
| `buff_stealth` | Fermi's Absence | Tier 2 | advantage | 2 | none | mind | 14 | `defenseModifier +6`, `grantAdvantage [body,mind,heart]` |
| `buff_all_stats_up` | Sorites Ascension | Tier 2 | stat | 3 | none | heart | 14 | `+body/mind/heart 2`, `+allSkill 1`, `+luck 1`, `rollModifier +1` |
| `buff_reflect` | Russell's Mirror | Tier 2 | defense | 2 | none | heart | 13 | `defenseModifier +2` |
| `buff_counter` | Newcomb's Retribution | Tier 2 | advantage | 3 | none | mind | 13 | `rollModifier +2`, `grantAdvantage [body]` |
| `buff_resistance_body` | Pole in Barn | Tier 2 | defense | 4 | duration | mind | 13 | `+body 3`, `+physicalDefense 4`, `+physicalSave 3` |
| `buff_resistance_mind` | Liar's Shield | Tier 2 | defense | 4 | duration | heart | 13 | `+mind 3`, `+mentalDefense 4`, `+mentalSave 3` |
| `buff_resistance_heart` | Fiction's Wall | Tier 2 | defense | 4 | duration | body | 13 | `+heart 3`, `+emotionalDefense 4`, `+emotionalSave 3` |
| `buff_cleanse` | Barber's Paradox | Tier 2 | stat | 0 | none | heart | 12 | `{}` (instant — `applyCleanse` ready; wired via skills in Spec 04) |
| `buff_buff_duration_up` | Unexpected Extension | Tier 2 | advantage | 3 | none | heart | 12 | `rollModifier +1` |
| `buff_status_chance_up` | Monty's Advantage | Tier 2 | advantage | 4 | none | heart | 13 | `rollModifier +3` |
| `buff_life_steal` | Maxwell's Siphon | Tier 2 | regeneration | 4 | intensity | mind | 12 | `healthPerRound 2` per intensity, `rollModifier +1` |
| `buff_advantage_body` | Predestination Strength | Tier 2 | advantage | 3 | none | mind | 13 | `grantAdvantage [body]`, `+body 1`, `+physicalSkill 2` |
| `buff_advantage_mind` | Knowability Insight | Tier 2 | advantage | 3 | none | heart | 13 | `grantAdvantage [mind]`, `+mind 1`, `+mentalSkill 2` |
| `buff_advantage_heart` | Hedonist's Loop | Tier 2 | advantage | 3 | none | body | 13 | `grantAdvantage [heart]`, `+heart 1`, `+emotionalSkill 2` |
| `buff_petitio_pulse` | Petitio Principii Pulse | Tier 1 | stat | 2 | none | body | 10 | `+heart 1` |
| `buff_gettiters_flicker` | Gettier's Flicker | Tier 1 | advantage | 2 | none | heart | 10 | `+luck 1` |
| `buff_ad_hoc_patch` | Ad Hoc Patch | Tier 1 | stat | 2 | none | mind | 10 | `+physicalSkill 1` |

---

## Complete Effects Table — Debuffs (48)

Full per-effect documentation: [`docs/effects/debuffs/`](./effects/debuffs/)

| ID | Name | Tier | Category | Dur | Stack | resistedBy | resistDR | Payload Summary |
|----|------|------|----------|-----|-------|-----------|---------|-----------------|
| `tier1_mind_mark` | Exposed Reasoning | Tier 1 | stat | 1 | intensity | — | — | `{}` — intensity = Mind attack damage bonus |
| `debuff_all_stats_down` | Heap's Collapse | Tier 2 | stat | 3 | intensity | heart | 13 | `-body/mind/heart 2`, `-allSkill 1`, `rollModifier -1` |
| `debuff_poison` | Curry's Corruption | Tier 2 | damage | 4 | intensity | mind | 13 | `DoT 3/rd (body)` |
| `debuff_strong_poison` | Yablo's Venom | Tier 2 | damage | 3 | intensity | mind | 14 | `DoT 5/rd (body)`, `-body 1` |
| `debuff_bleed` | Theseus' Dissolution | Tier 2 | damage | 4 | intensity | mind | 12 | `DoT 2/rd (body)` |
| `debuff_burn` | Olbers' Fire | Tier 2 | damage | 3 | intensity | body | 13 | `DoT 4/rd (heart)`, `-heart 1` |
| `debuff_frostbite` | Boltzmann's Chill | Tier 2 | damage | 3 | duration | mind | 12 | `DoT 2/rd (body)`, `rollModifier -2` |
| `debuff_shock` | Hardy's Discharge | Tier 2 | damage | 2 | intensity | heart | 13 | `DoT 3/rd (mind)`, `rollModifier -1` |
| `debuff_curse` | Grelling's Malediction | Tier 2 | stat | 5 | none | body | 14 | `-body 1`, `-mind 1`, `-heart 2`, `rollModifier -2` |
| `debuff_disease` | Inspection Sickness | Tier 2 | damage | 4 | duration | mind | 12 | `DoT 2/rd (body)`, `healthPerRound -1` (drain — via `applyDrain`) |
| `debuff_wound` | Berry's Injury | Tier 2 | stat | 4 | intensity | mind | 13 | `-body 2`, `defenseModifier -2` |
| `debuff_stun` | Buridan's Paralysis | Tier 2 | control | 1 | duration | heart | 14 | `skipTurn true` |
| `debuff_sleep` | Sleeping Beauty's Rest | Tier 2 | control | 2 | none | heart | 13 | `skipTurn true`, `defenseModifier -3` |
| `debuff_daze` | Simpson's Confusion | Tier 2 | control | 2 | duration | heart | 12 | `rollModifier -3`, `-mind 2`, `-mentalSkill 2`, `-mentalDefense 1` |
| `debuff_petrify` | Zeno's Stillness | Tier 3 | control | 2 | none | heart | 17 | `skipTurn true`, `defenseModifier -4` |
| `debuff_fear` | Grandfather's Terror | Tier 2 | control | 2 | duration | body | 13 | `rollModifier -3`, `-heart 3`, `-emotionalSkill 2`, `-emotionalDefense 2` |
| `debuff_charm` | Wigner's Friendship | Tier 2 | control | 2 | none | body | 14 | `forcedStance heart`, `-heart 2`, `-emotionalDefense 2` |
| `debuff_confusion` | Two Envelope Delirium | Tier 2 | control | 3 | duration | heart | 13 | `rollModifier -4`, `grantDisadvantage [body,mind,heart]` |
| `debuff_blind` | Quantum Erasure | Tier 2 | control | 2 | duration | heart | 13 | `rollModifier -5`, `grantDisadvantage [body,mind]` |
| `debuff_silence` | Moore's Muteness | Tier 2 | control | 3 | none | body | 13 | `blockedStances [heart]`, `-heart 2`, `-emotionalSkill 3` |
| `debuff_berserk` | Problem of Evil | Tier 2 | stat | 3 | none | heart | 13 | `+body 3`, `-mind 4`, `-heart 2`, `+physSkill 2`, `-menSkill 3`, `-menDef 2`, `defenseModifier -3` |
| `debuff_fatigue` | Preface Exhaustion | Tier 2 | stat | 4 | intensity | heart | 12 | `-body/mind 1`, `-physSkill/menSkill 1`, `rollModifier -1` |
| `debuff_exhaustion` | Lottery Despair | Tier 2 | stat | 3 | intensity | heart | 13 | `-body/mind/heart 2`, `-allSkill 1`, `rollModifier -2` |
| `debuff_slow` | Achilles' Burden | Tier 2 | control | 3 | duration | mind | 12 | `rollModifier -2`, `-physicalSkill 2`, `grantDisadvantage [body]` |
| `debuff_root` | Braess Binding | Tier 2 | control | 2 | duration | mind | 13 | `defenseModifier -2`, `rollModifier -2` |
| `debuff_knockdown` | Ross-Littlewood Fall | Tier 2 | control | 1 | none | mind | 12 | `defenseModifier -4`, `rollModifier -3` |
| `debuff_vulnerability_body` | Richard's Exposure | Tier 2 | defense | 3 | duration | mind | 13 | `-body 3`, `-physicalDefense 4`, `-physicalSave 3` |
| `debuff_vulnerability_mind` | Cantor's Gap | Tier 2 | defense | 3 | duration | heart | 13 | `-mind 3`, `-mentalDefense 4`, `-mentalSave 3` |
| `debuff_vulnerability_heart` | Burali-Forti Wound | Tier 2 | defense | 3 | duration | body | 13 | `-heart 3`, `-emotionalDefense 4`, `-emotionalSave 3` |
| `debuff_mark` | Raven's Target | Tier 2 | advantage | 3 | none | heart | 13 | `defenseModifier -3`, `grantDisadvantage [body,mind,heart]` |
| `debuff_body_attack_down` | Omnipotence Failure | Tier 2 | stat | 3 | intensity | mind | 13 | `-body 2`, `-physicalSkill 3`, `rollModifier -1` |
| `debuff_mind_attack_down` | GHZ Collapse | Tier 2 | stat | 3 | intensity | heart | 13 | `-mind 2`, `-mentalSkill 3`, `rollModifier -1` |
| `debuff_heart_attack_down` | Toxin Hesitation | Tier 2 | stat | 3 | intensity | body | 13 | `-heart 2`, `-emotionalSkill 3`, `rollModifier -1` |
| `debuff_evasion_down` | Dartboard Certainty | Tier 2 | defense | 3 | duration | heart | 13 | `defenseModifier -3`, `-allDefense 2` |
| `debuff_accuracy_down` | Ellsberg's Doubt | Tier 2 | advantage | 3 | duration | heart | 12 | `rollModifier -3`, `-allSkill 2` |
| `debuff_defense_down` | Prisoner's Betrayal | Tier 2 | defense | 3 | intensity | heart | 13 | `defenseModifier -3`, `-body 1`, `-physicalDefense 2` |
| `debuff_dispel` | Skolem's Reduction | Tier 2 | stat | 0 | none | heart | 12 | `{}` (instant — `applyDispel` ready; wired via skills in Spec 04) |
| `debuff_hex` | Allais' Curse | Tier 2 | damage | 3 | none | body | 13 | `DoT 2/rd (heart)` |
| `debuff_hp_decay` | Centipede's End | Tier 2 | damage | 4 | none | mind | 13 | `DoT 3/rd (body)`, `healthPerRound -2` (drain — via `applyDrain`) |
| `debuff_moral_learning` | Moral Blindness | Tier 2 | control | 3 | none | body | 12 | `-heart 2`, `-mind 1`, `-emotionalSkill 2`, `-mentalSkill 1`, `rollModifier -1` |
| `debuff_transformative` | Transformative Terror | Tier 2 | control | 2 | none | heart | 13 | `rollModifier -2`, `-mind 2`, `-heart 1`, `-mentalSkill 2`, `-emotionalDefense 1` |
| `debuff_rational_disagreement` | Peer Doubt | Tier 2 | stat | 2 | duration | heart | 12 | `-mind 3`, `-mentalSkill 2`, `-mentalDefense 1`, `rollModifier -2` |
| `debuff_straw_man_echo` | Straw Man's Echo | Tier 1 | advantage | 2 | none | body | 10 | `rollModifier -1` |
| `debuff_post_hoc_tremor` | Post Hoc Tremor | Tier 1 | stat | 2 | none | mind | 10 | `-body 1` |
| `debuff_affirming_consequent` | Affirming the Consequent | Tier 1 | stat | 2 | none | mind | 10 | `-physicalSkill 1` |
| `debuff_causal_emergence` | Emergence Failure | Tier 2 | control | 2 | none | heart | 13 | `rollModifier -2`, `-mind 2`, `-mentalSkill 2`, `-physicalSkill 1`, `grantDisadvantage [mind]` |

---

## Effect Engine API

| Function | File | Description |
|----------|------|-------------|
| `lookupEffect(effectId)` | `src/Effects/effects.library.ts` | O(1) lookup by effect ID from the registry |
| `getEffectByName(name)` | `src/Effects/effects.library.ts` | Find effect by display name (slower linear scan) |
| `getEffectsByType(type)` | `src/Effects/effects.library.ts` | Get all buffs or all debuffs |
| `applyEffect(effects, effect, round, options?)` | `src/Effects/index.ts` | Core stacking engine — applies an effect respecting all stacking modes |
| `applyTier1CombatEffect(actorEffects, opponentEffects, combatAction, round, overrides?)` | `src/Effects/index.ts` | Applies Tier 1 stance effect; returns `Tier1Outcome` with updated arrays + UI feedback |
| `clearTier1EffectsForStance(effects, currentStance)` | `src/Effects/index.ts` | Removes stale Tier 1 self-buffs on stance switch |
| `removeEffect(effects, effectId)` | `src/Effects/index.ts` | Removes the first ActiveEffect with the given ID |
| `removeEffectsByType(effects, type, maxTier?)` | `src/Effects/index.ts` | Bulk strip by buff/debuff with optional tier cap (used by cleanse/dispel) |
| `getEffectiveStats(target).baseStats[resistedBy]` | `src/Combat/effect-modifiers.ts` | Target's effective base stat for the resisting stance |
| `resolveEffectApplication(target, activeEffect, effectType, heartBonus, equipBonus)` | `src/Combat/index.ts` | Effect application (Tier 2 debuff/Tier 3: always-land; Tier 2 buff: caster fumble/crit roll) |
| `tickAllEffects(target)` | `src/Combat/effects.ts` | End-of-round duration decrement; returns expired list |
| `updateEffectDuration(target, effectId)` | `src/Combat/effects.ts` | Tick one specific effect by ID |
| `getActiveRollModifier(target)` | `src/Combat/effects.ts` | Sum of all `rollModifier` + `rollModifierPerIntensity × intensity` across active effects |
| `getActiveEffectModifiers(effects)` | `src/Combat/effect-modifiers.ts` | Aggregates stat / defense / advantage / restriction / DoT / regen / drain modifiers in one pass |
| `getEffectiveStats(combatant)` | `src/Combat/effect-modifiers.ts` | Effective base, derived, and non-combat stats with intensity-scaled modifiers applied |
| `canAct(effects, requestedStance?)` | `src/Combat/effect-modifiers.ts` | Resolves `skipTurn` / `forcedStance` / `blockedStances` (Q7) |
| `resolveEffectiveAdvantage(matchup, attackerEffects, attackerStance)` | `src/Combat/advantage.ts` | Folds `advantageModifier` grants/denies into the matchup result (Q8) |
| `getStudyMarkIntensity(target)` | `src/Combat/effects.ts` | Intensity of `tier1_mind_mark` (Mind attack damage bonus) |
| `getThornsReflect(bearer)` | `src/Combat/effects.ts` | Total reflect damage from all thorns effects |
| `removeRandomBuff(target)` | `src/Combat/effects.ts` | Strips one random buff (Heart/Attack special) |
| `extendRandomBuffDuration(target, amount)` | `src/Combat/effects.ts` | Extends one random buff's duration (Heart/Attack special) |
| `applyRegen(target)` | `src/Combat/effects.ts` | Applies positive per-round health regeneration |
| `applyDrain(target)` | `src/Combat/effects.ts` | Applies negative-regen drain as raw HP loss (bypasses defense) |
| `processDamageOverTime(target, phase)` | `src/Combat/effects.ts` | Applies DoT damage routed by `tickPhase` (`'start'` / `'end'`) |
| `processRoundStartEffects(target)` | `src/Combat/effects.ts` | Orchestrates regen → drain → start-phase DoT |
| `processRoundEndEffects(target)` | `src/Combat/effects.ts` | Orchestrates end-phase DoT → tick & expire |
| `applyCleanse(target, tier)` | `src/Combat/effects.ts` | Strip debuffs of `tier ≤ cleanseTier` (Q10) |
| `applyDispel(target, tier)` | `src/Combat/effects.ts` | Strip buffs of `tier ≤ dispelTier` (Q10) |

### Phase 142 — Status Effect Interaction Engine

`EFFECT_INTERACTIONS` is the registry of authored combo rules. Each rule (`EffectInteraction`) fires when a specific primary effect plus one or more secondary effects are both active on the same target, optionally requiring a minimum combined intensity or primary duration. When triggered the interaction amplifies the target effect's intensity, duration, or DoT damage, or grants a combat advantage modifier.

| Function / Constant | Description |
|---|---|
| `EFFECT_INTERACTIONS` | `readonly EffectInteraction[]` — the full authored registry. Currently one entry: `'acid-poison-dissolution'` (acid + poison → `amplify_damage` × 1.5 on the acid DoT). |
| `evaluateInteractions(effects)` | Walks the registry against the combatant's active effects and returns every triggered interaction result. Called by `getActiveEffectModifiers` to fold DoT amplification into the damage total before the round resolves. |
| `checkInteractionTrigger(trigger, activeEffects)` | Checks one trigger condition; returns `{ primary, secondaries }` on a match or `null`. |
| `applyInteractionResult(effects, result)` | Mutates the active effects array per the result (intensity boost, duration extension, or damage amplification). |
| `getInteractionsForEffect(effectId)` | Returns every registered interaction that has the given effect as a trigger or target. |
| `getAllInteractionIds()` | Returns `string[]` of every interaction id in the registry. |
| `getInteractionById(id)` | `EffectInteraction \| undefined` — lookup by interaction id. |
| `validateInteractions(liveEffectIds)` | Returns every registered interaction that references an effect id not in the provided set. Used in tests to guard against dead-combo drift. |
| `INTERACTION_AMPLIFICATION` | Bounds object: `MAX_INTENSITY_MULTIPLIER` (2.0), `MAX_DURATION_MULTIPLIER` (2.5), `MAX_DAMAGE_MULTIPLIER` (2.0), `MIN_MEANINGFUL_AMPLIFICATION` (1.1). |
| `INTERACTION_PRIORITY` | Priority tier thresholds for interaction evaluation order: `CRITICAL` (100), `HIGH` (80), `MEDIUM` (60), `LOW` (40). |
| `STATUS_RESOLUTION_DEBUFF_THRESHOLD` | Minimum combined control+debuff intensity to trigger the Saturation Yield (friendship) path via `getEffectsResolutionOutcome`. Default 3 (tuned from original 8 via Phase 126/130). |
| `STATUS_RESOLUTION_DOT_THRESHOLD` | Minimum DoT damage per round to trigger the DoT Erosion (victory) path. Default 2 (tuned from original 5). |
| `STATUS_RESOLUTION_DOT_MAX_ROUNDS` | Maximum rounds over which pending DoT damage accumulates for the erosion calculation. Default 15. |
| `STATUS_ENGAGEMENT_FLOOR_PERCENT` | Doctrine gauge: status-effect actions must comprise at least this percentage of rounds for a STRATEGIST run to be considered on-doctrine (`VISION.md`). Default 40. |

All constants above are on the root barrel. The interaction-engine source lives in `src/Effects/interactions.ts`; the constants in `src/Combat/resolution.constants.ts`.

---

## Implementation Status

### Fully live in combat

| Mechanic | Driving effect(s) |
|----------|-------------------|
| Roll modifier (flat) | `tier1_heart_attack`, `buff_body_attack_up`, `buff_accuracy_up`, `buff_status_chance_up`, all debuffs with `rollModifier` |
| Roll modifier (per-intensity) | `tier1_body_attack` (Ad Baculum) |
| Health regeneration | `tier1_heart_defend`, `buff_regeneration`, `buff_life_steal` |
| Thorns reflect | `tier1_body_defend` (Briar Stance) |
| Mind mark damage bonus | `tier1_mind_mark` (Exposed Reasoning) |
| Buff strip on hit | `tier1_heart_attack` (Fleeting Kindness) |
| Buff extend on hit | `tier1_heart_attack` (Fleeting Kindness) |
| Duration ticking / expiry | all effects |
| Tier 2/3 resist resolution | all Tier 2 / Tier 3 effects |

### Now live (Phase 2 — Spec 01)

| Mechanic | Driving function(s) |
|----------|---------------------|
| Stat modifier application | `getEffectiveStats()` re-derives stats; intensity-scaled (Q2) |
| Multiplier composition (additive — Q3) | `getActiveEffectModifiers().statMultBonus` |
| Defense modifier application | `getEffectiveStats().defenseDelta` folded into defense paths |
| Damage-over-time loop (split by tick phase — Q4) | `processDamageOverTime()` |
| Negative regeneration (drain — Q6) | `applyDrain()` (raw HP loss, bypasses defense) |
| `skipTurn` enforcement | `canAct()` (Q7 precedence) |
| `blockedStances` enforcement | `canAct()` |
| `forcedStance` enforcement | `canAct()` |
| `advantageModifier` wiring (Q8 — grants override matchup) | `resolveEffectiveAdvantage()` |
| Cleanse mechanic (tier-bounded — Q10) | `applyCleanse(target, tier)` |
| Dispel mechanic (tier-bounded — Q10) | `applyDispel(target, tier)` |
| Round-start orchestration | `processRoundStartEffects()` |
| Round-end orchestration | `processRoundEndEffects()` |

### Still pending

| Mechanic | Affected effects | Why deferred |
|----------|-----------------|--------------|
| Cleanse / dispel landing via skills | `buff_cleanse`, `debuff_dispel` | Skill system arrives in Spec 04. `applyCleanse` / `applyDispel` helpers are ready. |
| `processWorldEffectTick` for hazards while exploring | World hazards | Covered by Spec 08. |
| Equipment-driven `passiveEffects` | Gear that emits effects | Covered by Spec 05. |
| DoT immunity by `damageType` (Q5 future-extension) | All DoT effects | Q5 explicitly defers; DoT is unresisted today. |

---

## Philosophical fallacy payloads (Phase 44)

Phase 44 promotes 3 marquee fallacies from the
[Phase 42 27-cell library](./philosophy.md) into status-effect payloads.
Each carries `sourcedFromCell?: string` on the `Effect` interface (a
kebab-case `PhilosophicalAlignmentCell.id`) so consumers can trace the
effect back to its philosophical origin via
`philosophicalAlignmentLibrary`.

| Effect id | Source cell (PDF #) | Tier | Payload |
|---|---|---|---|
| `debuff_no_true_scotsman` | Logic-Pessimistic-Transcendent / Gnostics (9) | 2 (resisted by mind, DR 12) | `statModifiers: physicalDefense -2/intensity`, dur 3 |
| `buff_special_pleading` | Faith-Optimistic-Individual / Kierkegaard (19) | 1 | `defenseModifier +2/intensity`, dur 2 |
| `debuff_category_error` | Agnostic-Pessimistic-Transcendent / Lovecraft (18) | 2 (resisted by heart, DR 11) | `rollModifierPerIntensity -2`, dur 3 |

All three reuse existing `EffectPayload` primitives — no new payload
kinds. The fallacy framing is purely thematic on top of the existing
tier-1/2/3 application + resist machinery. See
[docs/philosophy.md](./philosophy.md) for the full 27-cell map and
[docs/skills.md](./skills.md#philosophical-fallacy-payloads-phase-44)
for the matching skill payloads.

## Pending

The Specs 01 / 04 / 05 / 08 work that this section used to track has
shipped. The remaining open work for the effects engine is tracked
in `plan/AUDIT.md` and `plan/CRITIQUE.md`; per-effect doc placeholders
(the "PENDING (Phase 2)" notes in `docs/effects/buffs/*.md` and
`debuffs/*.md`) are a separate authoring cleanup that's deferred until
a polish pass touches the relevant buff/debuff entries.
