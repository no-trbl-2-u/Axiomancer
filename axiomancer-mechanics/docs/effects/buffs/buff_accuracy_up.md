# Bertrand's Precision — `buff_accuracy_up`

> *"In any given moment, you choose the interpretation of 'random' that most benefits your aim. Probability bends to your will."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_accuracy_up` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 accuracy buff that boosts all skill stats and adds a flat roll bonus. As an
intensity-stacking effect, repeated applications grow the combat benefit. The
`rollModifier +3` is the only payload field currently live; the `statModifiers` are
pending Phase 2 activation.

---

## Data Fields

### `payload.rollModifier: 3`

Flat +3 to every roll. **LIVE** via `getActiveRollModifier`.

This is one of the stronger flat roll bonuses available among Tier 2 buffs.

### `payload.statModifiers`

```json
[
  { "stat": "physicalSkill",  "value": 2 },
  { "stat": "mentalSkill",    "value": 2 },
  { "stat": "emotionalSkill", "value": 2 }
]
```

Raises all three skill stats by 2. **PENDING (Phase 2).**

---

## Combat Behaviour

Tier 2 buff apply. Nat 1 fizzles; nat 20 doubles intensity. The `rollModifier: 3` is
flat and **does not scale with intensity** — stacking increases intensity (for Phase 2
stat scaling) but the roll bonus stays +3 regardless of stack level.

---

## How to Test

### 1. rollModifier +3 verified

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 3);
```

### 2. Intensity stacks without doubling roll modifier

```typescript
// Two applications (intensity 2): rollModifier still +3
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2);
const mod = getActiveRollModifier({ effects: ae2, ...mock });
assert(mod === 3); // flat, not per-intensity
```

### 3. Unit tests to write

```typescript
describe('Bertrand Precision (buff_accuracy_up)', () => {
  it('flat rollModifier +3 via getActiveRollModifier', () => { ... });
  it('stacks by intensity, not roll modifier multiplication', () => { ... });
});
```
