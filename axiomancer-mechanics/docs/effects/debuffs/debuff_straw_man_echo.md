# Straw Man's Echo — `debuff_straw_man_echo`

> *"A weakened version of your intent was easily dismissed. You never argued for that—but the damage is done. Your confidence wavers, just slightly."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_straw_man_echo` |
| **Type** | debuff |
| **Category** | advantage |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 10 |

---

## Description

A minor Tier 1 debuff applying `rollModifier: -1`. Like the "Tier 1 with resist fields"
buffs, this carries `resistedBy` and `resistDR` but the Tier 1 path auto-applies without
a roll. Non-stackable, trivially easy to resist if the resist check were active (DR 10).

---

## Data Fields

### `tier: "Tier 1"` with `resistedBy: "body"`, `resistDR: 10`

Auto-applies. The resist fields are unused in the current engine.

### `payload.rollModifier: -1`

Flat -1 to all rolls. **LIVE** via `getActiveRollModifier`.

---

## How to Test

### 1. Auto-applies despite resist fields

```typescript
const result = resolveEffectApplication(target, activeEffect, 'debuff', 0, 0);
assert(result.success === true);
assert(result.message === 'Effect applied automatically.');
```

### 2. rollModifier -1

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -1);
```

### 3. Unit tests to write

```typescript
describe('Straw Mans Echo (debuff_straw_man_echo)', () => {
  it('auto-applies (Tier 1) despite having resistedBy field', () => { ... });
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
