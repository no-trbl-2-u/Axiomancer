# Quickstart — Combat

> Initialize a Hazard-Pattern Combat encounter, play cards, and handle
> outcomes. Hazard-Pattern Combat is the only combat engine. For full
> API reference see [`combat.md`](./combat.md) § Hazard-Pattern Combat.

## Initialize an encounter

```typescript
import { createCharacter, createEnemy, initializeCombatEncounter, rollEncounterDice } from 'axiomancer-mechanics';

const player = createCharacter({ name: 'P', level: 1, baseStats: { body: 4, mind: 4, heart: 4 } });
const enemy = createEnemy({
  id: 'test-foe', name: 'Test Foe', description: 'A sparring partner.',
  level: 1, baseStats: { body: 3, mind: 3, heart: 3 },
  mapName: 'test-map', logic: 'random',
});

let state = initializeCombatEncounter(player, enemy);
// state.phase === 'reveal' — opening hand drawn, dice not yet rolled.
// Optional args: a curated deck (string[] of card ids) and a seed for
// deterministic runs: initializeCombatEncounter(player, enemy, deck, seed)

({ state } = rollEncounterDice(state)); // opens phase-play and starts turn 1
```

## Play a turn

Every engine verb returns a `CombatTransition` — `{ state, events }` — so any
UI client (CLI, mobile, automated tester) can drive combat without
re-implementing the math.

```typescript
import { draftStanceDie, playCombatCard, endTurn } from 'axiomancer-mechanics';

// 1. Draft one of the rolled dice as your stance (the unpicked die grants Conviction).
({ state } = draftStanceDie(state, state.dice[0].id));

// 2. Play cards from hand. `useBottom: true` powers the full effect (spends a die);
//    `false` takes the free top action.
const entry = state.hand[0];
let t = playCombatCard(state, { uid: entry.uid }, true);
state = t.state;
// t.events — typed CombatEvent[] stream for rendering

// 3. Close the turn.
({ state } = endTurn(state));
```

## Enemy threat phase and upkeep

```typescript
import { resolveThreatPhase, processBetweenPhases } from 'axiomancer-mechanics';

({ state } = resolveThreatPhase(state));    // the enemy's telegraphed threat fires
({ state } = processBetweenPhases(state));  // DoT ticks, effect durations, fresh hand
```

## Outcomes

When `state.phase === 'complete'`, `state.outcome` is one of:

| Outcome | Meaning |
|---------|---------|
| `victory` | Enemy HP reached 0 (DoT erosion + strikes) |
| `mercy` | Spared a low-HP foe via Befriend + `spare` (the friendship path) |
| `defeat` | Player HP reached 0 |
| `retreat` | Player used the synthetic Retreat card |

```typescript
import { buildCombatSummary } from 'axiomancer-mechanics';

if (state.phase === 'complete') {
  const summary = buildCombatSummary(state);
  // summary.outcome + per-card attribution rows (DoT damage, strikes, phases)
}
```

## Simulate for balance evidence

```typescript
import { simulateHazardPatternCombat } from 'axiomancer-mechanics';

const stats = simulateHazardPatternCombat(player, enemy, 300);
// stats.winRate, stats.dotHpFraction, stats.avgActiveEffectsPerPhase, ...
```

## Deep-dive

- Full API surface: [`combat.md`](./combat.md) § Hazard-Pattern Combat API
- Stance draft / the read / Conviction / Signature Skills: [`combat.md`](./combat.md) § Spec 26 / 26b
- Deck building and presets: [`combat.md`](./combat.md) § Phase 169 — Curated Combat Loadout
- Playtest loop: [`playtest.md`](./playtest.md)
