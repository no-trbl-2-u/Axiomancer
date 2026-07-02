# Transformative Terror — `debuff_transformative`

> *"You cannot know what you'll become until you become it. But the decision must be made now, with values you won't keep. Identity fractures under impossible choice."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_transformative` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 control debuff reducing mind and heart capability plus `rollModifier: -2`.
Non-stackable. Represents identity fracture — the target cannot make coherent decisions.

---

## Data Fields

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "mind",             "value": -2 },
  { "stat": "heart",            "value": -1 },
  { "stat": "mentalSkill",      "value": -2 },
  { "stat": "emotionalDefense", "value": -1 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Transformative Terror (debuff_transformative)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
