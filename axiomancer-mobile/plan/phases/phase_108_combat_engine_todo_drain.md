# Phase 108 — Combat engine TODO drain

> Status: pending. Promoted from `plan/PHASE_CANDIDATES.md` via oversight 2026-06-05 so `/march` has a concrete mobile queue.

## Source

Promoted from mobile phase candidates after T ordered all five live candidates promoted.

## Problem

Three TODOs remain around combat/mercy engine integration after the Phase 104-106 contract work.

## Scope

1. Inspect TODOs at `state/actions.ts`, `state/presenters/combat-hud.engine.ts`, and `state/presenters/combat.engine.ts`.
2. Replace TODO scaffolding with engine-truth behavior or remove it if superseded.
3. Do not reintroduce local mechanics simulation; mobile consumes mechanics state/actions only.
4. Add focused presenter/action coverage for any behavior made concrete.

## Acceptance checklist

- [ ] The cited TODO comments are removed or converted into precise tracked follow-up rows with rationale.
- [ ] Mercy/combat integration reads current mechanics contract.
- [ ] Focused tests cover changed behavior.

## Verification

- `npm run typecheck`, focused combat presenter/action tests, and `npm run verify`.

## Out of scope

- Production deployment.
- New mechanics design beyond the current `axiomancer-mechanics` package contract.
- Broad visual redesign unless explicitly named in scope.
