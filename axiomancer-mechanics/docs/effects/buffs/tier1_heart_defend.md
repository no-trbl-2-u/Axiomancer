# Vital Empathy — `tier1_heart_defend`

> *"You stop fighting for a moment and simply exist. The stillness heals. The compassion you pour outward turns inward just enough — a quiet restoration, round by round."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `tier1_heart_defend` |
| **Type** | buff |
| **Category** | regeneration |
| **Tier** | Tier 1 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | — (auto-applies) |
| **Resist DR** | — |

---

## Description

Vital Empathy is the automatic stance buff granted whenever the player or enemy chooses
**Heart + Defend**. The combatant opens themselves emotionally, turning empathy inward
and recovering health each round. It is the primary free healing tool in the Tier 1
system.

Tier 1 — auto-applies, no resist roll.

---

## Data Fields

### `duration: 3`

Lasts 3 rounds. Resets each time Heart/Defend is chosen. Switching stance removes it
immediately.

### `stacking: "intensity"`

Each Heart/Defend action increments `intensity` by 1 (capped at 10). Because
`applyRegen` multiplies `healthPerRound × intensity`, stacking has a direct and
significant healing impact:

```
heal per round = healthPerRound × intensity = 1 × intensity
```

Committing to multiple Heart/Defend rounds is a meaningful healing investment.

### `payload.regeneration.healthPerRound: 1`

Restores `1 × intensity` HP at the **start of each round** (before the player
makes a choice). The higher the intensity, the more HP is recovered.

**Where consumed:** `applyRegen(target)` in `src/Combat/index.ts`:

```typescript
const perRound = def?.payload.regeneration?.healthPerRound ?? 0;
if (perRound <= 0) continue;          // skips negative values (disease/decay)
const amount = perRound * (ae.intensity ?? 1);
healed += amount;
updated = healCharacter(updated, amount);  // clamped to maxHealth
```

Called at the **start of each round** in `src/Combat/phases/scenario.ts`, before the player's action.

**Status: LIVE** — fully implemented.

---

## Combat Behaviour

### How it is applied

`TIER1_EFFECT_MAP` maps `{ heart, defend }` to:

```typescript
{ effectId: 'tier1_heart_defend', target: 'self' }
```

Applied to the actor. Default options: `intensityDelta: 1`, `durationMode: 'reset'`.

### Healing table

| Intensity | HP healed per round |
|-----------|---------------------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 5 | 5 |
| 10 (cap) | 10 |

### Heal timing

`applyRegen` is called at the very start of the round — step 1 of the round order —
before Tier 1 buff clearing, before the player's action, and before damage is dealt.
This means a combatant heals from regen even in the same round they switch stances (the
old effect is still present at heal time and is only removed in step 2).

### When it is removed

- Stance switch: `clearTier1EffectsForStance` removes it when any non-heart stance is chosen.
  However, because regen fires first in the round order, the final tick of healing still
  occurs on the round the stance changes.
- Natural expiry: `tickAllEffects` removes it after 3 rounds without Heart/Defend.

---

## Interactions with Other Effects

- **`buff_regeneration` (Tristram's Recovery):** Both effects are summed by `applyRegen`.
  Stacking Vital Empathy with Tristram's Recovery provides substantial per-round healing.
  Tristram's Recovery has `healthPerRound: 3` with intensity stacking — its contribution
  can far exceed Vital Empathy's at high intensity.
- **`buff_life_steal` (Maxwell's Siphon):** Also carries `healthPerRound: 2`. Summed with
  Vital Empathy by `applyRegen`.
- **`debuff_disease` / `debuff_hp_decay`:** Both carry negative `healthPerRound` values.
  The current `applyRegen` skips `perRound <= 0`, so these are not yet applied as a drain
  — they do not cancel or override Vital Empathy's healing.

---

## How to Test

### 1. Verify it applies on Heart/Defend

```
Run: npm run game
Action: Heart + Defend

Expected:
  - Combat log: "Vital Empathy applied."
  - Effects panel: Vital Empathy, intensity 1, duration 3.
```

### 2. Verify healing occurs at round start

```
Run: npm run game
  Round 1: Take some damage (any action where enemy hits)
  Round 2: Heart + Defend → Vital Empathy applied (intensity 1)
  Round 3: Heart + Defend → Vital Empathy intensified (intensity 2)
           At start of round 3: expect +2 HP healed (shown in combat log).
```

### 3. Verify healing is clamped to maxHealth

```
At full health, start of round with Vital Empathy active:
  Expected: healed = 0 (already at max); no overheal.
  Check that character.health === character.maxHealth after applyRegen call.
```

### 4. Verify intensity scales healing

```
Automated:
  import { applyRegen } from 'src/Combat/index.ts';

  const mockTarget = { ...baseCharacter, health: 50, maxHealth: 100,
    effects: [{
      effectId: 'tier1_heart_defend',
      remainingDuration: 3,
      intensity: 4,   // should heal 4 per round
      appliedAt: 1,
      tier: 'Tier 1'
    }]
  };
  const { healed } = applyRegen(mockTarget);
  assert(healed === 4);
  assert(mockTarget_updated.health === 54);
```

### 5. Verify stance switch clears it

```
Run: npm run game
  Round 1: Heart + Defend → Vital Empathy applied
  Round 2: Body + Attack  → Vital Empathy cleared
           Effects panel: Vital Empathy no longer listed.
```

### 6. Unit tests to write

```typescript
// src/Combat/index.test.ts (add to existing applyRegen suite)
describe('Vital Empathy (tier1_heart_defend)', () => {
  it('heals healthPerRound × intensity per round', () => { ... });
  it('does not overheal above maxHealth', () => { ... });
  it('intensity increments on reapplication', () => { ... });
  it('cleared by clearTier1EffectsForStance on stance switch', () => { ... });
  it('heal fires at start of round before action', () => { ... });
});
```
