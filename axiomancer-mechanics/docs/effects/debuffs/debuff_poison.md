# Curry's Corruption — `debuff_poison`

> *"If this poison harms you, then it spreads. The conditional is vacuously true. The conclusion is inevitably, recursively toxic."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_poison` |
| **Type** | debuff |
| **Category** | damage |
| **Tier** | Tier 2 |
| **Duration** | 4 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 damage-over-time debuff. Deals 3 damage per round of the `body` type.
Intensity-stacking — repeated successful applications build up accumulated DoT ticks.

---

## Data Fields

### `resistedBy: "mind"`, `resistDR: 13`

Target uses mind-derived defence vs DR 13. Body-type damage is resisted by Mind
(RPS rule: Body > Mind > Heart > Body, so Body effects are countered by Mind).

### `payload.damageOverTime`

```json
{ "damagePerRound": 3, "damageType": "body" }
```

Deals 3 damage per round, classified as `body` type. Intended to scale with intensity
in the full DoT implementation.

> **PENDING (Phase 2):** `damageOverTime` is not yet consumed in the combat engine.
> There is no DoT processing loop in `src/Combat/phases/scenario.ts` or `Combat/index.ts`. When
> implemented, `processDamageOverTime` should:
> ```typescript
> const dotDamage = damagePerRound * (ae.intensity ?? 1);
> target = applyDamage(target, dotDamage);
> ```

---

## Combat Behaviour

Currently no live mechanical effect in combat — the DoT loop is pending. The effect
applies and is tracked on the target, and expires via `tickAllEffects`, but does not
deal damage.

---

## How to Test

### 1. Effect applies and is tracked

```
Run: npm run game
Observe: poison applied to target → "Curry's Corruption applied" in combat log
Enemy effects panel: Curry's Corruption listed with duration/intensity
```

### 2. DoT damage (Phase 2 test)

```
Once implemented:
  intensity 1 → 3 damage/round
  intensity 2 → 6 damage/round
  Target health decreases by DoT amount at start of each round
```

### 3. Rebound / double duration on extreme rolls

```typescript
// Nat 20 → rebounded, attacker gets poisoned
// Nat 1  → double duration (8 rounds instead of 4)
```

### 4. Unit tests to write

```typescript
describe('Currys Corruption (debuff_poison)', () => {
  it('Tier 2 debuff: resist roll made against DR 13 + heartBonus', () => { ... });
  it('DoT 3 × intensity per round via processDamageOverTime (Phase 2)', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
