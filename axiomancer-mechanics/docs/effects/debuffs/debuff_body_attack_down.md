# Omnipotence Failure — `debuff_body_attack_down`

> *"Can you create a blow so powerful you cannot throw it? The paradox resolves: no. Your physical might crumbles under logical contradiction."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_body_attack_down` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 debuff targeting Body attack capability. Reduces `body` and `physicalSkill`
plus `rollModifier: -1`. Intensity-stacking.

---

## Data Fields

### `payload.rollModifier: -1`

Flat -1 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "body",          "value": -2 },
  { "stat": "physicalSkill", "value": -3 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Omnipotence Failure (debuff_body_attack_down)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
