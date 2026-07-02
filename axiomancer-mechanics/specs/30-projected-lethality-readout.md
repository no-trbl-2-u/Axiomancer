# Spec 30 — Projected Lethality: The Foreseeable Kill

> **Status:** Draft — handoff. Answer §4, then `Spec 30 is ready, please implement.`
> **Depends on:** Spec 25 (Hazard-Pattern Combat) · Phase 125 (DoT-erosion projection) · Spec 25 §7 (presentation).
> **Theme inspiration:** Slay the Spire (you *see* poison tick the enemy down) + Into the Breach (full information: you can see you've already won). Hades' visible Doom counter.

## Goal

Make the kill **foreseeable**. Surface the already-computed Phase 125
`pendingDotDamage` ("damage your stacked DoT *will* deal over its remaining
duration") as a live readout on the enemy and the DoT track — "lethal in N
phases / X pending" — plus a *Detonate / Finish* affordance once the enemy is
lethal-in-flight. Erosion should read as a decisive, satisfying, telegraphed
conclusion, not invisible accumulation.

## Why now / dependencies

- **Unblocks:** the legibility gap. The engine *already computes* the lethality
  projection (Phase 125 `analyzeDotErosion`: `pendingDotDamage`, `roundsToKill`)
  but never shows it. The Spec 25 e2e even noted the DoT track "doesn't visibly
  advance" mid-phase because the cumulative jump happens between phases — so the
  player can't *feel* the erosion winning.
- **Depends on:** `effect-resolution.ts` (the projection), Spec 25's
  `CombatEncounterState` / pressure tracks / event stream, and the §7 board.

## Current state

- `effect-resolution.ts` `analyzeDotErosion` computes `pendingDotDamage`
  (`Σ damagePerRound × intensity × remainingDuration`) and `roundsToKill`
  (`ceil(effectiveHp / dotPerRound)`) — internal, never surfaced to the engine
  state or the UI.
- Spec 25 surfaces the *cumulative* `dot` track vs `dotThreshold`, but **not**
  the *projected* lethality (what the current stacks will do if the player does
  nothing). The two are different and the second is the satisfying one.
- The between-phases DoT ticks are emitted as labeled `dot-tick` events
  (§7.5) but there's no "you've already won" foresight.

## Open questions

1. **What's the headline readout?** Options: "**Lethal in N phases**"
   (roundsToKill), "**X pending DoT** vs `enemyHP`", a projected-fill ghost on
   the DoT track showing where it lands after pending ticks, or all three.
   Recommended: a pending-damage ghost on the enemy HP bar + a "lethal in N"
   label once `pendingDotDamage ≥ enemyHP`.
   > Your answer:

2. **Does foresight trigger an early end?** Phase 125 already lets a
   demonstrably-lethal DoT package resolve to victory *now* (the "witness gap"
   fix). Should the UI offer a **"FINISH"** button that fast-forwards the
   guaranteed ticks to the victory animation (skip the grind), or just animate it
   automatically? (Recommended: a Finish affordance — player-controlled payoff.)
   > Your answer:

3. **Should the projection feed the `dot` track, or sit beside it?** Keep the
   track = *committed* pressure and show pending as a distinct *ghost/overlay*
   (recommended — two truths: what you've banked vs what's in flight), or fold
   pending into the track fill?
   > Your answer:

4. **Is this engine state or pure presentation?** The projection is engine math
   (Phase 125). Should `CombatEncounterState` expose a `lethality:
   { pendingDot, roundsToKill, isLethalInFlight }` field (engine truth, mobile
   renders), or should mobile compute it from the enemy's effects via an exported
   helper? (Recommended: expose an engine selector `projectLethality(state)` so
   mobile stays presentation-only per ADR-0001/0003.)
   > Your answer:

5. **Control-track foresight too?** Should there be an equivalent "saturation in
   N" readout for the Control → mercy path, or is foresight DoT-only for v1?
   > Your answer:

6. **Catalyst interaction (Spec 26).** If Spec 26 ships, a Catalyst spike should
   visibly *jump* the projected lethality (the payoff moment). Confirm the
   readout updates live on a detonation.
   > Your answer:

## Proposed approach

1. Engine: export `projectLethality(state)` (wrap Phase 125's `analyzeDotErosion`
   for the encounter's enemy) returning `{ pendingDot, roundsToKill,
   isLethalInFlight }`; optionally cache it on `CombatEncounterState` after each
   play. Add a `lethality-updated` `CombatEvent`.
2. If §4 Q2 = Finish affordance: add `finishCombat(state)` that, when
   `isLethalInFlight`, fast-forwards the locked-in ticks to a `victory` outcome
   with the full DoT attribution.
3. Mobile (presenter + board): a pending-DoT ghost on the enemy HP bar, a
   "lethal in N" label, and (per §4 Q2) a FINISH button. Live-update on every
   play / `dot-tick` / catalyst event. Engine owns the math.
4. Make the between-phase `dot-tick` animation read the projection so each tick
   visibly closes the gap (the "watch it die" beat).
5. `/combat-tuning`: no new numeric levers, but the witness test should assert
   `projectLethality` is monotonic and fires the early-resolution at the Phase
   125 threshold.

## Acceptance checklist

- [ ] All §4 questions answered.
- [ ] The enemy + DoT track show a live, correct pending-lethality readout
      ("lethal in N" / pending vs HP) sourced from engine math.
- [ ] Once lethal-in-flight, the kill resolves decisively (auto-animate or
      FINISH per §4 Q2) with full DoT attribution.
- [ ] The readout updates live on plays, ticks, and (if present) Catalyst spikes.
- [ ] Mobile stays presentation-only — the projection comes from an engine
      selector, not a mobile reimplementation.
- [ ] Hermetic e2e: stack DoT → readout shows "lethal in N" → Finish → victory;
      the projection matches Phase 125's resolution.
- [ ] `npm run verify` clean; mobile `verify` + an HP-bar/track ghost test.

## Out of scope

- Changing the Phase 125 resolution thresholds (read-only consumer of them).
- Direct-damage / HP-attrition foresight (this is the *status* erosion readout).
- Control saturation foresight unless §4 Q5 opts in.
