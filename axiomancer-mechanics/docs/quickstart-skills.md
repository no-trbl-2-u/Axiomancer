# Quickstart — Skills

> Execute skills, manage resources, and use the synergy system. For
> full API reference see [`skills.md`](./skills.md).

## Execute a skill in combat

```typescript
import { executeSkill, getSkillById, initializeCombat } from 'axiomancer-mechanics';

const combat = initializeCombat(player, enemy);
// Fund the resource pool (skills cost resources)
const state = { ...combat, combatResources: { heart: 0, body: 3, mind: 0, fallacy: 0, paradox: 0 } };

const { state: next, events } = executeSkill(state, 'achilles-gambit', getSkillById);
// next.enemy.health reduced by basePower + body × 0.5
// events includes { kind: 'damage', ... } + { kind: 'resources-spent', ... }
```

## Resource generation

The player’s castable resource pool lives on `CombatState.combatResources`.
It is seeded by `initializeCombat` from equipped item/set token grants, then
builds via player basic actions each round:

```typescript
import { generateBasicActionResources } from 'axiomancer-mechanics';

const pool = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
const after = generateBasicActionResources(pool, 'body', 'hit');
// after.body === 3 (hit on matching stance grants +3)
```

| Outcome | Tokens generated |
|---------|------------------|
| Attack hit | +3 of the player action's stance |
| Attack miss | +1 of the player action's stance |
| Defend | +5 of the player action's stance |

There is no separate off-stance award in the base table. Items and set bonuses
may add extra tokens through `resourceInteraction.generationBonus` / set
`generationBonus`; consumables may add tokens through `resourceGrant` when used
with the combat `item` action.

Skills read and spend this same `combatResources` pool. If `canUseSkill` fails,
the resolver emits `phase: 'skill', kind: 'blocked'` and the skill does not
resolve. On successful player casts, the engine spends `resourceCost` and mints
one Fallacy/Paradox token according to skill category/tier.

## Skill tiers

| Tier | Cost shape | Example |
|------|-----------|---------|
| 1 | Single resource (e.g. `{ mind: 3 }`) | `false-dilemma` — 4 mind damage + `debuff_confusion` |
| 2 | Dual resource (e.g. `{ body: 2, heart: 2 }`) | `mob-appeal` — 10 body damage + secondary self-heal |
| 3 | Resource + philosophical token (e.g. `{ heart: 2, paradox: 1 }`) | `bootstrap-paradox` — heart × 2 self-heal |

## Synergy-fired events

Tier 2 skills can carry a `synergy` clause that fires bonus damage
when conditions are met:

```typescript
// After executeSkill, check for synergy events
const synergy = events.find(e => e.kind === 'synergy-fired');
if (synergy) {
  console.log(`Synergy! +${synergy.bonusDamage} bonus damage`);
  console.log(`Consumed effects: ${synergy.consumedEffectIds.target}`);
}
```

## Effect application (post-Phase-80)

Skills with `combatEffects` apply effects via `resolveEffectApplication`:
- **Tier 1**: auto-applies (no roll)
- **Tier 2 debuff**: always lands (no resist roll)
- **Tier 3**: always lands (inescapable)
- **Tier 2 buff**: caster d20 fumble/crit (Nat 1 = `buff-fumbled`; Nat 20 = 2× intensity)

## Deep-dive

- Skill library: [`skills.md`](./skills.md) § Tier tables
- Synergy system: [`skills.md`](./skills.md) § Tier 2 synergy
- Enemy caster path: [`skills.md`](./skills.md) § Enemy caster path
- Effect application: [`effects.md`](./effects.md) § Application Rules
