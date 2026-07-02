# Spec 26 — Catalyst: Multiplicative Status Scaling

> **Status:** Draft — handoff. Answer §4, then `Spec 26 is ready, please implement.`
> **Depends on:** Spec 25 (Hazard-Pattern Combat) · Spec 01 (effects engine) · Phase 125 (DoT erosion).
> **Theme inspiration:** Slay the Spire's *Catalyst* (doubles current Poison: 15 → 135 with Burst) — the exponential payoff that makes the poison build legendary.

## Goal

Add a **Catalyst** card class to Hazard-Pattern Combat: a card whose payoff is
*multiplying the DoT already stacked on the enemy* rather than adding a fixed
amount. Build stacks across phases, then detonate for an explosive, legible
spike on the DoT Erosion track. This gives the system the "watch the number
explode" combo moment it currently lacks.

## Why now / dependencies

- **Unblocks:** the single biggest engagement gap surfaced in the Mage
  Knight / Slay-the-Spire comparison — the new combat's pressure is strictly
  *linear* (`effectPressure` = `damagePerRound × intensity`), so there is no
  build-then-detonate decision and no exponential payoff. Catalyst is the
  highest-leverage addition.
- **Depends on:** Spec 25's pressure tracks (`combat.pressure.ts`), the card
  adapter (`combat.cards.ts`), and the effects engine's `ActiveEffect.intensity`
  on the enemy.

## Current state

- `combat.cards.ts` `effectPressure(effect, intensity, duration)` returns a
  *linear* `{ track, amount }`. `CombatVerbClass` does **not** include
  `amplifier` — Spec 25 §6 named it but only the core verb classes shipped.
- DoT pressure is `damagePerRound × intensity`; `ActiveEffect.intensity` is
  **capped at `MAX_EFFECT_INTENSITY = 10`** (`game-mechanics.constants.ts`), so
  a naïve "double the intensity" would saturate after one or two plays. The
  Catalyst design must work *around* the intensity cap.
- The engine already computes Phase 125 `pendingDotDamage`
  (`damagePerRound × intensity × remainingDuration`) in `effect-resolution.ts`
  — the natural quantity to multiply/detonate.

## Open questions

1. **Multiply intensity, or detonate pending damage?** Option A: a Catalyst
   *temporarily* lifts the DoT intensity cap (e.g. to 20) and doubles current
   intensity — keeps the DoT ticking bigger for its remaining duration. Option B
   (recommended): Catalyst is a one-shot **detonation** — it reads the enemy's
   current `pendingDotDamage`, multiplies it by N, dumps the result straight onto
   the `dot` track (a burst), and optionally consumes the DoT stacks. B sidesteps
   the intensity cap and gives a clean, legible spike.
   > Your answer:

2. **Multiplier magnitude + Burst interaction.** ×2 base, ×3 for an upgraded
   (`r_`) Catalyst? Should a separate "Burst/Overload" amplifier double the
   *next* Catalyst (StS's Burst + Catalyst = ×6)? Or keep a single multiplier to
   start and add Burst in a follow-up?
   > Your answer:

3. **Cost + gate.** Catalyst is a high-tier paradox skill — what's its die cost
   (1 mind die + a banked paradox token, per the Tier-3 gate)? Should it require
   a *minimum* existing DoT to play (no fizzle on an un-poisoned enemy), or
   always play but do nothing without stacks?
   > Your answer:

4. **Does it touch Control?** Catalyst as specced multiplies DoT only. Should a
   sibling "Saturate" card multiply the Control track (accelerate the mercy
   path), or is multiplicative scaling DoT-exclusive for now?
   > Your answer:

5. **Attribution.** The post-combat summary (`buildCombatSummary`) attributes
   DoT damage per card. Should a detonation credit the Catalyst card, the
   original DoT card, or split? (Recommended: credit the Catalyst for the *spike*
   and keep the DoT card's tick credit separate — the summary should make the
   combo legible.)
   > Your answer:

## Proposed approach

If you have no overrides, the AI will implement in this order:

1. Add `amplifier` to `CombatVerbClass` (`combat.encounter.types.ts`) and a
   `SkillSpecialMechanic` variant `{ kind: 'catalyst'; multiplier: number;
   consumesStacks?: boolean }` (`Skills/types.ts`) — the effects engine stays
   untouched; the *combat engine* interprets it.
2. In `combat.engine.ts` `playBottomAction`, when the played card carries the
   catalyst mechanic: read the enemy's pending DoT (reuse the Phase 125
   projection), compute `spike = pendingDot × multiplier`, add it to
   `pressureTracks.dot` + `phaseProgress.dot`, emit a new
   `{ kind: 'catalyst-detonated', cardId, multiplier, spike }` `CombatEvent`,
   record attribution, and (if `consumesStacks`) clear/halve the DoT stacks.
3. Author 1–2 Catalyst skills in `skill.library.ts` (a base + an `r_` upgrade)
   with mechanic + cost per §4.3.
4. Mobile (`axiomancer-mobile`): render the detonation — a distinct
   `catalyst-detonated` animation on the DoT track (the spike), the verb glyph
   (✦/⚗), and a "×N" badge on the card. Presenter + board only; engine owns math.
5. Add the `catalyst` axis to `/combat-tuning`'s tunable surface (the multiplier)
   and a sim assertion that a build-then-detonate line out-paces flat DoT.

## Acceptance checklist

- [ ] All §4 questions answered.
- [ ] A Catalyst play multiplies accumulated DoT into a single, visible DoT-track
      spike; un-poisoned enemy → no-op (or gated), never a crash.
- [ ] The intensity cap is respected (no silent overflow); the chosen option
      (detonate vs temp-cap-lift) is the only path to >linear pressure.
- [ ] `buildCombatSummary` makes the combo legible (Catalyst named as the spike).
- [ ] Hermetic e2e under `src/Combat/e2e/` covers: stack → catalyst → DoT-erosion
      victory, and the no-stacks no-op.
- [ ] The balance-sim witness shows a catalyst line is competitive but not
      strictly dominant (no new single-card-spam).
- [ ] `npm run verify` clean; mobile `verify` + a board test clean.

## Out of scope

- Reworking the linear `effectPressure` base math (only the catalyst path is
  multiplicative).
- Control-track multiplication (deferred to §4 Q4 / a sibling spec).
- Raising the global `MAX_EFFECT_INTENSITY` for all effects (shared with legacy
  combat — do not touch).
