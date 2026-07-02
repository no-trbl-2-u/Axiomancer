# Quantum Erasure — `debuff_blind`

> *"Information about your target has been erased from reality itself. You know they exist; you cannot know where. Observation fails."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_blind` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 blind debuff. The heaviest `rollModifier` penalty in the library (`-5`) plus
disadvantage on Body and Mind stances (notably **not** Heart — blindness doesn't
suppress emotional instinct). Duration-stacking.

---

## Data Fields

### `payload.rollModifier: -5`

The largest negative flat roll modifier in the entire effect library. **LIVE** via
`getActiveRollModifier`. Effectively cancels Ad Baculum at intensity 5.

### `payload.advantageModifier.grantDisadvantage: ["body", "mind"]`

Disadvantage on Body and Mind attacks (not Heart). **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier -5

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -5);
```

### 2. Duration stacks

```typescript
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2);
assert(ae2[0].remainingDuration === 4);
```

### 3. Selective disadvantage (Phase 2)

```
Blinded target: Body attacks have disadvantage, Mind attacks have disadvantage.
Heart attacks are NOT disadvantaged by this effect.
```

### 4. Unit tests to write

```typescript
describe('Quantum Erasure (debuff_blind)', () => {
  it('rollModifier -5 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
  it('grantDisadvantage [body, mind] but not heart (Phase 2)', () => { ... });
});
```
