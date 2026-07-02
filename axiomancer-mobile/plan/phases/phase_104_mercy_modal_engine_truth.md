# Phase 104 — Mercy modal consumes engine truth only

## Source

Glanton cleanup after SomberSoft doctrine alignment audit `~/Workspace/reports/audits/2026-06-04-sombersoft-doctrine-alignment.md`.

## Problem

Phase 103 shipped the mercy-choice modal surface, but mobile still risks local simulation of modal activation, spare/exploit resolution, and exploit damage. Mobile doctrine says presentation consumes engine truth; it does not invent mechanics locally.

## Scope

1. Inspect `state/presenters/combat.engine.ts`, `state/actions.ts`, combat screen/modal components, and mechanics package surface.
2. Remove local friendship-threshold/modal activation logic where it duplicates engine truth.
3. Dispatch mechanics-provided spare/exploit actions or consume mechanics-provided combat state/report surfaces.
4. Remove hard-coded local exploit damage; use engine action/report output.
5. Preserve accessibility labels and consequence copy slots.
6. Add hermetic e2e coverage for:
   - modal visibility from engine-emitted mercy state;
   - spare dispatch path;
   - exploit dispatch path;
   - no local eligibility calculation.
7. Update ADR-0007 / docs if the engine contract names differ from the current assumption.

## Verification

- `npm run typecheck`
- `npm test -- --runInBand` or focused Jest suite
- `npm run verify`

## Blocker rule

If the required engine contract is not available in the installed `axiomancer-mechanics` package, stop and record the exact missing export/state/action, then leave a clear `[needs-engine-release]` note rather than simulating mechanics locally.
