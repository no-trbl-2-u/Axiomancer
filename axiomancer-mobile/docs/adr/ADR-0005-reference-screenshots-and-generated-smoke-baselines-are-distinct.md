# ADR-0005 — Reference screenshots and generated smoke baselines are distinct

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mobile

## Decision

Manual/reference screenshots and generated visual smoke baselines are separate evidence lanes.

## Context

T may send manual playthrough screenshots as field evidence. The visual smoke harness generates route screenshots for regression comparison. Mixing these lanes corrupts both.

## Consequences

- Manual/reference screenshots live under `test-artifacts/reference-screenshots/` when approved.
- Generated/current smoke screenshots live under `screenshots/current/`.
- Approved smoke baselines live under `screenshots/baseline/`.
- Automation should compare like with like and never overwrite manual references.

## Links

- `scripts/smoke-screens.mjs`
- `test-artifacts/reference-screenshots/`
