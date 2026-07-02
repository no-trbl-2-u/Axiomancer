# Game

## Overview

The Game module provides the central orchestration layer for Axiomancer mechanics, including game state management, persistence, event system, and core game loop coordination. All game logic flows through the `gameReducer` per Spec 09's architectural rule.

Key components live in:

- `Game/store.ts` — Framework-agnostic Zustand store with selectors and legacy action methods
- `Game/game.reducer.ts` — Pure dispatch spine handling all game state mutations  
- `Game/types.ts` — `GameState` root object and related type definitions
- `Game/events.ts` — Game event emitter for UI and integration consumers
- `Game/persistence/` — Save/load adapters for different platforms
- `Game/game-mechanics.constants.ts` — Core game balance constants and multipliers

## Game State

The `GameState` type is the root object that aggregates all game data:

| Property | Type | Purpose |
|----------|------|---------|
| `version` | `number` | Schema version for save file migration |
| `player` | `Character` | Player character with stats, equipment, skills |
| `world` | `WorldState` | Current region, map position, and world flags |
| `combat` | `CombatState \| null` | Active combat encounter or null when exploring |
| `currentEncounter` | `Encounter \| null` | Full encounter context (transient, not saved) |
| `quests` | `QuestLog` | Player's quest progress and objectives |
| `moralMeter` | `number` | Moral choice alignment (-100 to +100) |
| `philosophicalAlignment` | `PhilosophicalAlignment` | Three-axis philosophy cube |
| `factionReputations` | `FactionReputations` | Standing with various factions |
| `codex` | `CodexState` | Unlocked journal entries and lore |
| `runId` | `string` | Unique identifier for this playthrough |
| `rngState` | `number` | Deterministic RNG seed state |

## Store and Actions

### Creating a Game Store

```typescript
import { createGameStore, createEventEmitter } from 'axiomancer-mechanics';
import { createNodeAdapter } from 'axiomancer-mechanics/node';

const events = createEventEmitter();
const store = createGameStore(createNodeAdapter(), undefined, events);

// React Native usage
const store = createGameStore(asyncStorageAdapter);
const player = useStore(store, s => s.player);
```

### Action Dispatch

All state changes go through the store's `dispatch` method with typed `GameAction` objects:

```typescript
// Start combat
store.getState().dispatch({ 
  type: 'START_COMBAT', 
  payload: { target: enemy } 
});

// End combat with rewards
store.getState().dispatch({ 
  type: 'END_COMBAT', 
  payload: { report: combatEndReport } 
});

// Learn a skill
store.getState().dispatch({ 
  type: 'LEARN_SKILL', 
  payload: { skillId: 'skill_heart_barrier' } 
});
```

### Legacy Action Methods

For backward compatibility, the store provides legacy method-style actions:

| Method | Purpose |
|--------|---------|
| `startCombat(enemy)` | Begin combat with specified enemy |
| `endCombat(report)` | End combat and apply rewards |
| `learnSkill(skillId)` | Learn a skill by ID |
| `useSkill(skillId, targetId?)` | Use a skill in combat |
| `useItem(itemId, targetId?)` | Use an item |
| `equipItem(item, slot)` | Equip an item to a slot |
| `unequipItem(slot)` | Remove equipped item |

## State Selectors

The store provides typed selectors for common queries:

| Selector | Return Type | Purpose |
|----------|-------------|---------|
| `selectPlayer(state)` | `Character` | Current player character |
| `selectCombat(state)` | `CombatState \| null` | Active combat state |
| `selectCombatState(state)` | `CombatState` | Combat state (throws if null) |
| `selectIsInCombat(state)` | `boolean` | Whether player is in combat |
| `selectInventory(state)` | `Item[]` | Player inventory items |
| `selectVersion(state)` | `number` | Game state schema version |
| `selectMoralMeter(state)` | `number` | Current moral alignment |

## Game Reducer

The `gameReducer` is a pure function that handles all game state transitions:

```typescript
function gameReducer(state: GameState, action: GameAction): GameState
```

### Supported Action Types

| Action Type | Purpose |
|-------------|---------|
| `START_COMBAT` | Initialize combat with an enemy |
| `END_COMBAT` | Apply combat rewards and cleanup |
| `USE_SKILL` | Execute a skill during combat |
| `USE_ITEM` | Use a consumable or equipment item |
| `EQUIP_ITEM` / `UNEQUIP_ITEM` | Manage character equipment |
| `LEARN_SKILL` | Add a skill to character's known skills |
| `ADVANCE_DIALOGUE` | Progress through NPC conversations |
| `MAKE_MORAL_CHOICE` | Record player moral decisions |
| `UPDATE_QUEST_OBJECTIVES` | Progress quest completion |
| `SET_FLAG` / `CLEAR_FLAG` | Manage world state flags |
| `TRAVEL_TO` | Move player between regions |
| `RESET_RUN` | Start a new playthrough |

## Events System

The Game module provides a type-safe event emitter for integration:

### Creating an Event Emitter

```typescript
import { createEventEmitter } from 'axiomancer-mechanics';

const events = createEventEmitter();
events.on('combat:started', (event) => {
  console.log(`Combat started with ${event.enemy.name}`);
});
```

### Event Types

| Event | Payload | When Emitted |
|-------|---------|--------------|
| `combat:started` | `{ enemy: Enemy }` | Combat begins |
| `combat:ended` | `{ outcome: string, report: CombatEndReport }` | Combat concludes |
| `skill:learned` | `{ skillId: string }` | Player learns new skill |
| `quest:updated` | `{ questId: string, objectives: ObjectiveProgress[] }` | Quest progress changes |
| `alignment:changed` | `{ moralMeter: number, philosophical: PhilosophicalAlignment }` | Player alignment shifts |
| `faction:reputation:changed` | `{ factionId: string, reputation: number }` | Faction standing changes |

## Persistence

### Persistence Adapters

The Game module supports multiple persistence backends:

```typescript
import { nullAdapter } from 'axiomancer-mechanics';
import { createNodeAdapter } from 'axiomancer-mechanics/node';

// No persistence (testing)
const store = createGameStore(nullAdapter);

// File system (Node.js)
const store = createGameStore(createNodeAdapter());

// Custom adapter
const store = createGameStore({
  save: async (data) => { /* save logic */ },
  load: async () => { /* load logic */ },
  exists: async () => { /* check logic */ }
});
```

### Save File Migration

The Game module automatically migrates save files when the schema version changes:

```typescript
import { migrate, GAME_STATE_VERSION } from 'axiomancer-mechanics';

// Migrate old save to current version
const currentState = migrate(oldSaveData, oldVersion, GAME_STATE_VERSION);
```

## Game Mechanics Constants

Core balance values are defined in `game-mechanics.constants.ts`:

| Constant | Value | Purpose |
|----------|-------|---------|
| `STAT_MULTIPLIERS.ATTACK` | `1` | Base stat to attack conversion |
| `STAT_MULTIPLIERS.DEFENSE` | `3` | Base stat to defense conversion |
| `STAT_MULTIPLIERS.SKILL` | `1` | Base stat to skill power conversion |
| `RESOURCE_MULTIPLIERS.HP` | `10` | Base (body + heart) to HP conversion |
| `EXPERIENCE_PER_LEVEL` | `100` | XP required per level |
| `STAT_POINTS_PER_LEVEL` | `2` | Stat points gained per level |
| `DEFENSE_MULTIPLIERS` | `{ advantage: 3, neutral: 2, disadvantage: 1.5 }` | Active defense stance bonuses |
| `PASSIVE_DEFENSE_MULTIPLIER` | `1` | Defense multiplier when not in active defense stance |
| `MAX_EFFECT_INTENSITY` | `10` | Maximum effect stack intensity |
| `MAX_EFFECT_DURATION` | `99` | Maximum effect duration in rounds |
| `FRIENDSHIP_COUNTER_MAX` | `3` | Befriend attempts before success |

## Run Loop and State Management

### Run Identifiers

Each playthrough gets a unique run identifier:

```typescript
import { generateRunId, STARTING_REGION } from 'axiomancer-mechanics';

const newGameState = createNewGameState({
  runId: generateRunId(), // Timestamp-based ID
  startingRegion: STARTING_REGION // 'coastal-village'
});
```

### New Game Creation

```typescript
import { createNewGameState } from 'axiomancer-mechanics';

const initialState = createNewGameState({
  character: customCharacter, // Optional
  startingRegion: 'coastal-village', // Optional
  runId: 'custom-run-id' // Optional
});
```

## Integration Examples

### Basic Game Loop

```typescript
import { createGameStore, createEventEmitter } from 'axiomancer-mechanics';
import { nullAdapter } from 'axiomancer-mechanics';

const events = createEventEmitter();
const store = createGameStore(nullAdapter, undefined, events);

// Subscribe to events
events.on('combat:started', ({ enemy }) => {
  console.log(`Fighting ${enemy.name}!`);
});

events.on('combat:ended', ({ outcome, report }) => {
  if (outcome === 'victory') {
    console.log(`Victory! Gained ${report.expGained} XP`);
  }
});

// Start combat
const state = store.getState();
state.dispatch({ 
  type: 'START_COMBAT', 
  payload: { target: someEnemy } 
});
```

### React Native Integration

```typescript
import { useStore } from 'zustand';
import { createGameStore } from 'axiomancer-mechanics';

const store = createGameStore(asyncStorageAdapter);

function PlayerStatus() {
  const player = useStore(store, s => s.player);
  const isInCombat = useStore(store, s => s.combat !== null);
  
  return (
    <View>
      <Text>Level {player.level}</Text>
      <Text>HP: {player.currentHP}/{player.maxHP}</Text>
      {isInCombat && <Text>In Combat!</Text>}
    </View>
  );
}
```

## Architecture Notes

The Game module follows these design principles:

1. **Pure Reducers**: All state mutations go through the pure `gameReducer`
2. **Side Effect Separation**: Store handles persistence, events, and other side effects
3. **Type Safety**: All actions and state transitions are fully typed
4. **Framework Agnostic**: Core logic works in Node.js and React Native
5. **Event-Driven**: UI components can subscribe to game events for reactive updates
6. **Deterministic**: RNG state is persisted for reproducible playthroughs