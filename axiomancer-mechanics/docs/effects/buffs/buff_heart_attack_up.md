# Bootstrap Passion — `buff_heart_attack_up`

> *"Your conviction creates itself—passion born from passion, an endless loop of emotional intensity that defies causal logic."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_heart_attack_up` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | body |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff that empowers Heart-stance attacks. Raises `heart` and `emotionalSkill`
and grants a flat roll bonus. The caster's body-derived defence is the resist stat for
the Tier 2 apply roll.

---

## Data Fields

### `resistedBy: "body"`, `resistDR: 13`

Caster rolls d20 + body defence vs DR 13.

### `payload.statModifiers`

```json
[
  { "stat": "heart",          "value": 2, "isMultiplier": false },
  { "stat": "emotionalSkill", "value": 3, "isMultiplier": false }
]
```

> **PENDING (Phase 2):** Not yet applied to derived stats.

### `payload.rollModifier: 2`

Flat +2 to all rolls. **LIVE** via `getActiveRollModifier`.

---

## Combat Behaviour

Identical Tier 2 apply mechanic as `buff_body_attack_up` and `buff_mind_attack_up`.
Nat 1 fizzles; nat 20 doubles intensity; otherwise intensity 1.

---

## How to Test

```typescript
describe('Bootstrap Passion (buff_heart_attack_up)', () => {
  it('rollModifier +2 applied via getActiveRollModifier', () => { ... });
  it('Tier 2: nat 20 doubles intensity, nat 1 fizzles', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
