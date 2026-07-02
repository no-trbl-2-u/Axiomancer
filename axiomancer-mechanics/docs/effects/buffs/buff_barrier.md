# Gabriel's Horn — `buff_barrier`

> *"A shield of infinite surface but finite volume wraps around you—attacks spread across its endless expanse, their force diluted to nothing."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_barrier` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 pure defence buff with a flat `defenseModifier: +5` — the same value as
`buff_damage_reduction`. Provides no stat or roll modification; pure mitigation only.
Non-stackable.

---

## Data Fields

### `payload.defenseModifier: 5`

Flat +5 to defence calculations. This is the largest single `defenseModifier` among the
non-invincibility buffs.

> **PENDING (Phase 2):** Not yet applied in the combat damage path.

---

## How to Test

```typescript
describe('Gabriel Horn (buff_barrier)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('defenseModifier +5 applied in damage calculation (Phase 2)', () => { ... });
});
```
