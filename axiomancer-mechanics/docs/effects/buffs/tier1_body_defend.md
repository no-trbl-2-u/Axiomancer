# Briar Stance — `tier1_body_defend`

> *"You root yourself like a thorn bush — still, patient, dangerous. Striking you is a choice they'll regret. Every blow lands, but something sharp comes back."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `tier1_body_defend` |
| **Type** | buff |
| **Category** | defense |
| **Tier** | Tier 1 |
| **Duration** | 3 rounds |
| **Stacking** | intensity |
| **Resisted By** | — (auto-applies) |
| **Resist DR** | — |

---

## Description

Briar Stance is the automatic stance buff granted whenever the player or an enemy chooses
**Body + Defend**. The combatant plants themselves defensively and becomes a thorned
obstacle — every hit they receive bounces reflect damage back at the attacker.

It is a Tier 1 effect: auto-applies, no resist roll.

---

## Data Fields

### `duration: 3`

The buff lasts for 3 rounds. Like all Tier 1 stance buffs, duration resets each round
the matching action is repeated. Switching stance removes it immediately.

### `stacking: "intensity"`

Each Body/Defend action increments `intensity` by 1 (capped at 10). The reflect
damage formula scales directly with intensity:

```
reflect damage = reflectDamage × intensity = 1 × intensity
```

More consecutive Body/Defend rounds → higher intensity → more thorns damage per hit.

### `payload.reflectDamage: 1`

The core mechanic of this effect. For each point of `reflectDamage`, the attacker takes
`reflectDamage × intensity` damage every time they successfully hit the bearer.

**Where consumed:** `getThornsReflect(bearer)` in `src/Combat/index.ts`:

```typescript
return bearer.effects.reduce((total, ae) => {
    const def = lookupEffect(ae.effectId);
    const perIntensity = def?.payload.reflectDamage ?? 0;
    return total + perIntensity * (ae.intensity ?? 1);
}, 0);
```

This is called in `src/Combat/phases/scenario.ts` after every successful hit on the bearer. The returned
value is dealt as damage to the attacker.

**Status: LIVE** — fully implemented in the combat engine.

---

## Combat Behaviour

### How it is applied

`TIER1_EFFECT_MAP` maps `{ body, defend }` to:

```typescript
{ effectId: 'tier1_body_defend', target: 'self' }
```

Applied via `applyTier1CombatEffect` to the actor each round.
Default `intensityDelta: 1`, `durationMode: 'reset'`.

### Reflect damage table

| Intensity | Reflect per hit |
|-----------|----------------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 5 | 5 |
| 10 (cap) | 10 |

### When reflect triggers

The thorns check occurs in `src/Combat/phases/scenario.ts` after a successful attack resolution.
It fires regardless of the **attacker's** stance. Any enemy hit that lands on a Briar
Stance bearer triggers the reflect.

### When it is removed

- Stance switch: `clearTier1EffectsForStance` removes it immediately when any non-body
  stance is chosen.
- Natural expiry: `tickAllEffects` removes it after 3 rounds without a Body/Defend action.

---

## Interactions with Other Effects

- **`buff_reflect` (Russell's Mirror):** Russell's Mirror adds `defenseModifier +2` but
  does **not** have `reflectDamage`. These effects are distinct — Briar Stance is the
  only current source of `reflectDamage`.
- **Multiple thorns stacks:** `getThornsReflect` sums across all effects — if future
  effects also carry `reflectDamage`, they combine additively.
- **`tier1_body_attack` (Ad Baculum):** Mutual exclusion via `clearTier1EffectsForStance`:
  switching between Body/Attack and Body/Defend clears the previous body Tier 1 buff
  and replaces it. The ID prefix check (`ae.effectId.includes('_body_')`) preserves
  any **body**-typed Tier 1 effect, so actually both `tier1_body_attack` and
  `tier1_body_defend` share the `_body_` prefix — switching from attack to defend clears
  the attack buff and vice versa, since they are different IDs and only the current
  action's ID survives.

---

## How to Test

### 1. Verify Briar Stance applies on Body/Defend

```
Run: npm run game
Action: Body + Defend

Expected:
  - Combat log: "Briar Stance applied." or "Briar Stance intensified to N."
  - Effects panel: Briar Stance with intensity 1, duration 3.
```

### 2. Verify reflect damage fires on hit

```
Run: npm run game
Action: Body + Defend (intensity 1, reflect = 1)
If enemy attacks and hits:
  Expected:
    - Combat log: "[Enemy] hits for X damage."
    - Combat log: "Briar Stance reflects 1 damage back to [Enemy]."
    - Enemy health decreases by 1.
```

### 3. Verify reflect scales with intensity

```
Run: npm run game
  Round 1: Body + Defend → Briar Stance intensity 1 (reflect 1/hit)
  Round 2: Body + Defend → Briar Stance intensity 2 (reflect 2/hit)
  Round 3: Body + Defend → Briar Stance intensity 3 (reflect 3/hit)
  When enemy hits: expect 3 reflect damage.
```

### 4. Verify it clears on stance switch

```
Run: npm run game
  Round 1: Body + Defend → Briar Stance applied
  Round 2: Heart + Attack → Briar Stance cleared, Fleeting Kindness applied
           Effects panel: Briar Stance gone.
           Enemy attacks this round: no reflect damage.
```

### 5. Unit tests to write

```typescript
// src/Combat/index.test.ts (add to existing getThornsReflect suite)
describe('Briar Stance thorns (tier1_body_defend)', () => {
  it('getThornsReflect returns 0 with no thorns effect', () => { ... });
  it('getThornsReflect returns intensity × reflectDamage', () => { ... });
  it('getThornsReflect sums across multiple thorns effects', () => { ... });
  it('intensity increments on reapplication via applyEffect', () => { ... });
  it('cleared by clearTier1EffectsForStance on stance switch', () => { ... });
});
```
