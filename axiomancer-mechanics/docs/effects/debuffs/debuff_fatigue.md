# Preface Exhaustion — `debuff_fatigue`

> *"You believe each action you take is correct. You also believe some of your actions must be mistakes. The inconsistency drains you."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_fatigue` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 fatigue debuff reducing physical and mental capability with a minor roll
penalty. Intensity-stacking over 4 rounds. Easier to land (DR 12).

---

## Data Fields

### `payload.rollModifier: -1`

Flat -1 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "body",          "value": -1 },
  { "stat": "mind",          "value": -1 },
  { "stat": "physicalSkill", "value": -1 },
  { "stat": "mentalSkill",   "value": -1 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Preface Exhaustion (debuff_fatigue)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
