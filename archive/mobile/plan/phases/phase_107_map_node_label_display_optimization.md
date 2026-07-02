# Phase 107 — Map node label display optimization

> Status: pending. Promoted from `plan/PHASE_CANDIDATES.md` via oversight 2026-06-05 so `/march` has a concrete mobile queue.

## Source

Promoted from mobile phase candidates after T ordered all five live candidates promoted.

## Problem

User-spotted exploration UX clutter: the map labels every node even when the node is already visited or not currently actionable.

## Scope

1. Update exploration map rendering so labels appear only for nodes that are both unvisited and available as choices.
2. Keep node hit areas and accessibility labels usable even when the visible label is hidden.
3. Use existing presenter/map state where possible; do not invent alternate availability rules in the component.
4. Add/adjust focused tests for visited, unavailable, and available-unvisited nodes.

## Acceptance checklist

- [ ] Node labels are visible for unvisited available nodes.
- [ ] Visited nodes do not show clutter labels.
- [ ] Unavailable nodes do not show clutter labels.
- [ ] Accessibility remains adequate for tappable nodes.

## Verification

- `npm run verify` plus focused exploration tests; run `npm run verify:visual` if visual smoke covers exploration.

## Out of scope

- Production deployment.
- New mechanics design beyond the current `axiomancer-mechanics` package contract.
- Broad visual redesign unless explicitly named in scope.
