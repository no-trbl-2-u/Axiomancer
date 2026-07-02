# Phase 112 — Stance and Vitae authority hardening

## Source

Glanton cleanup after SomberSoft doctrine alignment audit `~/Workspace/reports/audits/2026-06-04-sombersoft-doctrine-alignment.md`.

## Problem

Mechanics has shipped Stance-driven action selection and Vitae/resource spending as engine-owned surfaces, but legacy passive resolution can still end combat through counter eligibility. That can bypass:

- engine-owned Stance state;
- Vitae/resource generation and spending;
- action affordability and report output.

## Doctrine

CDR-0005 and ADR-0007 are active law under the corrected language: Stance and Vitae are authoritative engine truth. Any legacy counter path may remain only if it is explicitly renamed/documented as a separate doctrine, but it must not silently bypass engine-owned Stance, Vitae, action affordability, or report state.

## Scope

1. Audit `src/Combat/index.ts`, combat reducer/store end-combat paths, Stance handling, Vitae/resource handling, and passive eligibility usage.
2. Make engine-owned Stance and Vitae state the authoritative action/resource contract.
3. Enforce action-affordability and report semantics consistently, or encode any exceptions explicitly in ADR/docs with tests.
4. Preserve downstream consequence reporting from Phases 109–110.
5. Add hermetic e2e coverage proving:
   - passive counter alone cannot bypass engine-owned Stance/Vitae doctrine where forbidden;
   - action affordability follows mechanics-owned Vitae/resource state;
   - outcomes still route to the right reports/consequences;
   - report state matches the mechanics resolution path.
6. Update `docs/combat.md`, ADR-0007, and CHANGELOG if behavior changes.

## Verification

- `npm run verify`
- `npm run deploy:check`
- Targeted Stance/Vitae e2e tests named in final report.

## Out of scope

- Mobile consumption of the engine contract.
- Balance tuning beyond parameters required to keep existing tests deterministic.
