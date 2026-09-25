> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/buffs/buff_status_chance_up.md`. Describes removed or never-built code; not a source of rules.

# Monty's Advantage — `buff_status_chance_up`

> *"Like switching doors, you've learned that counterintuitive choices yield better odds. Your effects land more often than probability suggests."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_status_chance_up` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff that improves the chance of status effects landing. Provides a
`rollModifier: +3` that affects resist DRs (when applying effects, a higher roll modifier
on the attacker's heart bonus effectively raises the DR against the target, or when used
by the engine for the "attacker's side" of the roll).

Currently, `rollModifier: +3` is the only live mechanic.

---

## Data Fields

### `payload.rollModifier: 3`

Flat +3 to all rolls. **LIVE** via `getActiveRollModifier`. Same value as
`buff_accuracy_up` (`Bertrand's Precision`), making this one of the stronger flat roll
bonuses.

---

## How to Test

```typescript
describe('Monty Advantage (buff_status_chance_up)', () => {
  it('rollModifier +3 via getActiveRollModifier', () => { ... });
});
```
