> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/debuffs/debuff_bleed.md`. Describes removed or never-built code; not a source of rules.

# Theseus' Dissolution — `debuff_bleed`

> *"Plank by plank, your ship comes apart. Drop by drop, you become less yourself. When does the bleeding stop being you?"*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_bleed` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 12 |

---

## Description

A Tier 2 bleed DoT. Deals 2 body-type damage per round. Easiest resist among the DoT
debuffs (DR 12). Intensity-stacking — multiple applications stack damage.

---

## Data Fields

### `payload.damageOverTime`

```json
{ "damagePerRound": 2, "damageType": "body" }
```

2 body-type DoT. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Theseus Dissolution (debuff_bleed)', () => {
  it('DoT 2 × intensity per round (Phase 2)', () => { ... });
  it('Tier 2 debuff: resist roll vs DR 12', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
