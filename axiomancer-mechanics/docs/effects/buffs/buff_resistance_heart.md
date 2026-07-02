# Fiction's Wall — `buff_resistance_heart`

> *"You know emotional attacks aren't real—merely fictions. Yet somehow, knowing this provides genuine protection. The paradox shields you."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_resistance_heart` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | duration |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 emotional resistance buff mirroring `buff_resistance_body` for the heart stat
family. Raises `heart`, `emotionalDefense`, and `emotionalSave`. Duration-stacking.

---

## Data Fields

### `payload.statModifiers`

```json
[
  { "stat": "heart",            "value": 3 },
  { "stat": "emotionalDefense", "value": 4 },
  { "stat": "emotionalSave",    "value": 3 }
]
```

**PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Fictions Wall (buff_resistance_heart)', () => {
  it('duration stacks on reapplication', () => { ... });
  it('statModifiers: heart+3, emoDef+4, emoSave+3 (Phase 2)', () => { ... });
});
```
