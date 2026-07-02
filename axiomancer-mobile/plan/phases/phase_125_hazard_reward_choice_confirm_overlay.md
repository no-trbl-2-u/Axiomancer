# Phase 125 — Hazard reward choice confirmation overlay

## Source

T corrected the Hazard UX doctrine on 2026-06-15:

- Tap any card to see keywords already exists and should remain the base interaction.
- Projections are already shown; the player hits Apply to apply them.
- Reward choice needs a confirmation step.
- Clicking a reward card should show an overlay with only the card, keywords, and archetype.
- The overlay may show current deck count, but must **not** show fix/payoff/risk labels.

## Goal

Make the pick-1-of-3 Hazard reward choice deliberate on mobile: preview first, then confirm. Prevent accidental reward selection and show only the information T wants surfaced.

## Scope

1. Update `RewardsOverlay` or its extracted reward-card child components.
2. On tapping a reward card, open a modal/overlay showing:
   - the full card face,
   - keyword glossary entries,
   - archetype / deck-focus label,
   - current deck count context where available.
3. Do **not** show hidden design labels such as `fix`, `payoff`, `risk`, in-focus, or off-focus.
4. Add a clear confirmation button in the overlay:
   - Confirm / Take card commits `claimHazardRewards(pickedCardId)`.
   - Back / Cancel returns to the three-card offer without committing.
5. Preserve Perfect-tier skip behavior where still legal.
6. If mechanics has not yet exposed archetype/deck-count data, add a presenter TODO and degrade gracefully without local rule simulation.

## Non-goals

- Do not add route-choice opening-hand hints.
- Do not duplicate existing projection/apply behavior.
- Do not redesign all card detail overlays outside the reward-choice context.

## Acceptance criteria

- [ ] Tapping a reward card previews it and does not immediately claim it.
- [ ] The preview overlay shows card + keywords + archetype (+ deck count if available).
- [ ] The preview overlay omits fix/payoff/risk and any hidden offer-slot labels.
- [ ] Confirm button is required to claim a card.
- [ ] Cancel/back returns to the reward offer unchanged.
- [ ] Jest coverage proves preview, confirm, cancel, and omitted-label behavior.
- [ ] Visual/smoke evidence or a clear blocker is recorded.

## Verification

Run:

- focused `RewardsOverlay` / Hazard reward Jest tests
- `npm run typecheck`
- `npm run verify`
- `npm run verify:visual` or exact visual-smoke blocker
