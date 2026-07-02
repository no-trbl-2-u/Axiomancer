# Phase 96 — BattleLogEntry Type/Runtime Contract Fix

## Objective

Audit and fix the `BattleLogEntry` type surface to eliminate runtime contract divergence. Fields declared as required must never be `undefined` at runtime, particularly in edge cases like boss-skill killing blows.

## Problem Summary  

GitHub issue #74 reports that `BattleLogEntry` declares `enemyAction`, `playerAction`, `damageToPlayer`, `damageToEnemy`, and `result` as required fields, but these can be `undefined` at runtime during boss-skill killing blows, causing mobile crashes when accessing `logEntry.enemyAction.skillId`.

## Acceptance Criteria

- [ ] Audit all `BattleLogEntry` creation paths in `src/Combat/`
- [ ] Identify where fields can be undefined at runtime
- [ ] Choose fix strategy: (a) ensure all fields are always populated, or (b) mark problem fields as optional in types
- [ ] Implement the fix across all creation paths
- [ ] Add regression test for boss-skill killing blow scenario
- [ ] Verify no other edge cases leave fields undefined

## Implementation Strategy

**Preferred approach (a):** Fix the engine to ensure all required fields are populated.

**Fallback approach (b):** Update types to match runtime behavior by marking fields optional.

## Commit Units

1. **Audit** — Document all `BattleLogEntry` creation paths and identify the undefined field cases
2. **Fix implementation** — Either populate missing fields or update type contracts
3. **Tests** — Add regression test covering boss-skill killing blow edge case

## Decisions Made Upfront — DO NOT ASK

- Fix strategy will be determined during audit based on complexity and backwards compatibility
- If fields are made optional, consumers (including mobile) are already handling this with optional chaining
- Focus on `combat.resolver.ts` as primary area, with secondary check of test utilities

## Verify Gate

- `npm run type-check` — TypeScript compilation must pass
- `npm test` — All existing tests continue to pass
- New regression test passes

## Definition of Done

- [x] All `BattleLogEntry` creation paths audited and documented
- [x] Runtime contract divergence eliminated (no undefined required fields)
- [x] Regression test added for boss-skill killing blow scenario  
- [x] TypeScript compilation clean
- [x] All tests passing
- [x] No breaking changes to public API

## Follow-ups (Out of Scope)

- Mobile side can remove defensive optional chaining once contract is fixed
- Performance audit of log entry creation in high-frequency combat scenarios