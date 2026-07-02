# Banach-Tarski Strike — `buff_critical_damage_up`

> *"Your critical hits decompose and reassemble—one devastating blow becomes two, each as powerful as the original. Mathematics defies conservation."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_critical_damage_up` |
| **Type** | buff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 14 |

---

## Description

A Tier 2 critical damage multiplier buff. Uses `isMultiplier: true` stat modifiers to
scale all three base stats by ×1.5 — thematically representing the paradox that one
critical hit's energy can simultaneously exist as two full-power hits.

Higher DR (14) reflects the power of this effect. Stacks `'none'` — only one instance
may be active at a time.

---

## Data Fields

### `stacking: "none"`, `resistDR: 14`

Cannot be intensified by reapplication. DR 14 is above average, making this buff harder
to land reliably.

### `payload.statModifiers` (multipliers)

```json
[
  { "stat": "body",  "value": 1.5, "isMultiplier": true },
  { "stat": "mind",  "value": 1.5, "isMultiplier": true },
  { "stat": "heart", "value": 1.5, "isMultiplier": true }
]
```

Each base stat is multiplied by 1.5. Because these are multipliers (`isMultiplier: true`),
they apply as a percentage boost rather than a flat addition. A character with `body: 8`
effectively becomes `body: 12` while this buff is active.

> **PENDING (Phase 2):** The `isMultiplier` path is not yet applied in the combat engine.
> When implemented, the stat modifier aggregation must check `isMultiplier` and apply it
> as `stat * value` rather than `stat + value`.

---

## Combat Behaviour

The entire mechanical value of this effect is in the `statModifiers` multiplier path.
The `rollModifier` field is absent — this buff does not affect dice rolls directly, only
the underlying stats from which damage is computed.

Until Phase 2 implements stat modifier application, this buff has no active mechanical
effect in combat beyond being listed in the effects panel.

---

## How to Test

### 1. stacking 'none' blocks reapplication

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1);
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 2. Multiplier stat modifier (Phase 2 test)

```
Once implemented:
  A character with body=8 and Banach-Tarski Strike active:
  Effective body should be 12 (8 × 1.5) in damage calculations.
  Same for mind and heart.
```

### 3. Unit tests to write

```typescript
describe('Banach-Tarski Strike (buff_critical_damage_up)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('multiplier statModifiers applied correctly (Phase 2)', () => { ... });
});
```
