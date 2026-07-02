# Ross-Littlewood Fall — `debuff_knockdown`

> *"At noon, how many balls remain? Your stance is like the paradox—adding and removing faster and faster until at the limit, nothing coherent remains."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_knockdown` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 1 round |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 knockdown debuff. Duration 1 round — a brief but impactful moment of
vulnerability. Heavy penalties: `defenseModifier: -4` and `rollModifier: -3`. Non-
stackable. The target is on the ground for one round.

---

## Data Fields

### `duration: 1`

Expires after one round. Effectively creates a single-round window of vulnerability.

### `payload.rollModifier: -3`

Flat -3 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.defenseModifier: -4`

Flat -4 to defence. **PENDING (Phase 2).** When implemented, this creates a significant
one-round damage window for follow-up attacks.

---

## How to Test

### 1. rollModifier -3

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -3);
```

### 2. Expires after 1 round

```typescript
const { target: t1, expired } = tickAllEffects(target);
assert(expired.some(ae => ae.effectId === 'debuff_knockdown'));
```

### 3. defenseModifier -4 (Phase 2)

```
Target with knockdown: takes 4 more effective damage on incoming attacks this round.
```

### 4. Unit tests to write

```typescript
describe('Ross-Littlewood Fall (debuff_knockdown)', () => {
  it('rollModifier -3 via getActiveRollModifier', () => { ... });
  it('expires after 1 round via tickAllEffects', () => { ... });
  it('defenseModifier -4 on incoming damage (Phase 2)', () => { ... });
});
```
