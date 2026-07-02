# Simpson's Confusion — `debuff_daze`

> *"Each part of your thinking is superior, yet combined they're inferior. Your mind's aggregation betrays its components."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_daze` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 daze debuff reducing mind effectiveness via stat modifiers and applying a strong
`rollModifier: -3`. Duration-stacking. Does not skip turns — the target can still act
but is significantly impaired.

---

## Data Fields

### `payload.rollModifier: -3`

Flat -3 to all rolls. **LIVE** via `getActiveRollModifier`. One of the heavier roll
penalties available.

### `payload.statModifiers`

```json
[
  { "stat": "mind",          "value": -2 },
  { "stat": "mentalSkill",   "value": -2 },
  { "stat": "mentalDefense", "value": -1 }
]
```

**PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier -3

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -3);
```

### 2. Duration stacks

```typescript
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2);
assert(ae2[0].remainingDuration === 4); // 2 + 2
```

### 3. Unit tests to write

```typescript
describe('Simpsons Confusion (debuff_daze)', () => {
  it('rollModifier -3 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
});
```
