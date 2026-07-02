# Schrödinger's Focus — `buff_mind_attack_up`

> *"Your mind exists in superposition—simultaneously calculating every possible outcome until observation collapses into perfect execution."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_mind_attack_up` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff that empowers Mind-stance attacks, raising `mind` and `mentalSkill` and
granting a flat roll bonus. The apply roll is resisted by the caster's heart-derived
defence (Tier 2 buff rule: caster rolls vs their own stat). A fumble fizzles; a crit
doubles intensity.

---

## Data Fields

### `resistedBy: "heart"`, `resistDR: 13`

The caster rolls d20 vs DR 13. Their heart defence is the resist stat for this buff.

### `payload.statModifiers`

```json
[
  { "stat": "mind",        "value": 2, "isMultiplier": false },
  { "stat": "mentalSkill", "value": 3, "isMultiplier": false }
]
```

- `+2 mind`: raises mental base stat.
- `+3 mentalSkill`: raises mental skill checks and philosophy-bar progression.

> **PENDING (Phase 2):** Not yet applied automatically to derived stats.

### `payload.rollModifier: 2`

Flat +2 to all rolls. **LIVE** via `getActiveRollModifier`.

---

## Combat Behaviour

Tier 2 buff apply path in `resolveEffectApplication`. Nat 1 fizzles; nat 20 → intensity 2;
others → intensity 1. Reapplication increments intensity, resets duration.

The +2 roll modifier immediately affects attack rolls in `src/Combat/phases/scenario.ts`.

---

## How to Test

### 1. Roll modifier verification

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === 2);
```

### 2. Crit/fumble on apply

```
Nat 20 → intensity === 2, message contains "double intensity"
Nat 1  → success === false, message contains "fizzles"
```

### 3. Unit tests to write

```typescript
describe('Schrödinger Focus (buff_mind_attack_up)', () => {
  it('rollModifier +2 applied to getActiveRollModifier', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
  it('Tier 2: nat 20 doubles intensity, nat 1 fizzles', () => { ... });
});
```
