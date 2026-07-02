# Phase 111 — EncounterModalOverlay component extraction

> Status: pending. Promoted from `plan/PHASE_CANDIDATES.md` via oversight 2026-06-05 so `/march` has a concrete mobile queue.

## Source

Promoted from mobile phase candidates after T ordered all five live candidates promoted.

## Problem

`EncounterModalOverlay` is a 748-line component with overlay, content, animation, and accessibility concerns tangled together.

## Scope

1. Extract small named subcomponents/helpers while preserving current behavior.
2. Keep accessibility labels, modal state, animations, and public props stable.
3. Avoid broad visual redesign; this is structure, not art direction.
4. Add/adjust tests around modal rendering and key user actions.

## Acceptance checklist

- [ ] Component file size and concern boundaries improve.
- [ ] No modal behavior regression.
- [ ] Existing modal tests remain green with added coverage where extraction creates seams.

## Verification

- `npm run verify` plus focused modal/encounter tests; visual smoke if encounter modal baselines exist.

## Out of scope

- Production deployment.
- New mechanics design beyond the current `axiomancer-mechanics` package contract.
- Broad visual redesign unless explicitly named in scope.
