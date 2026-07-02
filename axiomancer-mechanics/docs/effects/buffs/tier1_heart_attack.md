# Fleeting Kindness — `tier1_heart_attack`

> *"Your strike carries no malice — just a gentle redirection. It doesn't hit as hard, but it reaches somewhere deeper. Something in the other combatant softens. Something in you holds on a little longer."*

---

## Quick Reference

| Field | Value |
|-------|-------|
| **ID** | `tier1_heart_attack` |
| **Type** | buff |
| **Category** | stat |
| **Tier** | Tier 1 |
| **Duration** | 2 rounds |
| **Stacking** | intensity |
| **Resisted By** | — (auto-applies) |
| **Resist DR** | — |

---

## Description

Fleeting Kindness is the automatic stance buff granted whenever the player or enemy
chooses **Heart + Attack**. The combatant attacks with compassion rather than force —
the strike is deliberately softened (`rollModifier: -5`), but it comes with two
on-hit specials unique to the Heart stance:

1. A random buff is **stripped** from the enemy.
2. A random buff on the player is **extended** by 1 round.

This makes Heart/Attack a high-risk, high-disruption choice: it damages your own
roll quality but manipulates the buff landscape.

Tier 1 — auto-applies, no resist roll.

---

## Data Fields

### `duration: 2`

Lasts 2 rounds. Resets on each Heart/Attack application. Removed on stance switch.

### `stacking: "intensity"`

Intensity increments each time Heart/Attack is used, but the penalty does **not**
scale with intensity — `rollModifier` is a flat value, not a `rollModifierPerIntensity`
field. Multiple stacks do not increase the penalty beyond -5.

The effect of intensity here is primarily that it keeps the duration alive through
repeated actions.

### `payload.rollModifier: -5`

Applies a flat **-5 penalty** to every attack/damage roll made by the bearer. This
intentional self-handicap is the "cost" of the Heart stance's buff manipulation utility.

**Where consumed:** `getActiveRollModifier(target)` in `src/Combat/index.ts`:

```typescript
const flat = def?.payload.rollModifier ?? 0;   // -5
return total + flat + perIntensity;
```

All active `rollModifier` values are summed. If the player also has Ad Baculum with
intensity 5 (+5), the net roll modifier is 0.

**Status: LIVE** — fully applied to attack and damage rolls.

---

## On-Hit Specials (Not in payload — driven by src/Combat/phases/scenario.ts)

The two Heart/Attack on-hit effects are implemented directly in `src/Combat/phases/scenario.ts`, not
via payload fields. They fire only when the Heart/Attack **hits** (attack resolves
successfully):

### 1. `removeRandomBuff(enemy)` — Strip enemy buff

Called from `src/Combat/phases/scenario.ts` after a successful Heart/Attack hit on the enemy.

```typescript
// src/Combat/index.ts
export function removeRandomBuff(target) {
    const buffs = target.effects.filter(
        ae => lookupEffect(ae.effectId)?.type === 'buff'
    );
    if (buffs.length === 0) return { target, removed: null };
    const removed = buffs[Math.floor(Math.random() * buffs.length)];
    const updated = target.effects.filter(ae => ae !== removed);
    return { target: { ...target, effects: updated }, removed };
}
```

Selects a **random** buff from the enemy's active effects and removes it entirely.
If the enemy has no buffs, the call returns `{ removed: null }` gracefully.

### 2. `extendRandomBuffDuration(player, 1)` — Extend player buff

Called from `src/Combat/phases/scenario.ts` after a successful Heart/Attack hit.

```typescript
// src/Combat/index.ts
export function extendRandomBuffDuration(target, amount) {
    const buffs = target.effects.filter(
        ae => lookupEffect(ae.effectId)?.type === 'buff'
    );
    if (buffs.length === 0) return { target, extended: null };
    const original = buffs[Math.floor(Math.random() * buffs.length)];
    const extended = { ...original,
        remainingDuration: Math.min(original.remainingDuration + amount, MAX_EFFECT_DURATION)
    };
    ...
}
```

Selects a random buff from the player's active effects and adds 1 round to its
`remainingDuration`, capped at `MAX_EFFECT_DURATION = 10`. If the player has no buffs,
no extension occurs.

---

## Combat Behaviour

### How it is applied

`TIER1_EFFECT_MAP` maps `{ heart, attack }` to:

```typescript
{ effectId: 'tier1_heart_attack', target: 'self' }
```

Applied to the actor. Default options.

### Trade-off summary

| What you get | What it costs |
|---|---|
| Strip 1 random enemy buff | -5 to your own roll |
| Extend 1 random player buff by 1 round | Roll penalty persists for 2 rounds |

### Combining with Ad Baculum

If a player built up Body/Attack stacks (Ad Baculum, high intensity) before switching to
Heart, the Ad Baculum buff is **cleared immediately** by `clearTier1EffectsForStance`. The
-5 from Fleeting Kindness is the dominant modifier on the first Heart/Attack round.

### When it is removed

- Stance switch: removed immediately when any non-heart stance is chosen.
- Natural expiry: removed after 2 rounds.

---

## Interactions with Other Effects

- **`buff_status_chance_up` (Monty's Advantage):** Adds `rollModifier +3`. Net modifier
  becomes -5 + 3 = -2.
- **`buff_accuracy_up` (Bertrand's Precision):** Adds `rollModifier +3`. Net modifier
  with Fleeting Kindness: -2.
- **`buff_all_stats_up` (Sorites Ascension):** Adds `rollModifier +1`. Net: -4.
- **`buff_haste` (Twin's Dilation):** Adds `rollModifier +4`. Net: -1. Plus advantage
  grants from Haste partially offset the penalty via RPS resolution.
- **`tier1_body_attack` (Ad Baculum):** Cannot coexist — switching to heart clears
  body buffs.

---

## How to Test

### 1. Verify -5 roll modifier is applied

```
Run: npm run game
  Action: Heart + Attack
  Expected:
    - Effects panel: Fleeting Kindness, rollModifier -5
    - Rolls are visibly reduced by 5 compared to baseline
    - getActiveRollModifier returns -5 (unit test)
```

### 2. Verify buff strip fires on hit

```
Run: npm run game
  Setup: Enemy has a buff active (e.g., enemy uses Body/Defend → Briar Stance)
  Action: Heart + Attack (must hit)
  Expected:
    - Combat log: "[Enemy]'s [Buff Name] was stripped away."
    - Enemy effects panel: that buff is gone.
  If enemy has no buffs:
    - No strip message, no error.
```

### 3. Verify buff extension fires on hit

```
Run: npm run game
  Setup: Player has any buff active
  Action: Heart + Attack (must hit)
  Expected:
    - Combat log: "[Buff Name] duration extended to N rounds."
    - Effects panel: that buff's remaining duration increased by 1.
  If player has no buffs:
    - No extension, no error.
```

### 4. Verify specials do NOT fire on miss

```
Run: npm run game
  Action: Heart + Attack that misses (watch for "Miss!" in combat log)
  Expected: no buff strip, no buff extension messages.
```

### 5. Unit tests to write

```typescript
// src/Combat/index.test.ts
describe('removeRandomBuff', () => {
  it('removes a random buff from target', () => { ... });
  it('returns { removed: null } when no buffs present', () => { ... });
  it('does not remove debuffs', () => { ... });
});

describe('extendRandomBuffDuration', () => {
  it('adds specified amount to a random buff duration', () => { ... });
  it('caps at MAX_EFFECT_DURATION', () => { ... });
  it('returns { extended: null } when no buffs present', () => { ... });
});

// src/Effects/index.test.ts
describe('Fleeting Kindness (tier1_heart_attack)', () => {
  it('rollModifier -5 is included in getActiveRollModifier', () => { ... });
  it('intensity stacks without increasing rollModifier penalty', () => { ... });
  it('cleared on non-heart stance switch', () => { ... });
});
```
