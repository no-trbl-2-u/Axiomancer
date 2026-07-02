# Toxin Hesitation — `debuff_heart_attack_down`

> *"Intend to feel and you get rewarded—but you know you won't follow through. Unable to genuinely commit, your Heart attacks lack conviction."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_heart_attack_down` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 debuff targeting Heart attack capability. Reduces `heart` and `emotionalSkill`
plus `rollModifier: -1`. Mirrors `debuff_body_attack_down` and `debuff_mind_attack_down`
for the heart stat family.

---

## Data Fields

### `payload.rollModifier: -1`

**LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "heart",          "value": -2 },
  { "stat": "emotionalSkill", "value": -3 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Toxin Hesitation (debuff_heart_attack_down)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
