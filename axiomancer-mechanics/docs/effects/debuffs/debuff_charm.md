# Wigner's Friendship — `debuff_charm`

> *"From your perspective, your reality has collapsed into serving them. From outside, you remain in superposition. Neither view is wrong. You obey."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_charm` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 14 |

---

## Description

A Tier 2 charm debuff combining `forcedStance: 'heart'` (target must use heart stance)
with heart/emotional defence penalties. DR 14 reflects the power of stance control.

---

## Data Fields

### `payload.actionRestriction.forcedStance: "heart"`

The target must use the `heart` stance for all actions while charmed. They cannot
choose Body or Mind.

> **PENDING (Phase 2):** `forcedStance` is not yet enforced in `src/Combat/phases/scenario.ts`. When
> implemented, before action selection, check:
> ```typescript
> const forced = activeEffects.find(ae =>
>     lookupEffect(ae.effectId)?.payload.actionRestriction?.forcedStance
> );
> if (forced) { selectedStance = forced.payload.actionRestriction.forcedStance; }
> ```

### `payload.statModifiers`

```json
[
  { "stat": "heart",            "value": -2 },
  { "stat": "emotionalDefense", "value": -2 }
]
```

**PENDING (Phase 2).** Being forced to use heart while having heart penalised creates a
compounding effect — the charmed combatant is pushed into a weaker stance.

---

## How to Test

### 1. stacking none

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 2. forcedStance enforcement (Phase 2)

```
Target with Wigner's Friendship:
  - Every turn must use Heart stance (can still choose attack/defend)
  - Cannot select Body or Mind stances
  - Heart stat is penalised by -2 while forced into it
```

### 3. Unit tests to write

```typescript
describe('Wigners Friendship (debuff_charm)', () => {
  it('forcedStance heart enforced during action selection (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
