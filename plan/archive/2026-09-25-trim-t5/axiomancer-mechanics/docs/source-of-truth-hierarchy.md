# Nexus source-of-truth hierarchy

> **Status:** HISTORICAL — archived 2026-09-25 (trim T5, `plan/2026-09-25-trim-the-fat.spec.md` Tier 2 docs); superseded, kept for provenance. Original path: `axiomancer-mechanics/docs/source-of-truth-hierarchy.md`. Not a source of rules.

> This hierarchy governs state reconciliation for autonomous mechanics workers.
> When contradictions exist between layers, workers MUST stop and surface
> drift rather than execute stale information.

## The law

1. **T's latest explicit decision** — highest authority.
2. **CDRs / ADRs** (`~/Workspace/decisions/`, `docs/adr/`) — durable decision records.
3. **Central SomberSoft ledger** (`~/Workspace/SOMBERSOFT_COMMAND_LEDGER.md`) — company-wide doctrine and operating law.
4. **Active build plan** (`plan/steps/01_build_plan.md`) — current repo execution queue and shipped phase ledger.
5. **Phase candidates** (`plan/PHASE_CANDIDATES.md`) — promotable work, not marching authority until accepted.
6. **Critique/audit logs** (`plan/CRITIQUE.md`, `plan/AUDIT.md`) — findings queues and evidence of known rot.
7. **Historical reports** (`~/Workspace/reports/`) — archived evidence, subordinate to current law.

## Worker obligations

If a lower layer contradicts a higher layer, workers must:

1. **Stop execution** — do not proceed with stale information.
2. **Surface the drift** — report the specific contradiction and the files involved.
3. **Request reconciliation** — surface to T and reconcile before resuming work.

## Examples

- A phase row says a mercy feature is pending, but an ADR/build-plan row says it shipped → STOP and reconcile.
- A candidate proposes a mechanics rule that conflicts with a CDR/ADR → STOP; decision record wins until amended.
- A critique finding references shipped work as still open → surface as Nexus drift and drain/annotate the row.
- A historical report contradicts the central ledger or an ADR → treat the report as stale evidence, not marching law.

## Implementation notes

- Phase shipping must drain or annotate matching critique/audit/candidate rows.
- CDRs/ADRs are not optional commentary; they sit above the central ledger in repo execution disputes.
