# Problem of Evil — `debuff_berserk`

> *"If you are all-powerful, why do you suffer? If all-knowing, why not prevent it? Your rage at the paradox consumes reason—omnipotent fury, impotent wisdom."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_berserk` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | none |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A uniquely double-edged Tier 2 debuff. It raises physical stats significantly while
crushing mental and emotional capabilities. The target becomes a brute — stronger
physically but losing tactical options and defence. The `defenseModifier: -3` represents
reckless fury.

---

## Data Fields

### `payload.statModifiers` (mixed positive and negative)

```json
[
  { "stat": "body",          "value":  3 },
  { "stat": "mind",          "value": -4 },
  { "stat": "heart",         "value": -2 },
  { "stat": "physicalSkill", "value":  2 },
  { "stat": "mentalSkill",   "value": -3 },
  { "stat": "mentalDefense", "value": -2 }
]
```

**PENDING (Phase 2).** Body and physicalSkill increase; mind, heart, mentalSkill, and
mentalDefense decrease.

### `payload.defenseModifier: -3`

Overall defence penalty — being berserk means poor blocking technique.
**PENDING (Phase 2).**

---

## Design Note

This is a "curse as power" debuff — the attacker might intentionally inflict berserk on
a naturally high-mind enemy to shift them from tactical play to pure brute force. Comes
at the cost of giving them more physical attack power.

---

## How to Test

### 1. stacking none

```typescript
const { result } = applyEffect(ae1, effect, 2);
assert(result.success === false);
```

### 2. Mixed stat modifiers (Phase 2)

```
Target with berserk active:
  body+3, physicalSkill+2 → more physical damage
  mind-4, mentalSkill-3, mentalDefense-2 → weaker mental attacks/defence
  defenseModifier-3 → easier to damage overall
```

### 3. Unit tests to write

```typescript
describe('Problem of Evil (debuff_berserk)', () => {
  it('raises body/physSkill while reducing mind/heart/menDef (Phase 2)', () => { ... });
  it('defenseModifier -3 applied (Phase 2)', () => { ... });
  it('stacking none: reapplication ignored', () => { ... });
});
```
