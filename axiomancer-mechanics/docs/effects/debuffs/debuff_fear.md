# Grandfather's Terror — `debuff_fear`

> *"You see the paradox of your own destruction—if you fight, you ensure your doom; if you flee, you ensure your doom. Either path leads backward to oblivion."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_fear` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | duration |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 fear debuff heavily targeting heart stats and emotional defence, plus a
`rollModifier: -3`. Duration-stacking. Body is the resist stat (Heart effects are
resisted by Body in the RPS rule).

---

## Data Fields

### `payload.rollModifier: -3`

Flat -3 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "heart",            "value": -3 },
  { "stat": "emotionalSkill",   "value": -2 },
  { "stat": "emotionalDefense", "value": -2 }
]
```

Heavily reduces heart combat capability. **PENDING (Phase 2).**

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
assert(ae2[0].remainingDuration === 4);
```

### 3. Unit tests to write

```typescript
describe('Grandfathers Terror (debuff_fear)', () => {
  it('rollModifier -3 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
});
```
