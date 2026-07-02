# Boltzmann's Chill — `debuff_frostbite`

> *"Random fluctuations conspire against you—entropy arranges itself into impossible cold. Your movements slow toward heat death."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_frostbite` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 combined DoT and roll penalty debuff. Deals 2 body-type damage per round and
applies a `rollModifier: -2`. Duration-stacking — reapplication extends duration rather
than intensifying damage.

---

## Data Fields

### `stacking: "duration"`

Reapplication extends duration by 3 rounds (capped at 10). Intensity stays at 1, so
DoT stays at `2 × 1 = 2` per round regardless of reapplication.

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`. Immediately hampers attack
and damage rolls upon landing.

### `payload.damageOverTime`

```json
{ "damagePerRound": 2, "damageType": "body" }
```

**PENDING (Phase 2).**

---

## Combat Behaviour

The `-2 roll modifier` is the only live mechanical effect. The DoT is pending.

---

## How to Test

### 1. rollModifier -2

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -2);
```

### 2. Duration stacks on reapplication

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1); // dur 3
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2); // dur 6
assert(ae2[0].remainingDuration === 6);
```

### 3. Unit tests to write

```typescript
describe('Boltzmann Chill (debuff_frostbite)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
  it('DoT 2/round (Phase 2)', () => { ... });
});
```
