# Phase 126 — Hazard deck screen and remove-card grid

## Source

T accepted the persistent Hazard deck screen recommendation on 2026-06-15 and added a removal requirement tied to mechanics reward doctrine:

- Mobile needs an overlay of all cards in the deck in a grid so the player can choose which card to remove.
- Hazard also needs a durable deck/library screen outside the encounter.

## Goal

Let players inspect the persistent Hazard deck as a buildcraft object and, when mechanics offers card removal, choose the removed card from a clear grid.

## Scope

1. Add a persistent Hazard deck/library surface outside the active encounter.
   - Can live under SELF, inventory, event/hazard, or a dedicated route if the repo's navigation doctrine supports it.
   - Show starter cards, reward cards gained, CRACK/scar cards, color distribution, keyword distribution, and deck identity summary when available.
2. Add a reusable deck-grid overlay for remove-card selection.
   - Shows every current deck card in a grid.
   - Tap opens existing card-detail/keyword view where useful.
   - Select + confirm removes the chosen card through mechanics-owned action/state when available.
3. Preserve mobile's thin-client law.
   - Do not implement deck mutation rules locally.
   - If mechanics has not yet exposed remove-card state/action, ship the inspect-only deck screen and document the exact blocked integration point.
4. Make the screen usable on phone.
   - Search/filter is optional; grouping by color/archetype/scar is acceptable if simple.
   - CRACK/scar cards must be visually legible.

## Non-goals

- Do not rebalance Hazard cards.
- Do not create a full deckbuilder outside mechanics authority.
- Do not expose hidden reward-slot labels such as fix/payoff/risk.

## Acceptance criteria

- [ ] Player can open a Hazard deck/library screen outside an encounter.
- [ ] Deck screen shows all cards and at least color/card-type distribution.
- [ ] CRACK/scar cards are distinguishable.
- [ ] Remove-card grid overlay lists all deck cards when the mechanics offer requires removal.
- [ ] Remove flow requires confirmation and calls engine-owned action/state when available.
- [ ] Graceful blocked state exists if mechanics lacks remove-card API.
- [ ] Component/presenter tests cover deck screen data, grid selection, confirmation, and blocked state.
- [ ] Visual/smoke evidence or exact blocker is recorded.

## Verification

Run:

- focused Hazard deck screen / overlay Jest tests
- `npm run typecheck`
- `npm run verify`
- `npm run verify:visual` or exact visual-smoke blocker
