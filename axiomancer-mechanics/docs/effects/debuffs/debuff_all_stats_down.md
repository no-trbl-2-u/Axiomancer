# Heap's Collapse — `debuff_all_stats_down`

> *"One grain of weakness means nothing. But grain by grain, imperceptibly, you've ceased to be a heap of power at all."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `debuff_all_stats_down` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | heart |
| **Resist DR** | 13 |

---

## Description

A Tier 2 debuff that reduces all three base stats and all three skill stats, plus a
flat roll penalty. The target rolls heart-defence to resist (DR 13). Intensity-stacking
— each successful reapplication deepens the penalty (once Phase 2 activates stat mods).

---

## Data Fields

### `resistedBy: "heart"`, `resistDR: 13`

Target rolls `d20 + heartDefence vs DR 13`. Heart is the resist stat — Body attacks
(from the RPS rule) are resisted by Mind; Mind effects by Heart; Heart effects by Body.
A debuff affecting all stats doesn't map cleanly to one RPS type, so `heart` resist was
chosen by design.

### `payload.rollModifier: -1`

Flat -1 to all rolls. **LIVE** via `getActiveRollModifier`. Applies immediately on
successful landing.

### `payload.statModifiers`

```json
[
  { "stat": "body",           "value": -2 },
  { "stat": "mind",           "value": -2 },
  { "stat": "heart",          "value": -2 },
  { "stat": "physicalSkill",  "value": -1 },
  { "stat": "mentalSkill",    "value": -1 },
  { "stat": "emotionalSkill", "value": -1 }
]
```

Broad penalty to all combat stats. **PENDING (Phase 2).**

---

## Combat Behaviour

### Resist roll

`resolveEffectApplication(target, activeEffect, 'debuff', attackerHeartBonus, equipmentBonus)`:

```
DR   = 13 + attacker.baseStats.heart + equipBonus
Roll = d20 + target.derivedStats.heartDefence (via getSaveStat)
```

- Nat 20 → rebounds to attacker at 2× intensity
- Nat 1  → double duration lands
- Roll ≥ DR → resisted
- Roll < DR → lands normally

### Live effect: rollModifier -1

Immediately reduces all attack/damage rolls by 1 once landed.

---

## How to Test

### 1. rollModifier -1 applied

```typescript
const mod = getActiveRollModifier(targetWithEffect);
assert(mod === -1);
```

### 2. Intensity stacks (rollModifier stays flat)

```typescript
// Two applications (intensity 2): rollModifier still -1
```

### 3. Rebound on nat 20

```typescript
// Mock resolveEffectApplication d20 = 20
// result.rebounded === true
// result.activeEffect.intensity === 2 (doubled)
```

### 4. Unit tests to write

```typescript
describe('Heaps Collapse (debuff_all_stats_down)', () => {
  it('rollModifier -1 via getActiveRollModifier', () => { ... });
  it('Tier 2 debuff: nat 20 rebounds', () => { ... });
  it('Tier 2 debuff: nat 1 doubles duration', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
