# Liar's Shield — `buff_resistance_mind`

> *"'This thought will not harm me.' If true, you're protected. If false, the thought didn't harm you. Either way, mental attacks fail."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_resistance_mind` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 mental resistance buff mirroring `buff_resistance_body` for the mind stat
family. Raises `mind`, `mentalDefense`, and `mentalSave`. Duration-stacking.

---

## Data Fields

### `payload.statModifiers`

```json
[
  { "stat": "mind",          "value": 3 },
  { "stat": "mentalDefense", "value": 4 },
  { "stat": "mentalSave",    "value": 3 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Liars Shield (buff_resistance_mind)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('statModifiers: mind+3, menDef+4, menSave+3 (Phase 2)', () => { ... });
});
```
