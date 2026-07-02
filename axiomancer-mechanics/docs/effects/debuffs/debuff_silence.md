# Moore's Muteness — `debuff_silence`

> *"You believe you can speak, yet you don't believe you're speaking. The absurdity freezes your voice. Assertion becomes impossible."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_silence` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 silence debuff blocking the heart stance and reducing heart-related stats.
The target cannot use Heart stance for 3 rounds, forcing them into Body or Mind.
Non-stackable.

---

## Data Fields

### `payload.actionRestriction.blockedStances: ["heart"]`

The target cannot choose the `heart` stance.

> **PENDING (Phase 2):** `blockedStances` is not yet enforced. When implemented:
> ```typescript
> const blocked = activeEffects.flatMap(ae =>
>     lookupEffect(ae.effectId)?.payload.actionRestriction?.blockedStances ?? []
> );
> // Filter available stances before presenting choices
> const availableStances = ALL_STANCES.filter(s => !blocked.includes(s));
> ```

### `payload.statModifiers`

```json
[
  { "stat": "heart",          "value": -2 },
  { "stat": "emotionalSkill", "value": -3 }
]
```

**PENDING (Phase 2).**

---

## How to Test

### 1. blockedStances enforced (Phase 2)

```
Target with Moore's Muteness cannot select Heart as their stance.
Heart option is greyed out or unavailable in the action menu.
```

### 2. stacking none

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 3. Unit tests to write

```typescript
describe('Moores Muteness (debuff_silence)', () => {
  it('blockedStances [heart] enforced (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
  it('statModifiers heart-2, emoSkill-3 applied (Phase 2)', () => { ... });
});
```
