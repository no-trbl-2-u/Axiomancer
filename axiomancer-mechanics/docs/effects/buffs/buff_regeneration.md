# Tristram's Recovery — `buff_regeneration`

> *"Like the writer who takes a year to document a day, your healing works faster than wounds accumulate. Eventually, you'll catch up."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_regeneration` |
| **Type** | buff |
| **Category** | regeneration |
| **Tier** | Tier 2 |
| **Duration** | 5 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 regeneration buff. Heals `3 × intensity` HP per round. Stacking by
intensity means each reapplication multiplies the healing output. Duration is 5 —
the longest standard regeneration effect.

---

## Data Fields

### `duration: 5`, `stacking: "intensity"`

5-round duration with intensity stacking. At intensity 3: heals 9 HP per round. At
intensity 5: heals 15 HP per round (capped at intensity 10 for 30 HP/round theoretical
max).

### `payload.regeneration.healthPerRound: 3`

Restores `3 × intensity` HP at the start of each round.

**LIVE:** `applyRegen` in `src/Combat/index.ts` sums this across all active effects
with positive `healthPerRound` values. Scaling formula:

```
healed += healthPerRound * (ae.intensity ?? 1)
        = 3 * intensity
```

---

## Combat Behaviour

`applyRegen` fires at the start of each round (step 1 of round order). It sums all
positive regeneration from all effects. Tristram's Recovery, Vital Empathy, and
Maxwell's Siphon all contribute if simultaneously active.

Healing is clamped to `maxHealth` via `healCharacter`.

---

## How to Test

### 1. Heals 3 × intensity per round

```typescript
const mockTarget = {
  health: 50, maxHealth: 100,
  effects: [{
    effectId: 'buff_regeneration', remainingDuration: 5,
    intensity: 2, appliedAt: 1, tier: 'Tier 2'
  }]
};
const { healed } = applyRegen(mockTarget);
assert(healed === 6); // 3 × 2
```

### 2. Stacks with other regen effects

```typescript
// With both buff_regeneration (intensity 2, +6) and tier1_heart_defend (intensity 3, +3):
const { healed } = applyRegen(mockTargetBothEffects);
assert(healed === 9);
```

### 3. Unit tests to write

```typescript
describe('Tristram Recovery (buff_regeneration)', () => {
  it('heals 3 × intensity per round', () => { ... });
  it('stacks additively with other regen effects', () => { ... });
  it('does not overheal past maxHealth', () => { ... });
  it('intensity increments on reapplication', () => { ... });
});
```
