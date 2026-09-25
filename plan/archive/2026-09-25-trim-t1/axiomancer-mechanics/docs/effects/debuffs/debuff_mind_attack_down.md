> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/debuffs/debuff_mind_attack_down.md`. Describes removed or never-built code; not a source of rules.

# GHZ Collapse — `debuff_mind_attack_down`

> *"Your thoughts were entangled in perfect correlation—until measurement. Now local realism fails. Your Mind attacks scatter incoherently."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_mind_attack_down` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 debuff targeting Mind attack capability. Reduces `mind` and `mentalSkill` plus
`rollModifier: -1`. Intensity-stacking. Heart is the resist stat (Mind effects resisted
by Heart in RPS).

---

## Data Fields

### `payload.rollModifier: -1`

**LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "mind",        "value": -2 },
  { "stat": "mentalSkill", "value": -3 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('GHZ Collapse (debuff_mind_attack_down)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
