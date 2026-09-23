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
| `player` | `Character` | Player character with stats, equipment, cards |
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

// Learn a card
store.getState().dispatch({ 
  type: 'LEARN_CARD', 
  payload: { skillId: 'skill_heart_barrier' } 
});
```

### Legacy Action Methods

For backward compatibility, the store provides legacy method-style actions:

| Method | Purpose |
|--------|---------|
| `startCombat(enemy)` | Begin combat with specified enemy |
| `endCombat(report)` | End combat and apply rewards |
| `learnCard(cardId)` | Learn a card by ID |
| `useConsumable(itemId)` | Use a consumable |
| `equipItem(item, opts?)` | Equip an item |
| `unequipItem(slot, index?)` | Remove equipped item |

## State Selectors

The store provides typed selectors for common queries:

| Selector | Return Type | Purpose |
|----------|-------------|---------|
| `selectPlayer(state)` | `Character` | Current player character |
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
| `USE_ITEM` | Use a consumable item |
| `EQUIP_ITEM` / `UNEQUIP_ITEM` | Manage character equipment |
| `LEARN_CARD` | Add a card to character's known cards |
| `LEVEL_UP` / `ALLOCATE_STAT_POINT` | Progression and stat allocation |
| `MOVE_TO_NODE` / `PROCESS_NODE` | Map traversal and node-event resolution |
| `APPLY_DIALOGUE` | Apply an NPC dialogue choice |
| `SHIFT_MORAL_METER` / `SHIFT_PHILOSOPHICAL_ALIGNMENT` | Record moral / alignment shifts |
| `UNLOCK_CODEX_ENTRY` | Unlock a codex entry |
| `SAVE_GAME` / `LOAD_GAME` | Persistence (store handles I/O) |
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

Every event carries the same `EnginePayload` envelope (`{ action, state, report?, unlockedCards? }` — see `docs/api.md` § Events). The nine `GameEventType` values:

| Event | When Emitted |
|-------|--------------|
| `combat:started` | Combat begins |
| `combat:ended` | Combat concludes (`payload.report` carries the `CombatEndReport`) |
| `world:moved` / `world:processed` | Map traversal / node-event resolution |
| `dialogue:applied` | An NPC dialogue choice was applied |
| `character:levelup` | Level promotion (`payload.unlockedCards` lists newly eligible cards) |
| `inventory:changed` | Inventory mutation |
| `game:saved` / `game:loaded` | Persistence round-trips |

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
| `STAT_MULTIPLIERS.SAVE` / `.TEST` | `2` / `4` | Base stat to save / ability-test conversion |
| `PLAYER_VITAE_BASE` | `50` | Flat floor of every player VITAE pool |
| `RESOURCE_MULTIPLIERS.HEALTH_PER_STAT` | `8` | Per-stat term: VITAE = base + (body + heart + mind) × 8 |
| `EXPERIENCE_PER_LEVEL` | `1000` | XP required per level |
| `STAT_POINTS_PER_LEVEL` | `3` | Stat points gained per level |
| `DEFENSE_MULTIPLIERS` | `{ advantage: 3, neutral: 2, disadvantage: 1.5 }` | Active defense stance bonuses |
| `PASSIVE_DEFENSE_MULTIPLIER` | `1` | Defense multiplier when not in active defense stance |
| `MAX_EFFECT_INTENSITY` | `30` | Maximum effect stack intensity |
| `MAX_EFFECT_DURATION` | `10` | Maximum effect duration in rounds |
| `FRIENDSHIP_COUNTER_MAX` | `3` | Befriend attempts before success |

## Run Loop and State Management

### Run Identifiers

Each playthrough gets a unique run identifier:

```typescript
import { generateRunId, STARTING_REGION } from 'axiomancer-mechanics';

// `createNewGameState()` takes no arguments and stamps its own run id
// (`generateRunId(() => getRng().random())`, 16-char hex). Every
// `store.resetRun(...)` assigns a fresh one.
const newGameState = createNewGameState();
newGameState.runId;   // e.g. '3f9c0a1b2d4e5f60'
STARTING_REGION;      // the region a fresh world starts in
```

### New Game Creation

```typescript
import { createNewGameState } from 'axiomancer-mechanics';

// No options: every real run starts from the same place — the very
// start (2026-09-23): level 1 at the 5/5/5 baseline, empty inventory,
// empty loadout, zero coin, zero XP. The Suppliant's Ring is owed and
// handed over at the first node. To start from a customised character,
// build one (`createCharacter` / `buildCharacterFromPreset`) and pass it as
// an override to `createGameStore(adapter, { player })`, or use a state
// fixture (`docs/state-fixtures.md`).
const initialState = createNewGameState();
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