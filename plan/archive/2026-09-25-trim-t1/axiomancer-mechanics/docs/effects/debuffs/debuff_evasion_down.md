> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/debuffs/debuff_evasion_down.md`. Describes removed or never-built code; not a source of rules.

# Dartboard Certainty — `debuff_evasion_down`

> *"Every point has zero probability of being hit—yet something is always hit. Probability zero doesn't mean impossible. You will be struck."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_evasion_down` |
| **Type** | debuff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 debuff reducing all defence stats and adding a `defenseModifier: -3`. Duration-
stacking — long-term vulnerability through persistence rather than intensity.

---

## Data Fields

### `payload.defenseModifier: -3`

Flat -3 to defence. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "physicalDefense",  "value": -2 },
  { "stat": "mentalDefense",    "value": -2 },
  { "stat": "emotionalDefense", "value": -2 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Dartboard Certainty (debuff_evasion_down)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('defenseModifier -3 and all defence -2 (Phase 2)', () => { ... });
});
```
