# Achilles' Momentum — `buff_body_attack_up`

> *"Like Achilles chasing the tortoise, each strike brings you inexorably closer to overwhelming force. Your Body attacks gain devastating power."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `buff_body_attack_up` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 2 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | mind |
| **Resist DR** | 13 |

---

## Description

A Tier 2 buff that empowers Body-stance attacks. On successful application it raises the
bearer's `body` base stat and `physicalSkill` derived stat, plus a flat roll bonus. At
Tier 2, the caster rolls a d20 — a fumble (natural 1) causes it to fizzle; a crit
(natural 20) doubles the initial intensity.

---

## Data Fields

### `duration: 3`, `stacking: "intensity"`

Each successful reapplication increments `intensity` by 1 (capped at 10) and
resets duration to 3. At high intensity the roll bonus from stacking (via stat multiplier
when Phase 2 implements stat mods) grows proportionally.

### `resistedBy: "mind"`, `resistDR: 13`

Applying this buff requires rolling vs the caster's own mind defence (Tier 2 buff rule:
caster rolls, not the target). The target is self, so the resist stat is the caster's
own mind-derived defence. DR 13 is average difficulty.

### `payload.statModifiers`

```json
[
  { "stat": "body",          "value": 2, "isMultiplier": false },
  { "stat": "physicalSkill", "value": 3, "isMultiplier": false }
]
```

- `+2 body`: raises base Body stat, which feeds into physical derived stats.
- `+3 physicalSkill`: raises physical skill checks and skill-based actions.

> **PENDING (Phase 2):** These modifiers are not yet applied automatically to derived
> stats in the combat engine. They are defined and displayed but not mechanically active.

### `payload.rollModifier: 2`

A flat +2 to all dice rolls made by the bearer.

**LIVE:** `getActiveRollModifier` sums this with all other roll modifiers.

---

## Combat Behaviour

Applied via `resolveEffectApplication` (Tier 2 buff path). On application the caster rolls d20:
- Nat 1 → fizzles.
- Nat 20 → applies at 2× intensity (intensity 2 instead of 1 on first application).
- Other → applies at intensity 1.

On reapplication, `applyEffect` with `stacking: 'intensity'` increments `intensity`
and resets `remainingDuration` to 3.

**Effective roll bonus at intensity 1:** +2 (flat, from `rollModifier`).
**Stat bonus:** +2 body, +3 physicalSkill (pending Phase 2 activation).

---

## How to Test

### 1. Verify Tier 2 buff roll

```
Observe in combat log when this buff is applied (via skill or item):
- Nat 1: "Fumble! ... buff fizzles out."
- Nat 20: "Critical focus! ... double intensity."
- Other: "Buff applied."
```

### 2. Verify rollModifier +2

```typescript
// Mock target with one instance of this buff at intensity 1
const mod = getActiveRollModifier(mockTarget);
assert(mod === 2);
```

### 3. Verify intensity stacks roll modifier

```
Two applications (intensity 2): rollModifier is still +2 (flat, not per-intensity).
```

### 4. Verify fumble drops intensity on crit

```typescript
// Unit: resolveEffectApplication with mocked d20 = 20
// result.activeEffect.intensity should be 2 (1 × 2)
```

### 5. Unit tests to write

```typescript
describe('Achilles Momentum (buff_body_attack_up)', () => {
  it('applies rollModifier +2 to getActiveRollModifier', () => { ... });
  it('Tier 2 buff: nat 20 doubles intensity', () => { ... });
  it('Tier 2 buff: nat 1 returns success: false', () => { ... });
  it('intensity stacks on reapplication', () => { ... });
});
```
