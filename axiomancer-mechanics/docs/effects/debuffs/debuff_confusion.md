# Two Envelope Delirium — `debuff_confusion`

> *"Should you switch? The other choice always seems better. You switch targets, switch tactics, switch again—always certain switching helps, always wrong."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_confusion` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 confusion debuff imposing a heavy `rollModifier: -4` and disadvantage on all
stance types. Duration-stacking.

---

## Data Fields

### `payload.rollModifier: -4`

The heaviest flat roll penalty among standard debuffs. **LIVE** via `getActiveRollModifier`.

### `payload.advantageModifier.grantDisadvantage: ["body", "mind", "heart"]`

Disadvantage on all stance attack types. **PENDING (Phase 2).** Mirrors
`buff_evasion_up`'s advantageModifier but as a debuff (the bearer suffers disadvantage,
not their opponents).

---

## How to Test

### 1. rollModifier -4

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -4);
```

### 2. Duration stacks

```typescript
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2);
assert(ae2[0].remainingDuration === 6);
```

### 3. grantDisadvantage all stances (Phase 2)

```
Confused target making any attack should have disadvantage on all rolls.
```

### 4. Unit tests to write

```typescript
describe('Two Envelope Delirium (debuff_confusion)', () => {
  it('rollModifier -4 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
  it('grantDisadvantage all stances (Phase 2)', () => { ... });
});
```
