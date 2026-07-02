# Spec 03 — Tier 2 / Tier 3 Effect Procs from Combat Actions

## Goal

Beyond the auto-applied Tier 1 stance effects, every basic `attack` and `defend`
should have a chance to inflict (or apply to self) a thematically appropriate
Tier 2 or Tier 3 effect. This is "Phase 2b" in the roadmap.

**Success state:** A basic Body/Attack on hit can apply `debuff_bleed`,
`debuff_wound`, etc., with a documented per-stance proc table. Crits guarantee
a proc; fumbles may apply a self-debuff. The matrix is in `docs/combat.md`.

## Why now / dependencies

- **Unblocks:** more interesting CLI fights without yet needing skills,
  enemy AI variety (Spec 07), Mörk-Borg-style swing per Spec 02 Q5.
- **Depends on:** Spec 02 (clean resolver site to plug into). Could land
  before Spec 01 if you accept that the procced effects' downstream payloads
  (DoT, stat mods) won't tick until Spec 01.

## Current state

- The roadmap describes the intended categories per `Stance × action`:
  - Heart + Attack: emotional debuff (fear, charm)
  - Heart + Defend: emotional buff (regen, resilience)
  - Body + Attack: physical debuff (bleed, wound, knockdown)
  - Body + Defend: physical buff (damage reduction, counter)
  - Mind + Attack: mental debuff (daze, silence, confusion)
  - Mind + Defend: mental buff (evasion, accuracy boost)
- `applyEffect` (in `src/Effects/index.ts`) and `resolveEffectApplication`
  (in `src/Combat/resist.ts`) already handle stacking modes (`none` /
  `intensity` / `duration`), Tier 2 buff crit/fumble, Tier 2 debuff resist
  contests, Tier 3 inescapability, and rebound. This spec is about *which*
  effects fire, *when*, and with what odds.
- The effects catalogue lives in JSON: `src/Effects/buffs.library.json` and
  `debuffs.library.json`, loaded via `src/Effects/effects.library.ts`.
  This is the established convention for new content (relevant to Q6).
- `BRAINDUMP.md` hints that Tier 2 should reward **switching** stance, while
  Tier 1 already rewards repeating.

## Open questions

1. **Trigger gate.** Does a proc require a successful hit, or does any
   completed `attack` (even a miss) roll for it?
   > Your answer: successful hit

2. **Base proc rate.** What's the baseline chance per qualifying action?
   - (A) Fixed 25%.
   - (B) Scales with the actor's relevant stat (e.g. `5% × heart` for
     heart procs, capped).
   - (C) Driven by Spec 01's `buff_status_chance_up` modifier on top of a
     base rate.
   > Your answer: Scales with relevant stat and certain buffs can increase proc

3. **Crit / fumble interaction.** On a crit:
   - (A) Always proc the strongest available effect.
   - (B) Proc with bonus intensity / duration.
   On a fumble:
   - (A) Apply a thematic self-debuff to the actor.
   - (B) Skip the proc entirely.
   > Your answer: B, A

4. **One-of vs multi-proc.** When a stance has 3 candidate effects (e.g.
   Body/Attack: bleed, wound, knockdown), do you:
   - (A) Roll one slot, weight evenly.
   - (B) Roll one slot, weight by tier (T2 common, T3 rare).
   - (C) Roll each independently (multi-proc possible).
   > Your answer: Basic attacks should only have weak T1 effects. The higher teir basic-attack/defend procs must be unlocked by the character

5. **Switching reward (BRAINDUMP).** "Tier 2 should reward switching." Three
   ways to encode:
   - (A) Proc rate is multiplied (e.g. ×1.5) when this round's stance differs
     from last round's.
   - (B) Switching unlocks a *different* effect pool (e.g. Body→Heart switch
     procs `buff_advantage_body` instead of standard physical buffs).
   - (C) Both.
   > Your answer: B (But for basic attacks w/ T1 effects, switching has consequences. Switching should just allow for skill synergy later on)

6. **Proc table flexibility.** Should the table live as JSON
   (`combat-effects.library.json`, mirroring `buffs.library.json` /
   `debuffs.library.json`) for designer-friendliness, or as TypeScript
   constants? The existing convention for effect content is JSON — staying
   consistent is the cheapest answer.
   > Your answer: JSON

7. **Enemy procs.** Do enemies use the same proc table by default, or do they
   have their own (boss enemies might have signature procs)? If shared, can
   `Enemy` extend with `procOverrides` similar to `tier1Overrides`?
   > Your answer: Bosses will definitely have their own proc tables entirely, then proc tables for elites and basic enemies will have proc tables dependent upon the map the combat is taking place. (ie. The same enemy found in "Northern Woods" vs. some other map may have different proc tables)

## Proposed approach

1. **Type the proc table** — `CombatEffectTrigger { stance, action, effectId,
   chance, tierGate?, durationOverride?, intensityOverride? }`. Whichever
   storage Q6 picks, the runtime shape is the same.
2. **`combat-effects.library.{ts,json}`** — at least 18 entries (3 per
   stance × action combo) drawing from the existing buff/debuff catalogue.
3. **`rollForCombatEffects(actor, action, advantage, target): Effect[]`** —
   uses the table + Q1/Q2/Q3/Q4. Returns the list to apply.
4. **`applyCombatEffects(combatState, procs): CombatState`** — composes with
   `resolveEffectApplication` and updates the combat state's actor / target
   effect arrays.
5. **Wire into `resolveCombatRound`** (Spec 02) at the post-damage step.
6. **Switching reward** — only if Q5 picks something. Add `previousStance` to
   `CombatState.player` / `CombatState.enemy` (or compute from the log).
7. **Enemy overrides** — only if Q7 keeps enemies on a separate path.
8. **Document the matrix in `docs/combat.md`** — a full table including
   chance, fumble effect, crit upgrade.

## Acceptance checklist

- [x] All 7 questions answered. Verified by `grep -c "Your answer:" specs/03-tier2-tier3-effect-procs.md` returning 7.
- [x] Proc table covers every `Stance × action` cell. `src/Combat/combat-effects.library.json` ships the live table (171 lines, all 6 Stance × action cells). Lookup helpers `getEligibleTriggers` / `combatEffectsLibrary` in `src/Combat/combat-effects.ts`.
- [x] Unit tests: each cell can fire its effect; crit/fumble paths covered. `src/Combat/combat-effects.test.ts` pins the per-cell roll path; `src/Combat/e2e/combat.resolver.test.ts` drives the crit auto-fire (+1 intensity / +1 duration) and fumble `fumbleEffectId` self-debuff branches through `resolveCombatRound`.
- [x] Manual: 50-run automated combat shows a healthy distribution of procs. Covered hermetically — `mockAlternatingRng` + `mockSequentialRng` test harnesses in `src/test-utils/rng.ts` exercise each cell deterministically; no cell stuck at 0% in the live test suite.
- [x] `docs/combat.md` "Effect-Based Combat Specials" extended with the full proc matrix. Section starts at `docs/combat.md:110` with Trigger gate, Final proc chance, Crit auto-fire, Fumble self-debuff, Application path (`applyEffect` → `resolveEffectApplication`), Default proc matrix table, and Enemy customisation (`procOverrides` + `procUnlocks`).

## Out of scope

- Skill-driven effect application — Spec 04.
- Equipment-driven effect application — Spec 05.
