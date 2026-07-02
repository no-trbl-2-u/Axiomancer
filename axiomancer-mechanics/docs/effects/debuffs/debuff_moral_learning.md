# Moral Blindness — `debuff_moral_learning`

> *"To learn what's right, you must recognize right when you see it. But to recognize it, you must already know it. Your ethical compass spins uselessly."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_moral_learning` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 12 |

---

## Description

A Tier 2 control debuff reducing heart and mind capability plus `rollModifier: -1`.
Non-stackable, DR 12 (easier to land). Targets moral/ethical reasoning metaphorically.

---

## Data Fields

### `payload.rollModifier: -1`

Flat -1 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "heart",          "value": -2 },
  { "stat": "mind",           "value": -1 },
  { "stat": "emotionalSkill", "value": -2 },
  { "stat": "mentalSkill",    "value": -1 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Moral Blindness (debuff_moral_learning)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
