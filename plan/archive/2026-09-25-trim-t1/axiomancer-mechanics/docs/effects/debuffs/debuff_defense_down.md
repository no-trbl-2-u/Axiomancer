> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/debuffs/debuff_defense_down.md`. Describes removed or never-built code; not a source of rules.

# Prisoner's Betrayal — `debuff_defense_down`

> *"Rational self-interest dictates you defect—leave yourself exposed. Individual logic produces collective disaster. Your defenses abandon you."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_defense_down` |
| **Type** | debuff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 defence reduction debuff combining `defenseModifier: -3`, `-1 body`, and
`-2 physicalDefense`. Intensity-stacking — repeated applications compound the defensive
vulnerability.

---

## Data Fields

### `payload.defenseModifier: -3`

Flat -3 to overall defence. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[
  { "stat": "body",            "value": -1 },
  { "stat": "physicalDefense", "value": -2 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Prisoners Betrayal (debuff_defense_down)', () => {
  it('intensity stacks on reapplication', () => { ... });
  it('defenseModifier -3 and physDef -2 in damage path (Phase 2)', () => { ... });
});
```
