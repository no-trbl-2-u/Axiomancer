# Braess Binding — `debuff_root`

> *"Adding options makes things worse. You could move, but seeing the paths available creates congestion in your muscles. Paralysis through possibility."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_root` |
| **Type** | debuff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 root debuff. Applies `defenseModifier: -2` and `rollModifier: -2`. The target
can still act but is weakened defensively and roll-wise. Duration-stacking.

---

## Data Fields

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.defenseModifier: -2`

Flat -2 to defence. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Braess Binding (debuff_root)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
  it('defenseModifier -2 applied in damage path (Phase 2)', () => { ... });
});
```
