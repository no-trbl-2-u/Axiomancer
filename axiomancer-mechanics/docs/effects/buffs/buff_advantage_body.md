# Predestination Strength — `buff_advantage_body`

> *"Your physical dominance was always fated—your attempts to fight destiny only ensure your muscular superiority. Causality loops in your favor."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_advantage_body` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff granting advantage on Body attacks plus stat bonuses to `body` and
`physicalSkill`. Non-stackable.

---

## Data Fields

### `payload.advantageModifier.grantAdvantage: ["body"]`

Advantage on Body-stance attacks. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "body",          "value": 1 },
  { "stat": "physicalSkill", "value": 2 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Predestination Strength (buff_advantage_body)', () => {
  it('grantAdvantage [body] wired to roll resolution (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
