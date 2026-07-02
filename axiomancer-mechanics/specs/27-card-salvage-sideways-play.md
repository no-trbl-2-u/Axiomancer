# Spec 27 — Card Salvage: Cards Used Multiple Ways

> **Status:** Draft — handoff. Answer §4, then `Spec 27 is ready, please implement.`
> **Depends on:** Spec 25 (Hazard-Pattern Combat) · the Hazard salvage mechanic (`src/World/Hazard/`).
> **Theme inspiration:** Mage Knight — *every* card can be discarded sideways for a generic +1, so there are no dead cards and hand management is the puzzle.

## Goal

Let the player **spend any combat card sideways** for a small generic benefit
instead of playing its top/bottom action. A wrong-stance, unaffordable, or
otherwise awkward card becomes a die or a sliver of pressure rather than dead
weight — deepening the per-phase hand puzzle and smoothing the die economy.

## Why now / dependencies

- **Unblocks:** the "near-dead card" problem. In Spec 25 a card you can't power
  (no matching die, disadvantage stance, no banked token) is reduced to its weak
  free top action; off-stance cards feel like draws wasted. Mage Knight's
  no-dead-cards rule is what makes its hand a puzzle rather than a stat check.
- **Depends on:** Spec 25's hand (`CombatHandEntry`), dice (`combat.dice.ts`),
  and pressure (`combat.pressure.ts`). The Hazard engine already implements this
  exact idea (`HazardSalvage`, `discardHazardCard`) — this spec ports the
  *pattern*, not the code.

## Current state

- `combat.engine.ts` plays a card via `playCombatCard(state, ref, useBottom)` —
  there is **no discard-for-benefit path**. `processBetweenPhases` discards the
  whole hand and redraws 5, so unplayed cards are simply lost with no upside.
- The Hazard engine's `discardHazardCard` grants a `HazardSalvage`
  (`{ type: 'progress' }` rides this round, or `{ type: 'mana' }` mints a
  temporary die of the card's colour). That is the reference contract.
- `combat.cards.ts` already classifies every card's stance + verb class, so a
  salvage benefit can be keyed off the card's stance/track.

## Open questions

1. **What does salvage grant?** Recommended (mirror Hazard): salvaging a card
   mints a **temporary die of the card's stance colour** (`temporary: true`,
   expires between phases) — directly feeding the die economy + the
   self-reinforcing loop. Alternative/secondary: a flat `+1` to the card's
   natural pressure track *this phase only*. Pick one, or allow the player to
   choose at salvage time.
   > Your answer:

2. **Is salvage free, or does it cost the play?** In Hazard, salvage is the
   card's *alternative* to playing it — one or the other, and the card leaves the
   hand. Same here? (Recommended: yes — salvage consumes the card, no die spent,
   strictly weaker than a good play.)
   > Your answer:

3. **Any limit per phase?** Unlimited salvage could trivialise the die economy
   (salvage 3 off-stance cards → 3 dice). Cap at N salvages/phase, or let
   momentum/threat tension self-limit it? (Recommended: cap at 2/phase to start;
   tune via `/combat-tuning`.)
   > Your answer:

4. **Retreat + Befriend exceptions.** Should the synthetic Retreat card and the
   Befriend card be salvage-eligible, or excluded (they have bespoke effects)?
   > Your answer:

5. **Mobile interaction.** Tap-based board (Spec 25) — is salvage a long-press /
   a swipe-to-discard / a dedicated "SALVAGE" button per card? It must be
   undo-safe and clearly previewed (what die/pressure you'll get).
   > Your answer:

## Proposed approach

1. Add `salvageCombatCard(state, { uid }, rng?)` to `combat.engine.ts`: validate
   the card is in hand + salvage-eligible + under the per-phase cap; mint the
   benefit (temp die via `combat.dice.ts`, or pressure via `combat.pressure.ts`);
   move the card to discard; emit a `{ kind: 'card-salvaged', cardId, benefit }`
   `CombatEvent`. Export it from the barrels.
2. Track `salvagesThisPhase` on `CombatEncounterState` (reset in
   `processBetweenPhases`).
3. Define salvage eligibility + benefit on the card view in `combat.cards.ts`
   (so the UI can preview it) — keyed off stance/track per §4.
4. Mobile: a salvage affordance on each hand card (per §4 Q5) + a preview chip;
   wire to a new `salvageCombatCardAction`-equivalent in the screen's handlers.
   Presenter exposes `salvagePreview` per card.
5. `/combat-tuning`: add the per-phase salvage cap + benefit magnitude to the
   tunable surface.

## Acceptance checklist

- [ ] All §4 questions answered.
- [ ] Any eligible hand card can be salvaged for the chosen benefit; the card
      leaves the hand; no die is spent; the per-phase cap is enforced.
- [ ] A minted salvage die is `temporary` and expires in `processBetweenPhases`.
- [ ] Salvage is always strictly weaker than a good play of the same card.
- [ ] Hermetic e2e under `src/Combat/e2e/`: salvage an off-stance card → mint a
      usable die → power an otherwise-unaffordable card with it.
- [ ] `npm run verify` clean; mobile `verify` + a board test for the affordance.

## Out of scope

- Reworking the draw/redraw cadence (Spec 25's discard-all-and-draw-5 stays).
- Persistent (cross-phase) salvage benefits beyond a temporary die.
- A trash/deck-thinning meta-economy (that's Spec 28's curation layer).
