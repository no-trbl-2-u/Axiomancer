# Hedonist's Loop — `buff_advantage_heart`

> *"Pursuing happiness directly fails—so you pursue victory, and happiness follows. Your Heart surges with incidental joy made powerful."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_advantage_heart` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff granting advantage on Heart attacks plus stat bonuses to `heart` and
`emotionalSkill`. Mirrors `buff_advantage_body` and `buff_advantage_mind` for the heart
stance.

---

## Data Fields

### `payload.advantageModifier.grantAdvantage: ["heart"]`

Advantage on Heart-stance attacks. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "heart",          "value": 1 },
  { "stat": "emotionalSkill", "value": 2 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Hedonist Loop (buff_advantage_heart)', () => {
  it('grantAdvantage [heart] wired to roll resolution (Phase 2)', () => { ... });
});
```
