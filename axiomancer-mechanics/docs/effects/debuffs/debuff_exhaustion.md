# Lottery Despair — `debuff_exhaustion`

> *"For each effort, you rationally believe it will fail. Combined, you believe nothing will succeed. Yet something must. The contradiction exhausts you."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_exhaustion` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A stronger version of `debuff_fatigue`. Reduces all three base stats and all three skill
stats by 2, plus `rollModifier: -2`. Intensity-stacking.

---

## Data Fields

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "body",           "value": -2 },
  { "stat": "mind",           "value": -2 },
  { "stat": "heart",          "value": -2 },
  { "stat": "physicalSkill",  "value": -1 },
  { "stat": "mentalSkill",    "value": -1 },
  { "stat": "emotionalSkill", "value": -1 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Lottery Despair (debuff_exhaustion)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
