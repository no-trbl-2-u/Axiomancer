# Crocodile's Promise — `buff_taunt`

> *"You present enemies with an impossible choice—attack you or face worse consequences. Like the child-stealing crocodile, your logic traps them."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_taunt` |
| **Type** | buff |
| **Category** | control |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | body |
| **Resist DR** | 12 |

---

## Description

A Tier 2 taunt buff. Grants a small defence bonus and a `+1 body` stat modifier. The
"control" category reflects that taunting is a battlefield control mechanic — the intent
is to force the enemy to attack the taunter rather than allies (relevant in multi-target
scenarios). With a single enemy target, its effect in combat is limited to the stat
modifier and defence bonus.

---

## Data Fields

### `payload.defenseModifier: 2`

Flat +2 to defence. **PENDING (Phase 2).**

### `payload.statModifiers`

```json
[{ "stat": "body", "value": 1, "isMultiplier": false }]
```

`+1 body`. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Crocodile Promise (buff_taunt)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('defenseModifier +2 applied in damage calculation (Phase 2)', () => { ... });
});
```
