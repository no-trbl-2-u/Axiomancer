# Phase 105 — Engine-owned stat preview + combat resources

## Source

Glanton cleanup after SomberSoft doctrine alignment audit `~/Workspace/reports/audits/2026-06-04-sombersoft-doctrine-alignment.md`.

## Problem

Mobile still has doctrine debt where presentation approximates mechanics:

- `lib/previewAllocation.ts` / `levelup.engine.ts` local derived-stat preview math;
- combat-resource display or spending scaffolding that can drift from `CombatState.combatResources`.

Mechanics Phase 97 shipped `previewStatAllocation`; mobile must use engine truth.

## Scope

1. Replace local derived-stat preview math with `previewStatAllocation` or the current mechanics equivalent.
2. Remove or quarantine `lib/previewAllocation.ts` if no longer needed.
3. Ensure level-up preview tests assert against mechanics output, not copied coefficients.
4. Audit combat resource display/action code for `combatMana` or local token scaffolding.
5. Wire combat resource display and affordability to engine `CombatState.combatResources` / engine event payloads only.
6. Add hermetic tests proving:
   - stat preview matches engine API for cross-stat effects;
   - combat resource values update from engine state after round resolution;
   - skill affordability follows engine `canUseSkill`/resource truth, not local approximation.
7. Update docs and candidate/critique rows that still say this is engine-blocked.

## Verification

- `npm run typecheck`
- focused Jest suites for level-up/combat presenters
- `npm run verify`

## Blocker rule

If the installed `axiomancer-mechanics` package lacks the needed API, stop and record the package version/export mismatch. Do not reintroduce local formulas.
