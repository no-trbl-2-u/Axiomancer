# Pole in Barn — `buff_resistance_body`

> *"From your reference frame, physical attacks contract to fit within your defenses. Length becomes relative; harm becomes negotiable."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_resistance_body` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 physical resistance buff. Raises `body`, `physicalDefense`, and `physicalSave`.
Stacks by extending duration. Counter to Body-type attacks and debuffs.

---

## Data Fields

### `stacking: "duration"`

Each reapplication adds 4 rounds (capped at 10). Longer-lasting protection through
investment.

### `payload.statModifiers`

```json
[
  { "stat": "body",            "value": 3 },
  { "stat": "physicalDefense", "value": 4 },
  { "stat": "physicalSave",    "value": 3 }
]
```

Significant physical defences. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Pole in Barn (buff_resistance_body)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('statModifiers: body+3, physDef+4, physSave+3 (Phase 2)', () => { ... });
});
```
