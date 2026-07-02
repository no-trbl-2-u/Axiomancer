# Nexus source-of-truth hierarchy

> This hierarchy governs state reconciliation for autonomous workers.
> When contradictions exist between layers, workers MUST stop and surface
> drift rather than execute stale information.

## The law

1. **T's latest explicit decision** — highest authority
2. **CDRs / ADRs** (`~/Workspace/decisions/`, `docs/adr/`)
3. **Central SomberSoft ledger** (`~/Workspace/SOMBERSOFT_COMMAND_LEDGER.md`)
4. **Active build plan** (`plan/steps/01_build_plan.md`)
5. **Phase candidates** (`plan/PHASE_CANDIDATES.md`)
6. **Critique/audit logs** (`plan/CRITIQUE.md`, `plan/AUDIT.md`)
7. **Historical reports** (archived findings, past decisions)

## Worker obligations

If a lower layer contradicts a higher layer, workers must:

1. **Stop execution** — do not proceed with stale information
2. **Surface the drift** — report the specific contradiction found
3. **Request reconciliation** — ask for state sync before resuming

## Examples

- Build plan shows Phase X shipped, but central ledger shows Phase X deferred → STOP
- T decides to deprioritize feature Y, but PHASE_CANDIDATES still promotes Y → STOP  
- Critique finding references shipped phase as "pending work" → Surface for cleanup
- Audit item contradicts T's standing guidance → Request clarification

## Implementation notes

- `/march` state-sanity preflight checks for obvious drift before dispatch
- `/oversight` decision-sync checklist updates subordinate layers after user decisions
- Phase shipping auto-drains matching critique/audit rows to prevent stale references