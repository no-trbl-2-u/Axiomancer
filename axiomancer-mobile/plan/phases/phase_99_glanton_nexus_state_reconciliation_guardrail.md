# Phase 99 — Glanton Nexus state reconciliation guardrail

## Outcome

Install a Nexus state guardrail so Hermes/T decisions, the central SomberSoft ledger, and repo-local autonomous machinery stop drifting apart. Workers must not execute stale `/march` or `/oversight` truth when a newer decision exists.

## Why

T identified the failure plainly: conversation decisions and Nexus state collide, and memory files vs repo decisioning are out of sync too often. That is not a feature bug. It is command failure. Before more balance/content phases, the marching machinery needs a state marshal.

## Scope

### Unit 1 — State audit

Compare and reconcile:

- `~/Workspace/SOMBERSOFT_COMMAND_LEDGER.md`
- `plan/steps/01_build_plan.md`
- `plan/PHASE_CANDIDATES.md`
- `plan/CRITIQUE.md`
- `plan/AUDIT.md`
- `skills/march.md`
- `skills/oversight.md`
- `skills/iterate.md`
- `skills/expand.md`
- `skills/jot.md`
- `skills/ship-a-phase.md`
- recent reports under `~/Workspace/reports/`

### Unit 2 — Source-of-truth hierarchy

Document this law in the relevant repo-local Nexus docs/skills:

1. T's latest explicit decision.
2. Central SomberSoft ledger.
3. Active build plan.
4. Phase candidates.
5. Critique/audit logs.
6. Historical reports.

If a lower layer contradicts a higher layer, the worker must stop and surface drift rather than silently execute.

### Unit 3 — `/oversight` decision-sync checklist

Patch `skills/oversight.md` so durable user decisions trigger plan/document sync before handoff back to `/march`:

- newly deferred work marked everywhere it appears;
- promoted candidates moved/annotated;
- shipped phases drain or annotate matching critique/audit rows;
- central-ledger doctrine mirrored into local operational files when needed;
- the final oversight response says whether `/march` may safely resume.

### Unit 4 — `/march` state-sanity preflight

Patch `skills/march.md` so the dispatcher checks for obvious stale command state before dispatch:

- `[deferred]` rows must not be selected;
- top Pending phase must not contradict newer central-ledger or build-plan decisions;
- shipped-but-still-pending phase rows stop dispatch until reconciled;
- major critique rows already addressed by shipped phases are surfaced as ledger drift, not treated as fresh blockers.

### Unit 5 — Reconciliation report

Write a concise report under `~/Workspace/reports/nexus-state-reconciliation/YYYY-MM-DD-mobile.md` with:

- files inspected;
- drift found;
- rows patched;
- unresolved conflicts;
- whether `/march` is safe to resume.

## Decisions made upfront — DO NOT ASK

1. Work directly on `main` under SomberSoft standing autonomy.
2. Do not implement gameplay features in this phase.
3. Do not delete historical archaeology; mark live-vs-historical state clearly.
4. If a contradiction is factual and obvious, patch it. If it requires product judgment, mark `[needs-T-call]`.
5. Treat Glanton as the named owner of this state discipline, but keep docs operational rather than theatrical.

## Verification

```bash
npm run deploy:check
npm run verify:visual
```

Also run text checks as needed:

```bash
git diff --check
git status --short --branch
```

## DoD

- [ ] Source-of-truth hierarchy documented locally.
- [ ] `/oversight` includes decision-sync checklist.
- [ ] `/march` includes state-sanity preflight.
- [ ] Obvious stale phase/critique/candidate drift patched.
- [ ] Reconciliation report written.
- [ ] Deploy/check gate remains green or any red gate is proved unrelated to docs-only changes.
