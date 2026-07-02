# Sleeping Beauty's Rest — `debuff_sleep`

> *"You wake, uncertain if this is Monday or Tuesday—or if the coin landed heads. Unable to resolve your credence, you drift back to unconsciousness."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_sleep` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 sleep debuff combining `skipTurn: true` with `defenseModifier: -3`. The target
is rendered helpless (cannot act) and also more vulnerable (reduced defence). Non-
stackable.

---

## Data Fields

### `payload.actionRestriction.skipTurn: true`

Target skips their action for the duration. **PENDING (Phase 2).**

### `payload.defenseModifier: -3`

Flat -3 to defence (a sleeping combatant is easier to hit/damage). **PENDING (Phase 2).**

---

## How to Test

### 1. stacking none

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 2. skipTurn + defenseModifier (Phase 2)

```
Target with Sleeping Beauty's Rest:
  - Cannot act for 2 rounds
  - Takes 3 more effective damage per hit
```

### 3. Unit tests to write

```typescript
describe('Sleeping Beautys Rest (debuff_sleep)', () => {
  it('skipTurn prevents action for 2 rounds (Phase 2)', () => { ... });
  it('defenseModifier -3 increases damage taken (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
