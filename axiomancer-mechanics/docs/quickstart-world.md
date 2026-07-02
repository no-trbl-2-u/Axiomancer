# Quickstart — World

> Resolve map events, author event pools, and apply alignment
> deltas. For full API reference see [`world.md`](./world.md).

## Resolve a map event

```typescript
import { resolveMapEvent } from 'axiomancer-mechanics';

const result = resolveMapEvent(gameState, 'fv-2');
// result.state — updated GameState (node consumed, adjacents revealed)
// result.events — MapEvent resolution events
// result.effects — { philosophicalShift?, ... }
```

## MapEventPool authoring

Each map node references a pool of weighted entries. The engine picks
one at random (via seeded RNG) when the player visits.

```typescript
import type { MapEventPoolEntry } from 'axiomancer-mechanics';

const entry: MapEventPoolEntry = {
  id: 'fv-2-shrine',
  kind: 'discovery',
  weight: 1,
  description: 'A weathered shrine at the crossroads.',
  payload: {
    items: [{ templateId: 'healing-potion', quantity: 1 }],
  },
  alignmentDelta: { outlook: 2 },
};
```

## Event kinds

| Kind | Payload shape | Example |
|------|--------------|---------|
| `discovery` | items, xp | Finding a hidden chest |
| `encounter` | enemySlug | Triggering a combat |
| `village` | shop?, dialogue? | Entering a settlement |
| `hazard` | effectId, damage | Environmental trap |
| `rest` | healPercent | Campfire rest stop |
| `dialogue` | treeId | NPC conversation |
| `trade` | wares | Wandering merchant |
| `puzzle` | — | Skill-check gate |

## Alignment deltas on map events

```typescript
// Authored on pool entries — applied AFTER the handler runs
const entry: MapEventPoolEntry = {
  id: 'nf-4-cave',
  kind: 'discovery',
  weight: 1,
  description: 'A cave mouth breathing cold air.',
  payload: { items: [] },
  alignmentDelta: { scope: -3 },  // pulls toward Individual axis
};
```

The delta is applied via `applyAlignmentDelta` after the event
resolves. Each axis clamps to `[-100, +100]`.

## Node traversal

```typescript
// After resolving a node, adjacents become available
const { availableNodes, discoveredNodes } = result.state.world;
// availableNodes: nodes the player can move to next
// discoveredNodes: all nodes ever seen (fog-of-war lifted)
```

## Deep-dive

- Map structure: [`world.md`](./world.md) § Map architecture
- Fishing village (25-node): [`world.md`](./world.md) § Fishing Village
- Alignment system: [`philosophy.md`](./philosophy.md) § Authoring deltas
