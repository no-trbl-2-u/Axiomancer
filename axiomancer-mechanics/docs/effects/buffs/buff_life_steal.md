# Maxwell's Siphon — `buff_life_steal`

> *"Like the demon sorting molecules, you separate your enemy's vitality from their form—fast energy to you, slow energy left behind."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_life_steal` |
| **Type** | buff |
| **Category** | regeneration |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 life-steal buff combining per-round healing with a small roll bonus. Heals
`2 × intensity` HP at the start of each round. Intensity-stacking — repeated
application increases healing output significantly.

---

## Data Fields

### `payload.regeneration.healthPerRound: 2`

Restores `2 × intensity` HP per round. **LIVE** via `applyRegen`.

At intensity 3: heals 6 HP/round. Combined with `buff_regeneration` (3 HP × intensity)
and `tier1_heart_defend` (1 HP × intensity) the total can be substantial.

### `payload.rollModifier: 1`

Flat +1 to all rolls. **LIVE** via `getActiveRollModifier`.

---

## Combat Behaviour

`applyRegen` at round start sums all positive `healthPerRound × intensity` values.
Maxwell's Siphon contributes `2 × intensity`.

---

## How to Test

### 1. Heals 2 × intensity per round

```typescript
const mockTarget = { health: 50, maxHealth: 100,
  effects: [{
    effectId: 'buff_life_steal', remainingDuration: 4,
    intensity: 3, appliedAt: 1, tier: 'Tier 2'
  }]
};
const { healed } = applyRegen(mockTarget);
assert(healed === 6); // 2 × 3
```

### 2. rollModifier +1

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 1);
```

### 3. Unit tests to write

```typescript
describe('Maxwell Siphon (buff_life_steal)', () => {
  it('heals 2 × intensity per round via applyRegen', () => { ... });
  it('rollModifier +1 via getActiveRollModifier', () => { ... });
  it('stacks additively with other regen effects', () => { ... });
});
```
