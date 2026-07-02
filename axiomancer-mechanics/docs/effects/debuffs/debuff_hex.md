# Allais' Curse — `debuff_hex`

> *"Your allies' pain becomes yours—you violate expected utility by feeling their losses more than logic allows. Independence fails; harm transfers."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_hex` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 hex DoT dealing 2 heart-type damage per round. Non-stackable. Body resist (heart
effects countered by body in RPS).

---

## Data Fields

### `payload.damageOverTime`

```json
{ "damagePerRound": 2, "damageType": "heart" }
```

2 heart-type DoT per round. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Allais Curse (debuff_hex)', () => {
  it('DoT 2/round heart-type (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
