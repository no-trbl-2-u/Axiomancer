# Zeno's Stillness — `debuff_petrify`

> *"To move, you must first move half the distance. Then half again. Infinite steps in finite time—but your muscles refuse the mathematics."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_petrify` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 3 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 17 |

---

## Description

The only Tier 3 debuff in the game. Near-inescapable action denial — only a natural 20
repels it. Combines `skipTurn: true` with `defenseModifier: -4`, making the target
helpless and highly vulnerable for 2 rounds.

---

## Data Fields

### `tier: "Tier 3"`, `resistDR: 17`

Only a natural 20 on the resist roll prevents this debuff from applying. No DR
calculation needed — just a raw nat-20 check.

### `payload.actionRestriction.skipTurn: true`

Target cannot act. **PENDING (Phase 2).**

### `payload.defenseModifier: -4`

Flat -4 defence reduction. **PENDING (Phase 2).** The highest defence penalty among
control debuffs.

---

## Combat Behaviour

`resolveEffectApplication` Tier 3 path:

```typescript
if (roll === 20) {
    return { success: false, message: 'Miracle! An absolute will repelled the Tier 3 effect.' };
}
return { success: true, activeEffect, message: 'Inescapable...' };
```

---

## How to Test

### 1. Tier 3: only nat 20 repels

```typescript
// d20 = 19 → success: true, "Inescapable"
// d20 = 20 → success: false, "Miracle"
```

### 2. skipTurn + defenseModifier (Phase 2)

```
Target with Zeno's Stillness:
  - Cannot act for 2 rounds
  - Takes 4 more effective damage per hit
```

### 3. Unit tests to write

```typescript
describe('Zenos Stillness (debuff_petrify)', () => {
  it('Tier 3: only nat 20 repels it', () => { ... });
  it('skipTurn prevents action (Phase 2)', () => { ... });
  it('defenseModifier -4 (Phase 2)', () => { ... });
});
```
