# Barber's Paradox — `buff_cleanse`

> *"You shave away only those effects that don't remove themselves. The logical impossibility resolves—all negative conditions vanish."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_cleanse` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 0 |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

An instant-cast cleanse effect. `duration: 0` marks it as an instant — it fires and
immediately expires, removing all negative debuffs from the caster. The payload is
intentionally empty (`{}`); the cleanse mechanic is implemented as an action on the
effect itself, not via a payload field.

---

## Data Fields

### `duration: 0`

Instant effect. Expires on the same round it is applied. `tickAllEffects` immediately
removes it (duration ticks to 0 → expelled).

### `payload: {}`

Empty. The actual "remove all debuffs" behaviour is a direct action that should be
triggered by detecting `duration === 0` and `id === 'buff_cleanse'` in the engine.

> **PENDING (Phase 2):** The cleanse mechanic — reading the player's `effects`
> and filtering out all `debuff`-type entries — is not yet implemented. Currently this
> effect has no mechanical effect. When implemented, use:
> ```typescript
> target.effects = target.effects.filter(
>     ae => lookupEffect(ae.effectId)?.type !== 'debuff'
> );
> ```

---

## How to Test

### 1. Instant expiry

```typescript
const target = { effects: [/* active cleanse */] };
const { target: t1, expired } = tickAllEffects(target);
assert(expired.some(ae => ae.effectId === 'buff_cleanse'));
assert(t1.effects.length === 0); // cleanse itself is gone
```

### 2. Cleanse removes debuffs (Phase 2)

```
Setup: Character has debuff_poison, debuff_stun, debuff_wound active.
Apply buff_cleanse.
Expected: all three debuffs removed; cleanse itself expires (duration 0).
```

### 3. Unit tests to write

```typescript
describe('Barber Paradox (buff_cleanse)', () => {
  it('duration 0 expires immediately via tickAllEffects', () => { ... });
  it('removes all active debuffs on application (Phase 2)', () => { ... });
  it('does not remove buff-type effects', () => { ... });
});
```
