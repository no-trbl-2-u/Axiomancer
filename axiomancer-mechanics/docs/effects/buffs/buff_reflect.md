# Russell's Mirror — `buff_reflect`

> *"You become the set of all things that reflect themselves. Attacks contain themselves, creating an impossible recursion that rebounds to sender."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_reflect` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 2 |
| **Duration** | 2 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 defensive buff with a small `defenseModifier: +2`. Despite the thematic
"reflect" name, it uses `defenseModifier` rather than `reflectDamage`. The thorns
mechanic is exclusively on `tier1_body_defend`. Russell's Mirror is a soft defense
buff, not a thorns effect.

Non-stackable, 2-round duration.

---

## Data Fields

### `payload.defenseModifier: 2`

Flat +2 to defence. **PENDING (Phase 2).**

Note: this effect has **no** `reflectDamage` in its payload despite the flavour name.
Developers looking for the thorns mechanic should refer to `tier1_body_defend`.

---

## How to Test

```typescript
describe('Russell Mirror (buff_reflect)', () => {
  it('defenseModifier +2 applied in damage calculation (Phase 2)', () => { ... });
  it('does NOT have reflectDamage — no thorns mechanic', () => {
    const def = lookupEffect('buff_reflect')!;
    assert(def.payload.reflectDamage === undefined);
  });
});
```
