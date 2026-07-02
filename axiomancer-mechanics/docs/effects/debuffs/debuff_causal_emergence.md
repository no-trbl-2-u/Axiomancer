# Emergence Failure — `debuff_causal_emergence`

> *"Your consciousness should have causal power—but physics is causally closed. Your will is epiphenomenal, an illusion. Commands fail to reach your limbs."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_causal_emergence` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 control debuff combining a roll penalty, mind/skill stat reductions, and
disadvantage on Mind-stance attacks. Non-stackable. Represents the target's mind losing
causal influence over their body.

---

## Data Fields

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "mind",          "value": -2 },
  { "stat": "mentalSkill",   "value": -2 },
  { "stat": "physicalSkill", "value": -1 }
]
```

**PENDING (Phase 2).**

### `payload.advantageModifier.grantDisadvantage: ["mind"]`

Disadvantage on Mind-stance attacks. **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier -2

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -2);
```

### 2. Mind disadvantage (Phase 2)

```
Target with Emergence Failure: Mind attacks should have disadvantage.
```

### 3. Unit tests to write

```typescript
describe('Emergence Failure (debuff_causal_emergence)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('grantDisadvantage [mind] (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
