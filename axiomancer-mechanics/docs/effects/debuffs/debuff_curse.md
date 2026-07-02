# Grelling's Malediction — `debuff_curse`

> *"This curse is heterological—it does not describe itself. But then it does describe itself. The contradiction festers in your soul."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_curse` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 5 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 14 |

---

## Description

A Tier 2 curse with the longest standard duration (5 rounds). Reduces all base stats
(heart most heavily at -2) and applies a `rollModifier: -2`. Non-stackable, DR 14.

---

## Data Fields

### `duration: 5`

The longest-duration standard Tier 2 debuff. Once it lands, it persists through most
of a typical combat.

### `resistDR: 14`

Above-average DR reflects the power of a 5-round debuff.

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "body",  "value": -1 },
  { "stat": "mind",  "value": -1 },
  { "stat": "heart", "value": -2 }
]
```

Heart is penalised more heavily (thematic: curse targets emotional resilience).
**PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier -2

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -2);
```

### 2. stacking none

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 3. Unit tests to write

```typescript
describe('Grellings Malediction (debuff_curse)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
  it('5-round duration ticks correctly', () => { ... });
});
```
