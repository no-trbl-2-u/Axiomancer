# Hardy's Discharge — `debuff_shock`

> *"Two particles that should never meet—do. The impossible measurement occurs. Reality contradicts itself through your nervous system."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_shock` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 shock DoT dealing 3 mind-type damage per round with a `rollModifier: -1`.
Notable for using `mind` as the damage type — emotional/electrical disruption. Heart
is the resist stat (Heart resists Mind-type effects in the RPS rule).

---

## Data Fields

### `payload.rollModifier: -1`

Flat -1 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.damageOverTime`

```json
{ "damagePerRound": 3, "damageType": "mind" }
```

Mind-type DoT. **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier -1

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -1);
```

### 2. DoT (Phase 2)

```
3 × intensity mind-type damage per round once implemented.
```

### 3. Unit tests to write

```typescript
describe('Hardy Discharge (debuff_shock)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('DoT 3 × intensity mind-type per round (Phase 2)', () => { ... });
});
```
