# Ad Baculum — `tier1_body_attack`

> *"Your argument doesn't need words when your presence speaks volumes. You don't debate — you loom. Each exchange sharpens the edge of your conviction into something that leaves marks."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `tier1_body_attack` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | intensity |
| **Resisted By** | — (auto-applies) |
| **Resist DR** | — |

---

## Description

Ad Baculum is the automatic stance buff granted whenever the player or an enemy chooses
**Body + Attack**. It represents the combatant committing to physical dominance — threats
backed by force, presence made into leverage.

It is a Tier 1 effect: no resist roll is made, no dice are thrown. It always applies.

---

## Data Fields

### `duration: 2`

The buff lasts for 2 rounds once applied. However, because Body/Attack re-applies the
effect every round it is chosen, the duration effectively resets each time the action is
repeated — keeping it alive as long as the player continues Body attacking.

If the player switches to a different stance, `clearTier1EffectsForStance` removes this
buff immediately at the start of the new round.

### `stacking: "intensity"`

Each time Body/Attack is used, `intensity` increments by 1 (up to
`MAX_EFFECT_INTENSITY = 10`). Duration resets to 2 on each application
(`durationMode: 'reset'` default).

The intensity directly multiplies `rollModifierPerIntensity`:

```
roll bonus = rollModifierPerIntensity × intensity
           = 1 × intensity
```

So after 3 consecutive Body/Attack rounds, the roll bonus is `+3`. After 5, it is `+5`.

### `payload.statModifiers`

```json
[{ "stat": "physicalAttack", "value": 1, "isMultiplier": false }]
```

Adds `+1` to `physicalAttack`. This is a **flat** additive bonus to the derived stat
`physicalAttack`.

> **Implementation status — LIVE (since Spec 01):** `statModifiers` are folded into the
> combat math via `getEffectiveStats()` (`src/Combat/effect-modifiers.ts`), which feeds
> `getAttackStat` / `getDefenseStat` / `getSaveStat`
> (`src/Combat/stats.ts`) and the scenario phase (`src/Combat/phases/scenario.ts`).
> The "Phase 2" framing in older buff/debuff docs predates the engine wiring — see
> `docs/effects/README.md` for the full live-vs-pending table.

### `payload.rollModifierPerIntensity: 1`

Adds `1 × intensity` to every roll made by the bearer. This field **is live**
in the combat engine.

**Where consumed:** `getActiveRollModifier(target)` in `src/Combat/index.ts`:

```typescript
const perIntensity = (def?.payload.rollModifierPerIntensity ?? 0) * (ae.intensity ?? 1);
return total + flat + perIntensity;
```

This total is added to attack and damage rolls in `src/Combat/phases/scenario.ts`.

---

## Combat Behaviour

### How it is applied

Called every round via `applyTier1CombatEffect` in `src/Effects/index.ts`.
The `TIER1_EFFECT_MAP` maps `{ body, attack }` to:

```typescript
{ effectId: 'tier1_body_attack', target: 'self' }
```

No `applyOptions` override — defaults: `intensityDelta: 1`, `durationMode: 'reset'`.

The effect is applied to the **actor** (self), not the opponent.

### Round-by-round roll bonus

| Round using Body/Attack | Intensity | Roll bonus |
|------------------------|-----------|------------|
| 1 | 1 | +1 |
| 2 | 2 | +2 |
| 3 | 3 | +3 |
| … | … | … |
| 10 (cap) | 10 | +10 |

### When it is removed

- Stance switches: `clearTier1EffectsForStance` removes it immediately when any non-body
  stance is chosen.
- Natural expiry: `tickAllEffects` decrements `remainingDuration` each round; if the
  player skips Body/Attack for two rounds it expires.

---

## Interactions with Other Effects

- **`tier1_mind_mark` (Exposed Reasoning):** Mind/Attack adds the mark's intensity as a
  flat damage bonus. Ad Baculum's `rollModifierPerIntensity` is a separate roll bonus
  added on top.
- **`tier1_heart_attack` (Fleeting Kindness):** Fleeting Kindness applies
  `rollModifier: -5` to self. If active simultaneously, it penalises the roll, partially
  or fully offsetting Ad Baculum's bonus. These effects can coexist only if one was
  applied when the player used a different stance — because switching to Heart clears
  Body buffs. In practice they do not stack simultaneously in a normal combat flow.
- **Heart/Attack buff-extension:** `extendRandomBuffDuration` could extend this buff's
  duration if it happens to be selected.

---

## How to Test

### 1. Verify it auto-applies on Body/Attack

```
Run: npm run game
Choose: Any character vs any enemy
Action: Body + Attack

Expected:
  - Combat log shows "Ad Baculum applied." or "Ad Baculum intensified to N."
  - The Effects panel displays Ad Baculum with intensity 1 and duration 2.
```

### 2. Verify `rollModifierPerIntensity` scales the roll

```
Observation method (manual):
  - Use Body/Attack 3 rounds in a row.
  - Watch the roll total in the combat display.
  - Intensity reaches 3; every roll should include +3 on top of base stats.

Automated unit test approach:
  import { getActiveRollModifier } from 'src/Combat/index.ts';
  import { applyEffect } from 'src/Effects/index.ts';
  import { lookupEffect } from 'src/Effects/effects.library.ts';

  const effect = lookupEffect('tier1_body_attack')!;
  // Simulate 3 applications (intensity = 3)
  const { activeEffects } = applyEffect([], effect, 1);
  const { activeEffects: ae2 } = applyEffect(activeEffects, effect, 2);
  const { activeEffects: ae3 } = applyEffect(ae2, effect, 3);
  // ae3[0].intensity === 3
  // Create a mock target with these effects, then:
  const mod = getActiveRollModifier({ effects: ae3, ...mockTarget });
  assert(mod === 3); // 1 × 3
```

### 3. Verify it clears on stance switch

```
Run: npm run game
  Round 1: Body + Attack  → expect Ad Baculum applied (intensity 1)
  Round 2: Body + Attack  → expect Ad Baculum intensified (intensity 2)
  Round 3: Mind + Attack  → expect combat log: "Ad Baculum cleared" (or similar)
           Effect panel: Ad Baculum no longer listed.
```

### 4. Verify natural expiry

```
Run: npm run game
  Round 1: Body + Attack  → Ad Baculum applied (duration 2)
  Round 2: Heart + Attack → Ad Baculum cleared by stance switch
  -- OR --
  Round 1: Body + Attack  → Ad Baculum applied (duration 2)
  Round 2: (enemy stuns player — no Body/Attack) → duration ticks to 1
  Round 3: (any non-body action) → duration ticks to 0, expires
```

### 5. Unit tests to write

```typescript
// src/Effects/index.test.ts (add to existing suite)
describe('Ad Baculum (tier1_body_attack)', () => {
  it('applies automatically on Body/Attack', () => { ... });
  it('increments intensity on reapplication', () => { ... });
  it('resets duration on reapplication', () => { ... });
  it('is cleared by clearTier1EffectsForStance when switching to mind', () => { ... });
  it('is cleared by clearTier1EffectsForStance when switching to heart', () => { ... });
  it('roll bonus equals 1 × intensity via getActiveRollModifier', () => { ... });
});
```
