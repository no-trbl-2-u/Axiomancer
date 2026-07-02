# Fermi's Absence — `buff_stealth`

> *"Where are you? The paradox of your existence—you should be detectable, yet no evidence of you can be found. You are the universe's silent contradiction."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_stealth` |
| **Type** | buff |
| **Category** | advantage |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | mind |
| **Resist DR** | 14 |

---

## Description

A Tier 2 stealth buff combining a high `defenseModifier` (+6) with advantage on all
stances. Short duration (2 rounds), non-stackable. The DR 14 reflects its significant
defensive power.

---

## Data Fields

### `payload.defenseModifier: 6`

The highest `defenseModifier` among non-invincibility buffs. **PENDING (Phase 2).**

### `payload.advantageModifier.grantAdvantage: ["body", "mind", "heart"]`

Advantage on all stance attacks while stealthed — all attacks are considered
surprise/flanking attacks. **PENDING (Phase 2).**

---

## How to Test

```typescript
describe('Fermi Absence (buff_stealth)', () => {
  it('stacking none: reapplication ignored', () => { ... });
  it('defenseModifier +6 applied (Phase 2)', () => { ... });
  it('grantAdvantage all stances (Phase 2)', () => { ... });
});
```
