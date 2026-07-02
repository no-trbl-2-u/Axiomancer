# Centipede's End — `debuff_hp_decay`

> *"Backward induction reveals the truth: at every step, you should have given up earlier. Your vitality unravels from the conclusion backward."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_hp_decay` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 compound HP decay debuff. Combines a DoT of 3 body-type damage per round with
`healthPerRound: -2` (healing suppression/drain). Together these create 5 effective HP
loss per round once both mechanics are implemented. Non-stackable.

---

## Data Fields

### `payload.damageOverTime`

```json
{ "damagePerRound": 3, "damageType": "body" }
```

3 body-type DoT per round. **PENDING (Phase 2).**

### `payload.regeneration.healthPerRound: -2`

Drains 2 HP per round (or cancels 2 HP of incoming regen).

> **PENDING (Phase 2):** `applyRegen` skips `perRound <= 0`. When implemented, negative
> values should be subtracted: HP decreases by 2 per round regardless of other healing.
> If the target also has positive regeneration (e.g. +3 from buff_regeneration), the
> net effect would be +1 HP/round.

---

## Design Note

At full implementation: Centipede's End deals 3 DoT body damage AND drains 2 HP per
round = 5 effective HP lost per round. As a non-stacking 4-round debuff, it can deal up
to 20 HP of effective drain in a full combat. This makes it one of the most damaging
sustained debuffs in the library.

---

## How to Test

### 1. DoT (Phase 2)

```
3 body-type damage at start of each round for 4 rounds.
```

### 2. Negative regen drain (Phase 2)

```
2 HP drained per round at start of each round.
Net with +3 regen active: 1 HP healed per round.
Net with no regen active: -2 HP per round.
```

### 3. Unit tests to write

```typescript
describe('Centipedes End (debuff_hp_decay)', () => {
  it('DoT 3/round body-type (Phase 2)', () => { ... });
  it('healthPerRound -2 drains HP (Phase 2)', () => { ... });
  it('net with positive regen = regen - 2 (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
