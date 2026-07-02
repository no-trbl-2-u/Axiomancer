# Galileo's Infinity — `buff_max_hp_up`

> *"Your vitality is like perfect squares in natural numbers—somehow equal to the whole despite being only a part. Your maximum health expands impossibly."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_max_hp_up` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 5 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff that multiplies the bearer's `body` stat by ×1.25, indirectly representing
an expansion of maximum health (since `body` contributes to `maxHealth` derivation).
Non-stackable; one active instance only.

---

## Data Fields

### `payload.statModifiers`

```json
[{ "stat": "body", "value": 1.25, "isMultiplier": true }]
```

A 1.25× multiplier on `body`. Because `maxHealth` is derived from `body`, this
effectively multiplies maximum health by the same factor.

> **PENDING (Phase 2):** The `isMultiplier` path is not yet applied in combat. When
> implemented, the engine must read `isMultiplier: true` and compute `stat * value`
> rather than `stat + value`. The resulting `body` value feeds into `maxHealth`
> recalculation.

---

## Combat Behaviour

Currently no live mechanical effect — the `statModifiers` multiplier path is pending.

Once implemented: a character with `body: 8` and this buff active would have effective
`body: 10` (`8 × 1.25`), and if `maxHealth` derivation formula is `body × k + base`,
the max HP would scale accordingly.

---

## How to Test

### 1. Stacking none

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1);
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false); // already active
```

### 2. Multiplier effect (Phase 2)

```
Once implemented:
  body=8 + buff → effective body=10
  maxHealth should increase proportionally
```

### 3. Unit tests to write

```typescript
describe('Galileo Infinity (buff_max_hp_up)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('isMultiplier ×1.25 applied to body (Phase 2)', () => { ... });
});
```
