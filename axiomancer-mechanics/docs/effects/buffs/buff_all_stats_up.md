# Sorites Ascension — `buff_all_stats_up`

> *"One grain of power is nothing. Two grains still nothing. Yet somehow, grain by grain, you've become a heap of overwhelming force."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_all_stats_up` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 14 |

---

## Description

A comprehensive Tier 2 all-stats buff. Raises all three base stats, all three skill
stats, luck, and adds a flat roll bonus. The broadest single-effect stat buff in the
game. DR 14 reflects its power. Non-stackable.

---

## Data Fields

### `payload.rollModifier: 1`

Flat +1 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "body",           "value": 2 },
  { "stat": "mind",           "value": 2 },
  { "stat": "heart",          "value": 2 },
  { "stat": "physicalSkill",  "value": 1 },
  { "stat": "mentalSkill",    "value": 1 },
  { "stat": "emotionalSkill", "value": 1 },
  { "stat": "luck",           "value": 1 }
]
```

Raises all base and skill stats simultaneously. **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier +1

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 1);
```

### 2. Stacking none

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 3. Unit tests to write

```typescript
describe('Sorites Ascension (buff_all_stats_up)', () => {
  it('rollModifier +1 via getActiveRollModifier', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
  it('all statModifiers applied on Phase 2 wiring', () => { ... });
});
```
