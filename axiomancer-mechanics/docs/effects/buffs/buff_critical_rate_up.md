# Observer's Collapse — `buff_critical_rate_up`

> *"Your attacks exist in superposition until observed by your enemy. When they look, the wavefunction collapses—always into the deadliest outcome."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_critical_rate_up` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 critical-rate buff. Grants a flat roll bonus and raises the `luck` stat.
Intensity-stacking — repeated applications build up both duration and stack level for
future Phase 2 luck-scaling mechanics.

---

## Data Fields

### `payload.rollModifier: 2`

Flat +2 to all rolls. **LIVE** via `getActiveRollModifier`. The roll bonus increases
the raw d20 value, making critical-threshold numbers (e.g. natural 20 territory) more
reachable on effective scales.

### `payload.statModifiers`

```json
[{ "stat": "luck", "value": 2, "isMultiplier": false }]
```

`+2 luck`. Luck stat feeds into critical hit rate and other probability-based mechanics
once the luck system is implemented. **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier +2 verified

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 2);
```

### 2. Intensity increments

```typescript
// Two applications: intensity 2, rollModifier still +2 (flat)
```

### 3. Unit tests to write

```typescript
describe('Observer Collapse (buff_critical_rate_up)', () => {
  it('rollModifier +2 via getActiveRollModifier', () => { ... });
  it('intensity increments on reapplication', () => { ... });
});
```
