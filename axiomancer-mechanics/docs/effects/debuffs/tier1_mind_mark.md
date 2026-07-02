# Exposed Reasoning — `tier1_mind_mark`

> *"Every move, every tell — catalogued. The pattern is clear now. There's a gap in their argument, and you know exactly where it is. When the strike comes, it's not luck. It's inevitability."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `tier1_mind_mark` |
| **Type** | debuff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 1 round (per Mind/Attack stack) |
| **Stacking** | intensity |
| **Resisted By** | — (auto-applies; no resist roll for Tier 1 debuffs) |
| **Resist DR** | — |

---

## Description

Exposed Reasoning is the only Tier 1 **debuff** in the game. Unlike other Tier 1 effects
that self-apply, this mark is placed on the **opponent** by the actor using Mind-stance
actions. It represents methodical study — cataloguing the enemy's weaknesses and patterns
over multiple rounds.

The mark's `payload` is intentionally empty (`{}`). Its sole mechanical function is
carried by its **intensity**: the integer `intensity` is read directly by the
Mind/Attack damage formula as a flat damage bonus.

Tier 1 — auto-applies on opponent, no resist roll.

---

## Data Fields

### `duration: 1` + additive stacking

The base duration is 1 round per stack. However, Exposed Reasoning uses the
**additive duration mode** (`durationMode: 'additive'`). This means each application
adds to the remaining duration rather than resetting it.

Stack deltas per action:

| Action | intensityDelta | durationDelta |
|--------|----------------|---------------|
| Mind + Attack | +1 | +1 |
| Mind + Defend | +3 | +3 |

So three consecutive Mind/Attack rounds: `intensity = 3`, `remainingDuration = 3`.
One Mind/Defend round: `intensity = 3`, `remainingDuration = 3` in a single action.

The mark accumulates and persists across multiple rounds — making it a genuine build-up
mechanic rather than a one-shot apply.

### `stacking: "intensity"`

Intensity is the entire mechanical payload of this effect. Each stack directly adds to
the Mind/Attack damage bonus.

### `payload: {}` (empty)

The empty payload is intentional. The intensity value is the mechanic. This is read
directly via `getStudyMarkIntensity()` rather than through any payload field.

---

## Combat Behaviour

### How it is applied

`TIER1_EFFECT_MAP` maps Mind actions to:

```typescript
mind: {
  attack: { effectId: 'tier1_mind_mark', target: 'opponent',
            applyOptions: { intensityDelta: 1, durationMode: 'additive', durationDelta: 1 } },
  defend: { effectId: 'tier1_mind_mark', target: 'opponent',
            applyOptions: { intensityDelta: 3, durationMode: 'additive', durationDelta: 3 } },
}
```

Applied to the **opponent** via `applyTier1CombatEffect`. This is the only
Tier 1 effect that targets the opponent.

Because it is a **debuff** on the opponent, it is **never removed** by the actor's own
`clearTier1EffectsForStance` call (that call only removes the actor's own self-buffs).
The mark expires naturally via `tickAllEffects` on the opponent.

### Damage bonus formula

Called in `src/Combat/phases/scenario.ts` during Mind/Attack resolution:

```typescript
// src/Combat/index.ts
export function getStudyMarkIntensity(target: Character | Enemy): number {
    const mark = target.effects.find(e => e.effectId === MIND_MARK_ID);
    return mark?.intensity ?? 0;
}
```

The returned intensity is added as a flat `damageBonus` parameter to
`calculateFinalDamage`:

```typescript
// src/Combat/phases/scenario.ts (during Mind/Attack resolution)
const markBonus = getStudyMarkIntensity(enemy);
const finalDamage = calculateFinalDamage(baseDamage, reduction, isCritical, markBonus);
```

**Status: LIVE** — the mark intensity is consumed in combat.

### Build-up strategy

| Rounds of Mind/Defend | Intensity | Bonus damage on next Mind/Attack |
|-----------------------|-----------|----------------------------------|
| 1 | 3 | +3 |
| 2 | 6 | +6 |
| 3 | 9 | +9 |
| 4 | 10 (capped) | +10 |

| Rounds of Mind/Attack | Intensity | Bonus damage |
|-----------------------|-----------|--------------|
| 1 | 1 | +1 |
| 3 | 3 | +3 |
| 5 | 5 | +5 |
| 10 | 10 (capped) | +10 |

### Expiry

`tickAllEffects` is called on the opponent at the end of each round. With
`durationMode: 'additive'`, the remaining duration counts down from wherever it is.
If the actor stops using Mind actions, the mark eventually expires, wiping out the
accumulated intensity.

The player must maintain pressure to keep the mark's damage bonus alive.

---

## Interactions with Other Effects

- **`clearTier1EffectsForStance` on the opponent:** Enemies do not call
  `clearTier1EffectsForStance` for debuffs applied to them. The mark persists until
  expired by tick. (Only self-applied Tier 1 buffs on the actor are cleared on stance
  switch.)
- **`debuff_dispel` (Skolem's Reduction):** When the dispel mechanic is implemented,
  it would remove Exposed Reasoning along with other buffs/debuffs. Currently pending.
- **`buff_cleanse` (Barber's Paradox):** When cleanse is implemented, an enemy using
  it would remove the mark from themselves. Currently pending.

---

## How to Test

### 1. Verify mark is applied to opponent on Mind/Attack

```
Run: npm run game
Action: Mind + Attack
Expected:
  - Combat log: "Exposed Reasoning applied." (first time) or "Exposed Reasoning intensified."
  - Enemy effects panel: Exposed Reasoning, intensity 1, duration 1.
```

### 2. Verify Mind/Defend applies +3 intensity/duration

```
Run: npm run game
Action: Mind + Defend
Expected:
  - Enemy effects: Exposed Reasoning, intensity 3, duration 3 (first application).
  - Combat log: "Exposed Reasoning intensified to 3." (if already present)
```

### 3. Verify intensity is used as damage bonus on Mind/Attack

```
Run: npm run game
  Round 1: Mind + Defend → mark intensity 3
  Round 2: Mind + Attack → damage should include +3 bonus
           Combat log should show mark bonus in roll breakdown.
  Compare: same attack without mark → damage lower by 3.
```

### 4. Verify additive duration accumulates

```
Automated:
  import { applyEffect } from 'src/Effects/index.ts';
  import { lookupEffect } from 'src/Effects/effects.library.ts';

  const effect = lookupEffect('tier1_mind_mark')!;
  const opts1 = { intensityDelta: 1, durationMode: 'additive', durationDelta: 1 };
  const opts3 = { intensityDelta: 3, durationMode: 'additive', durationDelta: 3 };

  // Two Mind/Attack applications
  const { activeEffects: ae1 } = applyEffect([], effect, 1, opts1);
  const { activeEffects: ae2 } = applyEffect(ae1, effect, 2, opts1);
  assert(ae2[0].intensity === 2);
  assert(ae2[0].remainingDuration === 2);  // 1 + 1 additive

  // One Mind/Defend application on top
  const { activeEffects: ae3 } = applyEffect(ae2, effect, 3, opts3);
  assert(ae3[0].intensity === 5);
  assert(ae3[0].remainingDuration === 5);  // 2 + 3 additive
```

### 5. Verify mark expires via tickAllEffects

```
Automated:
  import { tickAllEffects } from 'src/Combat/index.ts';

  const target = { ...mockEnemy, effects: [{
    effectId: 'tier1_mind_mark', remainingDuration: 1, intensity: 3, ...
  }]};
  const { target: t1, expired } = tickAllEffects(target);
  assert(expired.length === 1);
  assert(t1.effects.length === 0);
```

### 6. Verify it is NOT cleared by actor's clearTier1EffectsForStance

```
The mark lives on the enemy, not the actor.
clearTier1EffectsForStance is called on the actor's own effects.
The enemy's effects array is separate — confirmed by checking that
the mark survives the player switching stances.
```

### 7. Unit tests to write

```typescript
// src/Combat/index.test.ts
describe('getStudyMarkIntensity', () => {
  it('returns 0 when no mark is present', () => { ... });
  it('returns intensity of tier1_mind_mark', () => { ... });
});

// src/Effects/index.test.ts
describe('Exposed Reasoning (tier1_mind_mark)', () => {
  it('target is opponent, not self', () => { ... }); // verify via applyTier1CombatEffect
  it('Mind/Attack applies +1/+1 delta', () => { ... });
  it('Mind/Defend applies +3/+3 delta', () => { ... });
  it('additive duration accumulates across applications', () => { ... });
  it('is not cleared by clearTier1EffectsForStance on actor', () => { ... });
});
```
