# Paradox of Tolerance — `buff_heart_defense_up`

> *"By becoming intolerant of harm, you preserve your tolerance for all else. Your emotional resilience strengthens through selective rejection."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_heart_defense_up` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | body |
| **Resist DR** | 12 |

---

## Description

A Tier 2 buff that strengthens emotional resilience, raising `heart`, `emotionalDefense`,
and `defenseModifier`. Mirrors `buff_body_defense_up` and `buff_mind_defense_up` but
for the heart stat family. Stacks by extending duration.

---

## Data Fields

### `payload.statModifiers`

```json
[
  { "stat": "heart",            "value": 2, "isMultiplier": false },
  { "stat": "emotionalDefense", "value": 3, "isMultiplier": false }
]
```

> **PENDING (Phase 2):** Not yet applied to derived stats.

### `payload.defenseModifier: 2`

Flat +2 to emotional defence. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Paradox of Tolerance (buff_heart_defense_up)', () => {
  it('stacks by extending duration', () => { ... });
  it('caps at MAX_EFFECT_DURATION', () => { ... });
});
```
