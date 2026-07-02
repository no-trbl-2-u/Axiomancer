# Ad Hoc Patch — `buff_ad_hoc_patch`

> *"A tiny gap in your technique is hastily filled with an explanation invented after the fact. It shouldn't work. It barely does."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_ad_hoc_patch` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 10 |

---

## Description

A minor Tier 1 buff that raises `physicalSkill` by 1. Like the other low-tier "Tier 1
with resist fields" buffs, the resist check is bypassed by the Tier 1 auto-apply path.
`stacking: 'none'`.

---

## Data Fields

### `payload.statModifiers`

```json
[{ "stat": "physicalSkill", "value": 1, "isMultiplier": false }]
```

`+1 physicalSkill`. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Ad Hoc Patch (buff_ad_hoc_patch)', () => {
  it('auto-applies (Tier 1) despite having resistedBy field', () => { ... });
  it('stacking none', () => { ... });
  it('+1 physicalSkill statModifier applied (Phase 2)', () => { ... });
});
```
