# Spec 01 — Effects Engine Completion

## Goal

Wire every `EffectPayload` field that is currently typed-but-not-consumed into the
combat engine, so a debuff like `debuff_poison` actually deals damage over time, a
buff like `buff_body_attack_up` actually increases `body`, and `debuff_stun` actually
skips a turn. Today these are documented in the JSON libraries and rendered in the CLI
display, but the round resolution loop ignores them.

**Success state:** every effect listed under "Pending (Phase 2)" in
[`docs/effects.md`](../docs/effects.md) has a runtime hook, a unit test, and a passing
integration check via the combat CLI or vitest.

## Why now / dependencies

- **Unblocks:** Spec 02 (round resolver), Spec 03 (T2/T3 procs), Spec 04 (skills),
  Spec 05 (equipment passives).
- **Depends on:** nothing — all required hooks live in `src/Combat/effects.ts` and
  `src/Effects/index.ts`.

## Current state

- **Live:** `rollModifier`, `rollModifierPerIntensity`, `regeneration.healthPerRound`
  (positive only), `reflectDamage`, mind-mark intensity, buff strip/extend.
- **Pending fields:** `statModifiers`, `defenseModifier`, `damageOverTime`,
  `actionRestriction.skipTurn` / `blockedStances` / `forcedStance`,
  `advantageModifier.grantAdvantage` / `grantDisadvantage`,
  `regeneration.manaPerRound`, negative `healthPerRound`.
- **Pending engine functions:** `removeEffect`, `getActiveEffectModifiers`, `canAct`,
  `processDamageOverTime`, `processRoundStartEffects`, `processWorldEffectTick` (the
  last one is shared with Spec 08).
- **Other:** the multipliers on `buff_critical_damage_up` and `buff_max_hp_up` use
  `isMultiplier: true` but no consumer reads it.

## Open questions

> Answer inline. Strong opinions can override the proposed default in section (5).

1. **Stat modifier vs. base stat vs. derived stat.** Should `statModifiers` apply on
   top of `baseStats` (re-derive `derivedStats` each round) or on top of `derivedStats`
   directly? Re-derive is cleaner conceptually but more expensive; direct
   `derivedStats` patch is what the JSON looks like it expects (`physicalAttack +1`).
   > Your answer: Effects that effect stats should be explicit in the status effect. Weaker effects should effect specific derived stats, medium effects should effect base stats (and thus effecting multiple derivedStats), and high teir effects should be a mix of both or higher specific stats.

2. **Stat-mod intensity scaling.** `rollModifierPerIntensity` scales with intensity but
   `statModifiers` do not. Should they? If yes, scale every stat mod, or only flat
   ones (not multipliers)?
   > Your answer: Yes, they should. For now, I think this should be fine but should require rebalancing later on.

3. **Multiplier composition.** `buff_critical_damage_up` and `buff_max_hp_up` use
   multipliers (`×1.5`, `×1.25`). When two multipliers stack, do they compose
   multiplicatively (1.5 × 1.25 = 1.875) or additively (1 + 0.5 + 0.25 = 1.75)?
   > Your answer: Additively

4. **`damageOverTime.damagePerRound` — when does it tick?** Round start (before
   action), round end (after action), or both? And does it scale with `intensity`
   like regen does?
   > Your answer: Combat should move in phases and different effects should tick at different phases (ie. health regen at round start, poison at round start, bleed at round end, etc.)

5. **DoT damage type.** Each DoT effect declares a `damageType` (`body`/`mind`/`heart`).
   Does the defender's matching defense stat reduce DoT damage, or is DoT a flat tick
   that bypasses defense entirely?
   > Your answer: DoT damage should not be resisted, no. But in the future, entities should be immune to specific DoT damageTypes. For now, just let DoT damage be static based on "intensity".

6. **Negative `healthPerRound` (drain).** Should `debuff_disease`'s `-1/round` be
   applied via the same `applyRegen` (with a sign change) or via a dedicated drain
   path? And does drain interact with damage reduction?
   > Your answer: I don't know but I would like it to be unique in some way vs. poison vs. bleed, etc.

7. **`canAct` precedence.** When multiple action restrictions stack
   (`skipTurn` from stun + `forcedStance: heart` from charm), what wins?
   - Default proposal: `skipTurn` wins outright. `forcedStance` and `blockedStances`
     are merged: forced stance wins; blocked stances are then filtered out.
   > Your answer: Default proposal accepted. Implemented in `src/Combat/effect-modifiers.ts:canAct()` with precedence: (1) `skipTurn` wins outright — bearer loses action regardless of stance; (2) `forcedStance` overrides requested stance and trumps `blockedStances`; (3) if requested stance is blocked, action is blocked. This ensures reliable resolution when multiple restrictions stack. 

8. **`advantageModifier` interaction with type advantage.** If a buff grants
   `advantage` on `body` rolls but the matchup gives `disadvantage`, do they cancel,
   add (so net `+0`), or does the granted advantage override?
   > Your answer: For now, the advantage should override. But leave a comment near that logic to propose "If unbalanced, have override canceled"

9. **Mana regen.** Should `regeneration.manaPerRound` mirror health regen (per-round,
   intensity-scaled, capped at `maxMana`)? Any mana-tied effect blocked from being
   negative?
   > Your answer: No — the engine dropped the "mana" abstraction entirely.
   > `RegenerationConfig` in `src/Effects/types.d.ts` ships with only
   > `healthPerRound`, and `grep -rn mana src/` returns no hits. Skill /
   > consumable economics now flow through `combatResources` (heart / body /
   > mind / fallacy / paradox tokens — see Spec 04 + Spec 05b), which are
   > generated by basic actions each round and spent by skills / items.
   > There is no out-of-combat pool to regenerate, so the question is moot;
   > if a future tier of skills wants a passive resource trickle, add a
   > new `resourceGrantPerRound` field to `RegenerationConfig` rather than
   > resurrecting `manaPerRound`.

10. **Cleanse / dispel scope.** `buff_cleanse` removes "debuffs"; `debuff_dispel`
    removes "buffs". Do these:
    - Remove **all** of the type, **N** randomly, or only **non-Tier-3**?
    - Are Tier 1 self-buffs (Ad Baculum, Vital Empathy) cleansable? Probably not.
    > Your answer: It depends on the teir of the cleanse/dispel effect, correct.

## Proposed approach

If you have no strong overrides, the AI will implement in this order. Each entry is a
self-contained commit on the spec branch.

1. **`removeEffect(effects, effectId)`** in `Effects/index.ts` + tests. Used by the
   later cleanse/dispel commits.
2. **`getActiveEffectModifiers(effects): AggregatedModifiers`** — single pass over
   `effects` returning `{ statDeltas, defenseDelta, advantageGrants, advantageDenies,
   restriction, dotTotal, regenTotal }`. Pure; tested in isolation.
3. **`canAct(effects)`** — wraps `getActiveEffectModifiers` and applies the
   precedence rule from Q7. Tests for stun + charm + silence interactions.
4. **Wire `statModifiers` and `defenseModifier`** into combat math:
   - Add a `getEffectiveStats(combatant)` helper that re-derives stats from base +
     modifier deltas (per Q1/Q2/Q3).
   - Update `getAttackStat` / `getDefenseStat` / `getResistStat` to call it.
5. **`processDamageOverTime(effects)`** + integration into round-start in the combat
   CLI. Tests for poison stack + bleed + intensity scaling.
6. **Negative regen / drain** — extend `applyRegen` to handle negative
   `healthPerRound` per Q6, or split into `applyDrain` if the answer says so.
7. **`processRoundStartEffects(state)`** — orchestrate `applyRegen` + DoT + tick +
   expiry into one call so the CLI shrinks. Tests covering ordering.
8. **Cleanse / dispel mechanics** — `buff_cleanse` and `debuff_dispel` per Q10.
9. **`advantageModifier` wiring** — fold into the existing advantage resolver per Q8.
10. **Mana regen** — only if Q9 keeps it in scope.
11. **Update `docs/effects.md`** — flip every "PENDING" row to "LIVE" with the
    function reference.

## Acceptance checklist

- [x] All 10 questions in section (4) are answered.
- [x] Each pending payload field has a consumer in `src/Combat/`.
- [x] `processRoundStartEffects` is called from the combat CLI; the CLI no longer
      open-codes regen + tick.
- [x] `npm test` passes with at least one new test per wired field.
- [x] `npm run combat` shows DoT damage, stat-modifier-driven roll changes, and
      `skipTurn` actually skipping a turn (manual confirmation video attached to
      the PR).
- [x] `docs/effects.md` "Implementation Status" tables reflect reality.

## Out of scope

- `processWorldEffectTick` for hazards while exploring — covered in Spec 08.
- Skills inflicting effects via `combatEffects` — covered in Spec 04.
- Equipment-driven `passiveEffects` — covered in Spec 05.

## Post-spec engine extensions

### Phase 44 — `Effect.sourcedFromCell?: string` + 3 fallacy effects

Phase 44 (`87cfa7e` + `06f5ffe` + closing) extended the `Effect` type
with an optional `sourcedFromCell?: string` field — a kebab-case
`PhilosophicalAlignmentCell.id` that lets consumers trace a status
effect back to its philosophical origin via
`philosophicalAlignmentLibrary` (Spec 14 / Phase 42). Three new
fallacy-themed status effects ship in the library with the field
populated:

| Effect ID | Source cell | Kind |
|---|---|---|
| `debuff_no_true_scotsman` | `logic-pessimistic-transcendent` | debuff |
| `buff_special_pleading` | `faith-optimistic-individual` | buff |
| `debuff_category_error` | `mid-pessimistic-transcendent` | debuff |

The field is purely additive — legacy effects without a pin behave
exactly as before. Cross-link table at `docs/effects.md` § "Philosophical
fallacy payloads (Phase 44)" + `docs/skills.md` § "Philosophical fallacy
payloads (Phase 44)" for the matching Tier 3 skill payloads that apply
these effects.

### Phase 48 — verified `statModifiers` + intensity scaling

Phase 48 (`c892801` + closing) was an audit-honesty + coverage pass:
the runtime aggregation surface this spec demands (`statModifiers`
applied to `derivedStats` / `nonCombatStats` / `defenseDelta` with
intensity scaling) was already shipped pre-loop at
`src/Combat/effect-modifiers.ts` (`getActiveEffectModifiers` +
`getEffectiveStats`). Phase 48 pinned the consumer-facing stat
accessors with 8 hermetic cases at
`src/Combat/e2e/effect-stat-modifiers.engine.test.ts` covering flat
derived-stat buffs / debuffs, base-stat re-derivation, intensity
scaling for buffs + debuffs, `defenseModifier` + `statModifiers.physicalDefense`
stacking on `getDefenseStat`, and multiplier additive composition. The
Knowledge-Gaps Q8 + Q9 rows flipped from "Queued for Phase 48" to
"Resolved at Spec 01 (pre-loop). Verified at Phase 48 (`c892801`)."
`docs/effects.md` "Runtime aggregation (pre-loop, verified at Phase 48)"
subsection documents the aggregation pipeline.

### Phase 156 — the interaction engine goes live

The Phase 142 status-effect interaction engine (`src/Effects/interactions.ts`
+ `src/Effects/amplification.registry.ts`) shipped exported and unit-tested
but was **dead-on-arrival**: the live combat resolver never called
`evaluateInteractions`, and `EFFECT_INTERACTIONS` referenced effect ids that
did not exist in the library (`debuff_acid`, `debuff_vulnerability`,
`buff_focus`, `buff_shield`, `buff_inspire`, …), so no combo could fire even
if wired in.

Phase 156 makes it real and correct:

- **Registry repaired** — every combo trigger/target now resolves against the
  live library. Dead ids were repointed onto real effects
  (`debuff_mind_mark` → `tier1_mind_mark`, `buff_shield` → `buff_barrier`,
  `debuff_drain`/`debuff_weakness` → `debuff_disease`/`debuff_exhaustion`,
  `buff_inspire`/`buff_rally` → `buff_all_stats_up`/`buff_buff_duration_up`).
- **Three new combo-enabling effects** added to the libraries: `debuff_acid`
  (armor-melt DoT, "Aqua Regia"), `debuff_exposure` (defense breach, "Gödel's
  Exposure"), `buff_focus` (concentration, "Husserl's Bracket"). Each is wired
  into at least one combo.
- **Live DoT amplification** — `getActiveEffectModifiers`
  (`src/Combat/effect-modifiers.ts`) now evaluates `amplify_damage` combos in
  the same pass and scales the matching effect's `dotStart`/`dotEnd`. Only the
  transient aggregated total is touched — never persisted
  `ActiveEffect.intensity` — so there is no double-application with
  `applyInteractionResult`. The multiplier is clamped to
  `INTERACTION_AMPLIFICATION.MAX_DAMAGE_MULTIPLIER` (2.0), largest-combo-wins
  per effect. Because every DoT consumer reads these fields, the boost flows
  into round events and the DoT-erosion resolution route for free.
- **Breadth preserved** — only `amplify_damage` combos auto-apply live; the
  `amplify_duration` / `amplify_intensity` / `grant_advantage` /
  `reduce_resistance` combos remain reachable via the exported
  `evaluateInteractions` API so control/buff status play is not eclipsed by a
  DoT-only buff.
- **Anti-regression guard** — `src/Effects/e2e/status-depth.engine.test.ts`
  asserts `validateInteractions(liveIds)` returns `[]`, failing the build if a
  future combo ever references a missing effect again. Live amplification is
  proven through the resolver at
  `src/Combat/e2e/status-combo-amplification.engine.test.ts`.
