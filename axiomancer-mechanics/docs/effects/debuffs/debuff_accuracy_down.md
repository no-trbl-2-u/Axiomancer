# Ellsberg's Doubt — `debuff_accuracy_down`

> *"Known risks you could handle. Unknown probabilities paralyze. Your attacks carry ambiguous odds—and ambiguity breeds failure."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_accuracy_down` |
| **Type** | debuff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 accuracy debuff reducing all skill stats and applying `rollModifier: -3`.
Duration-stacking. The roll penalty is the only live component.

---

## Data Fields

### `payload.rollModifier: -3`

Flat -3 to all rolls. **LIVE** via `getActiveRollModifier`. Same magnitude as
`debuff_daze` and `debuff_fear`.

### `payload.statModifiers`

```json
[
  { "stat": "physicalSkill",  "value": -2 },
  { "stat": "mentalSkill",    "value": -2 },
  { "stat": "emotionalSkill", "value": -2 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Ellsbergs Doubt (debuff_accuracy_down)', () => {
  it('rollModifier -3 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
});
```
