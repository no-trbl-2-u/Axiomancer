# Phase 149 — Hazard engagement: reward offers, scars, sub-quest drafting, and deck identity

## Source

T accepted Tobin's Hazard engagement recommendations on 2026-06-15 with one correction: the reward offer should not be "three random" or simply risk-exclusive. It should present:

1. one obvious benefit to the player's current deck focus,
2. one even stronger card outside the current deck focus,
3. one option to remove a card from the deck.

This phase captures that accepted direction as mechanics work. Mobile consumes the resulting contract in later UX phases.

## Goal

Make Hazard deck growth and failure memory readable, strategic, and player-owned. Hazard should become a deck-shaping ritual, not only a round-resolution puzzle.

## Scope

Implement the five accepted mechanics recommendations:

1. **Reward-offer archetype weighting**
   - Classify the current persistent Hazard deck by focus: FORCE-heavy, ESCAPE-heavy, Gold utility, Hex control, Scarred / CRACK-heavy, or mixed.
   - Reward offers must be curated rather than blind random draws.

2. **Visible deck scars**
   - Expose CRACK / dead-weight consequences as persistent deck-scar state or summary data.
   - Failure that adds a dead card must be visible to consumers as a burden/scar, not just another card id in a bag.

3. **Three-choice reward doctrine**
   - Slot A: obvious benefit to the player's current deck focus.
   - Slot B: stronger temptation outside the player's current deck focus.
   - Slot C: remove one card from the persistent Hazard deck.
   - The remove-card offer must expose enough card/deck data for mobile to present a grid selector.

4. **Sub-quest drafting**
   - Offer 2–3 candidate sub-quests before/around route choice and let the player accept one, instead of only rolling hidden ambient objectives.
   - Keep deterministic seed behavior and preserve current sim/test repeatability.

5. **Deck identity summaries**
   - Emit a concise post-Hazard deck summary suitable for UI/reporting: FORCE-heavy, ESCAPE-heavy, Gold utility, Hex control, Scarred / CRACK-ridden, or mixed.

## Non-goals

- Do not redesign Hazard route rules, dice economy, FORCE/ESCAPE thresholds, or card effects.
- Do not implement mobile overlays here.
- Do not change public API destructively; add new fields/functions where needed.

## Implementation notes

- Likely files: `src/World/Hazard/hazard.types.ts`, `hazard.deck.ts`, `hazard.rewards.ts` or equivalent, `hazard.engine.ts`, `hazard.tuning.ts`, and e2e/sim tests.
- Preserve the existing 150-card library and current reward catalogue unless evidence requires additive tags.
- The reward offer should be deterministic under the Hazard seed.
- Slot B may be higher rarity/impact than Slot A, but it must be outside the detected deck focus so temptation has a cost.
- Slot C is a deck-edit operation, not a card reward. It should be modeled explicitly so mobile does not fake card removal locally.

## Acceptance criteria

- [ ] Engine can classify a persistent Hazard deck into deck-focus summaries.
- [ ] Reward offer generation returns three typed choices: in-focus benefit, stronger off-focus temptation, and remove-card option.
- [ ] Removing a card from the Hazard deck is legal through engine-owned state/action, deterministic, and tested.
- [ ] CRACK/dead-weight additions surface as deck scars / burden summary data.
- [ ] Sub-quest drafting lets a player choose from 2–3 candidates and persists the chosen objective through the crossing.
- [ ] Hazard outcome/reward state exposes all data mobile needs without local rule simulation.
- [ ] Hermetic e2e coverage proves reward triad selection, remove-card flow, deck summary, scar surfacing, and sub-quest drafting.
- [ ] Existing Hazard A/B/playstyle harness remains green.

## Verification

Run:

- `npm test -- --run src/World/Hazard`
- `npm run hazard` or the closest existing Hazard CLI/sim evidence path if available
- `npm run verify`
- `npm run deploy:check`

Record any balance drift from the reward/sub-quest changes; if drift is material, leave a follow-up tuning candidate rather than hiding it.
