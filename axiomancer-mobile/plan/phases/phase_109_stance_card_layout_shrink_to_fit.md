# Phase 109 — Stance card layout shrink-to-fit

> Status: pending. Promoted from `plan/PHASE_CANDIDATES.md` via oversight 2026-06-05 so `/march` has a concrete mobile queue.

## Source

Promoted from mobile phase candidates after T ordered all five live candidates promoted.

## Problem

Deep playtest finding F07: the Mind stance card clips at the right edge and truncates stance relationship/stat text.

## Scope

1. Adjust combat modal stance-card sizing, spacing, wrapping, or font scale so all three stance cards fit the viewport.
2. Preserve readability and touch targets.
3. Keep the stance relationship language intact unless a clearer short label is deliberately chosen.
4. Add/adjust render tests where practical and refresh visual evidence if stance screens are covered.

## Acceptance checklist

- [ ] Body/Heart/Mind cards fit without clipping.
- [ ] Mind card text no longer truncates critical relationship/stat copy.
- [ ] Touch targets remain usable.

## Verification

- `npm run verify`; `npm run verify:visual` if combat modal baseline coverage applies.

## Out of scope

- Production deployment.
- New mechanics design beyond the current `axiomancer-mechanics` package contract.
- Broad visual redesign unless explicitly named in scope.
