> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/effects/buffs/buff_mind_defense_up.md`. Describes removed or never-built code; not a source of rules.

# Epistemic Shield — `buff_mind_defense_up`

> *"You know that you know that you know—infinite layers of meta-awareness create an impenetrable barrier against mental assault."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_mind_defense_up` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 buff that strengthens mental resilience, raising `mind`, `mentalDefense`, and
`defenseModifier`. Identical structure to `buff_body_defense_up` but targets the mental
stat family. Stacks by extending duration.

---

## Data Fields

### `payload.statModifiers`

```json
[
  { "stat": "mind",          "value": 2, "isMultiplier": false },
  { "stat": "mentalDefense", "value": 3, "isMultiplier": false }
]
```

> **PENDING (Phase 2):** Not yet applied to derived stats.

### `payload.defenseModifier: 2`

Flat +2 to mental defence calculations. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Epistemic Shield (buff_mind_defense_up)', () => {
  it('stacks by extending duration', () => { ... });
  it('caps at MAX_EFFECT_DURATION', () => { ... });
});
```
