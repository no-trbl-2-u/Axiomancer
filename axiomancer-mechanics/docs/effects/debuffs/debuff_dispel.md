# Skolem's Reduction — `debuff_dispel`

> *"Your infinite buffs are countable from outside. Enumerated, bounded, finite after all. The Löwenheim-Skolem theorem strips your power away."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_dispel` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 0 |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

An instant-cast dispel debuff. `duration: 0` — expires immediately. Empty payload
(`{}`). The mechanic is an action: remove all active buffs from the target. The debuff
counterpart to `buff_cleanse` (Barber's Paradox).

---

## Data Fields

### `duration: 0`

Instant effect. Applied and immediately expired in the same round.

### `payload: {}`

Empty. The "remove all buffs" mechanic should be triggered by the engine detecting
`duration === 0` and `id === 'debuff_dispel'`.

> **PENDING (Phase 2):** When implemented:
> ```typescript
> target.effects = target.effects.filter(
>     ae => lookupEffect(ae.effectId)?.type !== 'buff'
> );
> ```

---

## How to Test

### 1. Instant expiry

```typescript
const { target: t1, expired } = tickAllEffects(target);
assert(expired.some(ae => ae.effectId === 'debuff_dispel'));
```

### 2. Dispel removes buffs (Phase 2)

```
Setup: Target has buff_regeneration, buff_accuracy_up, tier1_body_attack active.
Apply debuff_dispel.
Expected: all three buffs removed; dispel itself expires.
```

### 3. Unit tests to write

```typescript
describe('Skolem Reduction (debuff_dispel)', () => {
  it('duration 0 expires immediately', () => { ... });
  it('removes all active buffs from target (Phase 2)', () => { ... });
  it('does not remove debuff-type effects', () => { ... });
});
```
