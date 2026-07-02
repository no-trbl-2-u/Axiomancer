# Phase 110 — Stale paused phases resolution

> Status: pending. Promoted from `plan/PHASE_CANDIDATES.md` via oversight 2026-06-05 so `/march` has a concrete mobile queue.

## Source

Promoted from mobile phase candidates after T ordered all five live candidates promoted.

## Problem

Phases 62d/62e have remained paused since the combat regression priority shift and now create build-plan ambiguity.

## Scope

1. Inspect current relevance of Phase 62d Currency grant debug control and Phase 62e Combat-HUD spot overrides.
2. Either resume each with updated scope or formally retire it as skipped/deferred with rationale.
3. Patch build-plan text so `/march` cannot mistake stale paused context for live command state.
4. Do not implement the old phases unless the resolution explicitly promotes follow-up work.

## Acceptance checklist

- [ ] Phase 62d has an explicit current disposition.
- [ ] Phase 62e has an explicit current disposition.
- [ ] Build plan no longer contains stale paused ambiguity.

## Verification

- Plan/document diff review; no app test required unless code scope is deliberately added.

## Out of scope

- Production deployment.
- New mechanics design beyond the current `axiomancer-mechanics` package contract.
- Broad visual redesign unless explicitly named in scope.
