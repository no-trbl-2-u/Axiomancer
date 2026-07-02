# ADR-0006 — Nexus state reconciliation precedes feature work

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mechanics

## Decision

When repo-local Nexus state drifts from T/Hermes decisions, state reconciliation precedes feature work.

## Context

T identified collisions between Hermes conversation decisions, memory, central ledger, and Nexus machinery (`/march`, `/oversight`, plans, critique, audit, candidates). Mechanics queued Glanton's reconciliation phase ahead of balance/content work.

## Consequences

- `/march` should not dispatch work that contradicts newer CDR/ADR/ledger/build-plan decisions.
- `/oversight` should sync durable decisions into subordinate files before handoff.
- Stale critique/audit rows should be drained or annotated when phases ship.
- Feature phases may pause behind reconciliation when command state is untrustworthy.

## Links

- Phase 105 — Glanton Nexus state reconciliation guardrail
- CDR-0001 — Source-of-truth hierarchy
- CDR-0002 — Hermes and Nexus authority boundary
