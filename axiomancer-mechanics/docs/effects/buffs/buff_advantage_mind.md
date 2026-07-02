# Knowability Insight — `buff_advantage_mind`

> *"If a truth is knowable, it must already be known. You know this truth: your Mind attacks will succeed. Therefore, they must."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_advantage_mind` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff granting advantage on Mind attacks plus stat bonuses to `mind` and
`mentalSkill`. Mirrors `buff_advantage_body` for the mind stance.

---

## Data Fields

### `payload.advantageModifier.grantAdvantage: ["mind"]`

Advantage on Mind-stance attacks. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "mind",        "value": 1 },
  { "stat": "mentalSkill", "value": 2 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Knowability Insight (buff_advantage_mind)', () => {
  it('grantAdvantage [mind] wired to roll resolution (Phase 2)', () => { ... });
});
```
