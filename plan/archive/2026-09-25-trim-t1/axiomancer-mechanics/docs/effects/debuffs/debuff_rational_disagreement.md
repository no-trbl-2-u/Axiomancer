> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/debuffs/debuff_rational_disagreement.md`. Describes removed or never-built code; not a source of rules.

# Peer Doubt — `debuff_rational_disagreement`

> *"Your equal disagrees. You're both rational, both informed. Neither can claim superiority. Belief becomes impossible; action becomes paralysis."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_rational_disagreement` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 stat debuff targeting mental capability. Reduces `mind`, `mentalSkill`, and
`mentalDefense` plus `rollModifier: -2`. Duration-stacking, DR 12.

---

## Data Fields

### `payload.rollModifier: -2`

Flat -2 to all rolls. **LIVE** via `getActiveRollModifier`.

### `payload.statModifiers`

```json
[
  { "stat": "mind",          "value": -3 },
  { "stat": "mentalSkill",   "value": -2 },
  { "stat": "mentalDefense", "value": -1 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Peer Doubt (debuff_rational_disagreement)', () => {
  it('rollModifier -2 via getActiveRollModifier', () => { ... });
  it('duration stacks on reapplication', () => { ... });
});
```
