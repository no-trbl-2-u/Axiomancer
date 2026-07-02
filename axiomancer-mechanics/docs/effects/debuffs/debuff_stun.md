# Buridan's Paralysis — `debuff_stun`

> *"Like the ass between two hay bales, you cannot choose. Perfect rationality demands sufficient reason—and you have none. You stand frozen."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_stun` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 1 round |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 14 |

---

## Description

A Tier 2 stun debuff. Duration 1 round with duration-stacking (reapplication extends it).
The core mechanic is `skipTurn: true` — the target loses their next action. DR 14 reflects
the power of action denial.

---

## Data Fields

### `duration: 1`, `stacking: "duration"`

Short stun. Reapplication adds 1 round. Two applications → 2 rounds. Capped at 10.

### `resistDR: 14`

Above-average difficulty — action denial is valuable.

### `payload.actionRestriction.skipTurn: true`

The target should skip their next action (both attack and defend).

> **PENDING (Phase 2):** `skipTurn` is not yet enforced in `src/Combat/phases/scenario.ts`. When
> implemented, before a combatant's action is processed, check:
> ```typescript
> const canAct = !activeEffects.some(ae =>
>     lookupEffect(ae.effectId)?.payload.actionRestriction?.skipTurn === true
> );
> if (!canAct) { /* skip turn, emit log message */ }
> ```
> After resolving the skip, `tickAllEffects` still runs normally at end of round.

---

## How to Test

### 1. Duration stacks

```typescript
const { activeEffects: ae1 } = applyEffect([], effect, 1); // dur 1
const { activeEffects: ae2 } = applyEffect(ae1, effect, 2); // dur 2
assert(ae2[0].remainingDuration === 2);
```

### 2. skipTurn enforced (Phase 2)

```
Target with Buridan's Paralysis: cannot choose attack or defend this round.
Combat log: "[Target] is stunned and cannot act!"
After the round, duration ticks down.
```

### 3. Unit tests to write

```typescript
describe('Buridans Paralysis (debuff_stun)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('skipTurn prevents target action (Phase 2)', () => { ... });
  it('Tier 2 debuff: resist roll vs DR 14 + heartBonus', () => { ... });
});
```
