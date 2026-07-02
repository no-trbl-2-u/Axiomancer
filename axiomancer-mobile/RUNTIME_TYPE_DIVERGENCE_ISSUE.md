# Engine Issue: BattleLogEntry Type/Runtime Contract Divergence

**Issue Date:** 2026-05-25  
**Phase:** 89 - Combat log-entry shape audit + regression pin  
**Hotfix Reference:** commit `043d607`

## Problem Summary

The `axiomancer-mechanics` engine has a type/runtime contract divergence in `BattleLogEntry` that causes crashes in mobile consumers.

## Type Contract vs Runtime Behavior

**Engine Type Declaration:**
```typescript
interface BattleLogEntry {
    enemyAction: CombatAction;      // Declared as required
    playerAction: CombatAction;     // Declared as required  
    damageToPlayer: number;         // Declared as required
    damageToEnemy: number;          // Declared as required
    result: string;                 // Declared as required
}
```

**Observed Runtime Behavior:**
- `enemyAction` can be `undefined` in boss-skill killing-blow scenarios
- `playerAction` can be `undefined` in certain combat resolution paths
- `damageToPlayer`/`damageToEnemy` can be `undefined`
- `result` can be non-string values

## Crash Scenario

**User Report:** "boss test encounter tried to use a skill" - killing blow crash
**Error:** `Cannot read properties of undefined (reading 'skillId')`
**Root Cause:** Accessing `logEntry.enemyAction.skillId` when `enemyAction` is undefined

## Mobile Workaround Applied

In hotfix `043d607`, mobile code was updated to use defensive optional chaining:

```typescript
// Before (crashes):
const skillName = last.enemyAction.skillId;

// After (safe):
const skillName = last.enemyAction?.skillId 
    ?? last.enemyAction?.action 
    ?? null;
```

## Recommended Engine Fix

1. **Option A:** Fix engine log entry population to ensure fields are never undefined
2. **Option B:** Update engine types to match runtime (mark fields optional)

```typescript
// Option B - Updated type contract:
interface BattleLogEntry {
    enemyAction?: CombatAction;     // Optional to match runtime
    playerAction?: CombatAction;    // Optional to match runtime
    damageToPlayer?: number;        // Optional to match runtime  
    damageToEnemy?: number;         // Optional to match runtime
    result?: string;                // Optional to match runtime
}
```

## Impact

- **Mobile:** Worked around with defensive code, but future engine updates could reintroduce crashes
- **Other Consumers:** Any other consumer reading log entries could hit the same crash
- **Type Safety:** Current type system gives false confidence about field availability

## Files Affected (Mobile)

- `app/(tabs)/combat.tsx` - aftermath snapshot builders (victory/defeat branches)
- `state/e2e/aftermath-snapshot.engine.test.ts` - regression test coverage

## Test Reproduction

See `state/e2e/aftermath-snapshot.engine.test.ts` for regression test cases that reproduce the undefined field scenarios.