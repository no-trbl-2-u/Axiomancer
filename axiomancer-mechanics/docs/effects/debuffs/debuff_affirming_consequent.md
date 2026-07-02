# Affirming the Consequent — `debuff_affirming_consequent`

> *"If you were skilled, you'd succeed. You succeeded—therefore you were skilled. But the reasoning was flawed, and your next attempt knows it."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_affirming_consequent` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 10 |

---

## Description

A minor Tier 1 debuff applying `-1 physicalSkill`. Auto-applies via Tier 1 path.
Non-stackable. Has resist fields (unused by Tier 1 engine).

---

## Data Fields

### `payload.statModifiers`

```json
[{ "stat": "physicalSkill", "value": -1, "isMultiplier": false }]
```

`-1 physicalSkill`. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Affirming the Consequent (debuff_affirming_consequent)', () => {
  it('auto-applies (Tier 1) despite resistedBy field', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
  it('-1 physicalSkill statModifier applied (Phase 2)', () => { ... });
});
```
