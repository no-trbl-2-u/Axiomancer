# Yablo's Venom — `debuff_strong_poison`

> *"Each moment of pain refers to the next: 'All pain after this will be worse.' No self-reference, yet infinitely escalating agony."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_strong_poison` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 14 |

---

## Description

A stronger version of `debuff_poison`. Deals 5 damage/round (vs 3) and also applies a
`-1 body` stat modifier. DR 14 — harder to land than regular poison.

---

## Data Fields

### `resistDR: 14`

Harder to apply than standard poison, reflecting its greater power.

### `payload.damageOverTime`

```json
{ "damagePerRound": 5, "damageType": "body" }
```

5 body-type damage per round. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[{ "stat": "body", "value": -1, "isMultiplier": false }]
```

Additionally reduces `body` by 1. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Yablos Venom (debuff_strong_poison)', () => {
  it('DoT 5 × intensity per round (Phase 2)', () => { ... });
  it('statModifier -1 body applied (Phase 2)', () => { ... });
  it('Tier 2 debuff: resist roll vs DR 14', () => { ... });
});
```
