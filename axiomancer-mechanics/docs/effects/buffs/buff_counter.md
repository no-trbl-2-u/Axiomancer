# Newcomb's Retribution — `buff_counter`

> *"Like the perfect predictor, you've already seen their attack coming. Your counterattack was prepared before they even decided to strike."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_counter` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 counter buff that grants a flat roll bonus and advantage on Body attacks.
Thematically represents predicting the enemy's action — ideal for a reactive playstyle.

---

## Data Fields

### `payload.rollModifier: 2`

Flat +2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.advantageModifier.grantAdvantage: ["body"]`

Advantage on Body-stance attacks only. **PENDING (Phase 2).**

---

## How to Test

### 1. rollModifier +2

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 2);
```

### 2. Body advantage (Phase 2)

```
Bearer's Body attacks should have advantage (+2 to roll or roll-twice-take-higher).
```

### 3. Unit tests to write

```typescript
describe('Newcomb Retribution (buff_counter)', () => {
  it('rollModifier +2 via getActiveRollModifier', () => { ... });
  it('grantAdvantage [body] pending Phase 2', () => { ... });
});
```
