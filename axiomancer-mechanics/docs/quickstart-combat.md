# Quickstart — Combat

> Initialize combat, resolve rounds, and handle outcomes. For full
> API reference see [`combat.md`](./combat.md).

## Initialize combat

```typescript
import { createCharacter, createEnemy, initializeCombat } from 'axiomancer-mechanics';

const player = createCharacter({ name: 'P', level: 1, baseStats: { body: 4, mind: 4, heart: 4 } });
const enemy = createEnemy({
  id: 'test-foe', name: 'Test Foe', description: 'A sparring partner.',
  level: 1, baseStats: { body: 3, mind: 3, heart: 3 },
  mapName: 'test-map', logic: 'random',
});

const combat = initializeCombat(player, enemy);
// combat.player, combat.enemy, combat.round === 1
// combat.combatResources is the active player token pool:
// { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 }
// for an ungeared player; equipped item/set combat-start grants can seed it non-zero.
```

## Resolve a round

```typescript
import { resolveCombatRound } from 'axiomancer-mechanics';

const resolution = resolveCombatRound(combat, {
  playerAction: { stance: 'body', action: 'attack' },
});
// resolution.state — updated CombatState
// resolution.combatEvents — typed event stream (RoundEvent[])
```

## Subscribe to events

```typescript
for (const event of resolution.combatEvents) {
  switch (event.phase) {
    case 'scenario':
      if (event.kind === 'damage-applied') {
        console.log(`${event.target} took ${event.damage} damage`);
      }
      break;
    case 'skill':
      if (event.kind === 'effect-applied') {
        console.log(`${event.effect.name} applied to ${event.appliedTo}`);
      }
      break;
  }
}
```

## Friendship outcome path

Both combatants defending on the same round increments
`friendshipCounter`. At `FRIENDSHIP_COUNTER_MAX` (3), combat ends
with `outcome: 'friendship'`.

```typescript
import { determineCombatEnd } from 'axiomancer-mechanics';

const end = determineCombatEnd(resolution.state);
if (end) {
  // end.outcome: 'victory' | 'defeat' | 'friendship' | 'fled'
  // end.report.xpGained, end.report.loot, end.report.friendshipReward
}
```

## Combat action types

| Action | Effect |
|--------|--------|
| `attack` | Roll contest against opponent; winner deals damage |
| `defend` | Boost defense (3×/2×/1.5× by stance advantage); friendship +1 if both defend |
| `skill` | Execute a learned/unlocked skill via `executeSkill`; UI should show only currently affordable skills |
| `item` | Use a consumable from inventory |
| `flee` | Attempt escape (not always successful) |

## Deep-dive

- Event type reference: [`combat.md`](./combat.md) § Combat Reducer API
- Per-phase resolver: `src/Combat/phases/` (round-start, advantage, scenario, round-end)
- Friendship path: [`combat.md`](./combat.md) § Friendship Path
