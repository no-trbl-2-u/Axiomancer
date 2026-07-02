# ADR-0006 — Nexus state reconciliation precedes UI polish

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mobile

## Decision

When mobile Nexus state drifts from T/Hermes decisions, state reconciliation precedes UI polish.

## Context

Mobile already showed drift: Phase 98 had shipped but remained marked pending until reconciliation. Glanton's Phase 99 now exists to harden `/march` and `/oversight` against this class of error.

## Consequences

- `/march` should not dispatch stale pending rows.
- `/oversight` should sync durable T decisions into build plan, candidates, critique/audit, and docs before handoff.
- Shipped phases must drain or annotate matching critique/audit rows.
- UI polish queues should wait when command state is untrustworthy.

## Links

- Phase 99 — Glanton Nexus state reconciliation guardrail
- `docs/source-of-truth-hierarchy.md`
- CDR-0001 — Source-of-truth hierarchy
- CDR-0002 — Hermes and Nexus authority boundary
