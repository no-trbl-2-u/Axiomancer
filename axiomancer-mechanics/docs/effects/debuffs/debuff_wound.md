# Berry's Injury — `debuff_wound`

> *"The smallest wound not describable in fewer than eleven words. By describing it, we've created it. Definability becomes damage."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_wound` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 wound debuff reducing `body` by 2 and applying a `defenseModifier: -2`. No
roll penalty — purely a stat/defence debuff. Intensity-stacking means repeated
applications compound the physical weakness.

---

## Data Fields

### `payload.defenseModifier: -2`

Flat -2 to defence. **PENDING (Phase 2).** When wired, this reduces the target's
effective defence against all attack types.

### `payload.statModifiers`

```json
[{ "stat": "body", "value": -2 }]
```

`-2 body`. **PENDING (Phase 2).**

---

## Combat Behaviour

Currently no live mechanical effect — both fields are pending Phase 2.

---

## How to Test

### 1. Intensity stacks

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1);
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2);
assert(ae2[0].intensity === 2);
```

### 2. defenseModifier -2 (Phase 2)

```
Target with this debuff takes 2 more damage per hit (effectively).
```

### 3. Unit tests to write

```typescript
describe('Berrys Injury (debuff_wound)', () => {
  it('intensity stacks on reapplication', () => { ... });
  it('defenseModifier -2 applied in damage path (Phase 2)', () => { ... });
});
```
