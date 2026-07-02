# Olbers' Fire — `debuff_burn`

> *"If infinite stars fill the sky, why is it dark? Because their light is delayed. When it arrives all at once—you burn in accumulated radiance."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_burn` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 burn DoT dealing 4 heart-type damage per round plus a `-1 heart` stat modifier.
Notable for using `heart` as the damage type (emotional/fire damage) and `body` as the
resist stat — Body defends against Heart-type attacks (RPS: Heart > Body > Mind).

---

## Data Fields

### `resistedBy: "body"`, `payload.damageOverTime.damageType: "heart"`

Body resists heart-type effects (RPS counter). 4 damage/round is meaningful over 3
rounds.

### `payload.damageOverTime`

```json
{ "damagePerRound": 4, "damageType": "heart" }
```

**PENDING (Phase 2).**

### `payload.statModifiers`

```json
[{ "stat": "heart", "value": -1 }]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Olbers Fire (debuff_burn)', () => {
  it('DoT 4 × intensity heart-type damage per round (Phase 2)', () => { ... });
  it('statModifier -1 heart (Phase 2)', () => { ... });
  it('resist via body defence vs DR 13', () => { ... });
});
```
