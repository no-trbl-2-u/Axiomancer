# Post Hoc Tremor — `debuff_post_hoc_tremor`

> *"After the stumble came the strike—correlation mistaken for causation. Your muscles remember the sequence and flinch preemptively, just a little."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_post_hoc_tremor` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 10 |

---

## Description

A minor Tier 1 debuff applying `-1 body`. Auto-applies via Tier 1 path. Non-stackable.
Has `resistedBy: 'mind'` and `resistDR: 10` but these are unused.

---

## Data Fields

### `payload.statModifiers`

```json
[{ "stat": "body", "value": -1, "isMultiplier": false }]
```

`-1 body`. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Post Hoc Tremor (debuff_post_hoc_tremor)', () => {
  it('auto-applies (Tier 1) despite having resistedBy field', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
  it('-1 body statModifier applied (Phase 2)', () => { ... });
});
```
