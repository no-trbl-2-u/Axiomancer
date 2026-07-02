# Achilles' Burden — `debuff_slow`

> *"You are Achilles—faster than any tortoise. Yet the tortoise is always ahead. No matter how swiftly you act, you're always one step behind."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_slow` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 slow debuff combining a roll penalty, physicalSkill reduction, and disadvantage
on Body attacks. Duration-stacking. The `rollModifier: -2` is the only live component.

---

## Data Fields

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[{ "stat": "physicalSkill", "value": -2 }]
```

**PENDING (Phase 2).**

### `payload.advantageModifier.grantDisadvantage: ["body"]`

Disadvantage on Body-stance attacks. **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier -2

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -2);
```

### 2. Duration stacks

```typescript
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2);
assert(ae2[0].remainingDuration === 6);
```

### 3. Body disadvantage (Phase 2)

```
Slowed target using Body stance: all Body rolls should have disadvantage.
```

### 4. Unit tests to write

```typescript
describe('Achilles Burden (debuff_slow)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
  it('grantDisadvantage [body] (Phase 2)', () => { ... });
});
```
