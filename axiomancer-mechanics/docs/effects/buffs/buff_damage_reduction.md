# Dichotomy Shield — `buff_damage_reduction`

> *"Every attack must first travel half the distance. Then half again. Then half again. By the time it reaches you, its power approaches zero."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_damage_reduction` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 damage reduction buff with `defenseModifier: +5`. Mechanically identical to
`buff_barrier` (same payload, same tier, same stacking, same DR) — distinguished only
by thematic flavour. Both represent hard mitigation from different philosophical angles.

---

## Data Fields

### `payload.defenseModifier: 5`

Flat +5 to defence. **PENDING (Phase 2).** Identical to Gabriel's Horn.

---

## How to Test

```typescript
describe('Dichotomy Shield (buff_damage_reduction)', () => {
  it('defenseModifier +5 applied in damage calculation (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
