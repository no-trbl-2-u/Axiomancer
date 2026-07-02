# Gettier's Flicker — `buff_gettiters_flicker`

> *"You don't truly know where to strike—your belief is justified and true, but only by coincidence. The attack lands anyway. Epistemology shrugs."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_gettiters_flicker` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 10 |

---

## Description

A minor Tier 1 buff that raises `luck` by 1. Like `buff_petitio_pulse`, it carries
`resistedBy` and `resistDR` fields (DR 10) but Tier 1 auto-apply bypasses the resist
check entirely. `stacking: 'none'`.

---

## Data Fields

### `payload.statModifiers`

```json
[{ "stat": "luck", "value": 1, "isMultiplier": false }]
```

`+1 luck`. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Gettiers Flicker (buff_gettiters_flicker)', () => {
  it('auto-applies (Tier 1) despite having resistedBy field', () => { ... });
  it('stacking none', () => { ... });
  it('+1 luck statModifier applied (Phase 2)', () => { ... });
});
```
