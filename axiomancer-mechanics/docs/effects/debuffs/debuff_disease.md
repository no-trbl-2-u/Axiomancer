# Inspection Sickness — `debuff_disease`

> *"You randomly sampled this moment—but longer illnesses are more likely to be sampled. Your disease will last longer than average, paradoxically."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_disease` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 disease debuff combining a DoT with a negative `healthPerRound` that acts as a
healing suppressor. The `-1 healthPerRound` would cancel 1 HP of regeneration per round,
compounding with the DoT effect. Duration-stacking — reapplication extends the duration
of the disease rather than intensifying it.

---

## Data Fields

### `payload.damageOverTime`

```json
{ "damagePerRound": 2, "damageType": "body" }
```

2 body-type DoT per round. **PENDING (Phase 2).**

### `payload.regeneration.healthPerRound: -1`

Negative healing — reduces HP by 1 per round (or cancels 1 HP of incoming regen).

> **PENDING (Phase 2):** `applyRegen` currently skips `perRound <= 0`:
> ```typescript
> if (perRound <= 0) continue;
> ```
> The drain mechanic is not yet active. When implemented, negative `healthPerRound`
> should reduce HP (or net-subtract from positive regen effects) each round.

---

## Design Note

When both mechanics are implemented simultaneously, `debuff_disease` will deal 2
body-type damage per round AND reduce health by 1 per round — effectively 3 total HP
drain/round. This is a compounding debuff that is particularly dangerous when the target
relies on regeneration to survive.

---

## How to Test

### 1. Duration stacks on reapplication

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1); // dur 4
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2); // dur 8
assert(ae2[0].remainingDuration === 8);
```

### 2. Negative regen (Phase 2 test)

```
Setup: Target has +3 regen/round (buff_regeneration intensity 1)
Apply debuff_disease
Expected (Phase 2): net regen = 3 - 1 = 2 HP/round
```

### 3. DoT (Phase 2)

```
2 body-type damage dealt at start of each round.
```

### 4. Unit tests to write

```typescript
describe('Inspection Sickness (debuff_disease)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('negative healthPerRound drains HP (Phase 2)', () => { ... });
  it('DoT 2/round (Phase 2)', () => { ... });
});
```
