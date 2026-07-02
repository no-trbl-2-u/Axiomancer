# Unexpected Extension — `buff_buff_duration_up`

> *"Your buffs will end on a day you don't expect. But by knowing this, you can never truly expect it... so they never end when expected."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_buff_duration_up` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 12 |

---

## Description

A Tier 2 utility buff that extends buff durations. Provides a minor `rollModifier: +1`
as a live mechanical bonus. The thematic intent — extending other buffs — is not yet
mechanically implemented (it is separate from `extendRandomBuffDuration`, which is
triggered by Heart/Attack hits in the CLI).

---

## Data Fields

### `payload.rollModifier: 1`

Flat +1 to all rolls. **LIVE** via `getActiveRollModifier`. This is a minor live bonus.

---

## How to Test

```typescript
describe('Unexpected Extension (buff_buff_duration_up)', () => {
  it('rollModifier +1 via getActiveRollModifier', () => { ... });
});
```
