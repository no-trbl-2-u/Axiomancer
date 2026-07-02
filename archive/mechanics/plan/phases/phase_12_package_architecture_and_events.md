# Phase 12 — Package architecture and events

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

Define clean package architecture with React Native compatibility. Add package.json exports field to separate core engine from Node-specific adapters. Implement typed event channel for UI consumers. Trim public API surface while maintaining backward compatibility. Document public exports and versioning strategy.

## Source spec

`specs/12-package-architecture-and-events.md` — answers for all open questions:

1. **Public API trim**: Light trim — drop only obviously internal helpers, keep wider surface for ecosystem use.
2. **Zustand dependency**: Keep zustand as dep; ship createGameStore as canonical entry point. Pure reducers remain available.
3. **Persistence adapters**: Subpath export `'axiomancer-mechanics/node'` for Node adapters, keep core clean for React Native.
4. **Async storage adapter**: Document interface in docs/api.md, let UI implement (no AsyncStorage dependency).
5. **Event channel shape**: Pure reducers return `{ state, events }` — consumer subscribes by reading events array.
6. **Event taxonomy**: Combat events (CombatStarted/Ended/RoundResolved/DamageDealt/Healed/Crit), progression (LevelUp/XPGained), world (MapChanged/NodeEntered).
7. **Logging vs events**: Engine emits typed events; combat.cli.ts subscribes and renders to terminal.
8. **Versioning strategy**: Strict semver; breaking = major. Document in docs/api.md.

## Implementation units (commit per unit)

### Unit 1 — Package.json exports field

File: `package.json`

Add exports field for subpath separation:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    },
    "./node": {
      "types": "./dist/node.d.ts", 
      "import": "./dist/node.js",
      "require": "./dist/node.js"
    }
  },
  "files": [
    "dist"
  ]
}
```

Commit: `feat(package): exports field for Node/core separation`

### Unit 2 — Node adapter subpath export

File: `src/node.ts` (new)

```typescript
/**
 * Node.js-specific exports for axiomancer-mechanics.
 * Import from 'axiomancer-mechanics/node' for server-side adapters.
 */

export { createNodeAdapter } from './Game/persistence/node.adapter';
export type { PersistenceAdapter } from './Game/persistence/types';
```

Update build to include node.ts in compilation.

Commit: `feat(package): Node.js subpath export for persistence adapters`

### Unit 3 — Event types definition

File: `src/Game/events.types.ts` (new)

```typescript
/**
 * Event types emitted by game actions for UI consumption.
 * Events are returned alongside state updates from reducers.
 */

// Base event structure
export interface GameEvent {
  type: string;
  timestamp: number;
  id: string; // unique per event
}

// Combat events
export interface CombatStartedEvent extends GameEvent {
  type: 'combat:started';
  enemy: string; // enemy name
  playerStance: string;
}

export interface CombatEndedEvent extends GameEvent {
  type: 'combat:ended';
  result: 'victory' | 'defeat' | 'friendship';
  xpGained?: number;
}

export interface RoundResolvedEvent extends GameEvent {
  type: 'combat:round-resolved';
  round: number;
  playerAction: string;
  enemyAction: string;
  playerDamage: number;
  enemyDamage: number;
}

export interface DamageDealtEvent extends GameEvent {
  type: 'combat:damage-dealt';
  to: 'player' | 'enemy';
  amount: number;
  isCritical: boolean;
}

export interface HealedEvent extends GameEvent {
  type: 'combat:healed';
  target: 'player' | 'enemy';
  amount: number;
}

export interface CriticalHitEvent extends GameEvent {
  type: 'combat:crit';
  attacker: 'player' | 'enemy';
  damage: number;
}

// Progression events  
export interface LevelUpEvent extends GameEvent {
  type: 'progression:level-up';
  newLevel: number;
  statGains: Record<string, number>;
}

export interface XPGainedEvent extends GameEvent {
  type: 'progression:xp-gained';
  amount: number;
  source: 'combat' | 'quest' | 'exploration';
}

// World events
export interface MapChangedEvent extends GameEvent {
  type: 'world:map-changed';
  fromMap?: string;
  toMap: string;
}

export interface NodeEnteredEvent extends GameEvent {
  type: 'world:node-entered';
  nodeId: string;
  nodeType: 'combat' | 'event' | 'shop' | 'rest';
}

// Union type for all events
export type GameEventType = 
  | CombatStartedEvent 
  | CombatEndedEvent
  | RoundResolvedEvent
  | DamageDealtEvent
  | HealedEvent 
  | CriticalHitEvent
  | LevelUpEvent
  | XPGainedEvent
  | MapChangedEvent
  | NodeEnteredEvent;
```

Commit: `feat(game): event types for UI consumption`

### Unit 4 — Event emitter utility

File: `src/Game/events.utils.ts` (new)

```typescript
import { GameEventType } from './events.types';

/**
 * Utility functions for creating and managing game events.
 */

let eventCounter = 0;

export function createEvent<T extends GameEventType>(
  type: T['type'],
  payload: Omit<T, 'type' | 'timestamp' | 'id'>
): T {
  return {
    type,
    timestamp: Date.now(),
    id: `evt_${Date.now()}_${++eventCounter}`,
    ...payload,
  } as T;
}

export function createCombatStartedEvent(enemy: string, playerStance: string) {
  return createEvent<CombatStartedEvent>('combat:started', { enemy, playerStance });
}

export function createCombatEndedEvent(result: 'victory' | 'defeat' | 'friendship', xpGained?: number) {
  return createEvent<CombatEndedEvent>('combat:ended', { result, xpGained });
}

export function createRoundResolvedEvent(
  round: number, 
  playerAction: string, 
  enemyAction: string,
  playerDamage: number,
  enemyDamage: number
) {
  return createEvent<RoundResolvedEvent>('combat:round-resolved', {
    round, playerAction, enemyAction, playerDamage, enemyDamage
  });
}

export function createDamageDealtEvent(to: 'player' | 'enemy', amount: number, isCritical: boolean) {
  return createEvent<DamageDealtEvent>('combat:damage-dealt', { to, amount, isCritical });
}

export function createHealedEvent(target: 'player' | 'enemy', amount: number) {
  return createEvent<HealedEvent>('combat:healed', { target, amount });
}

export function createLevelUpEvent(newLevel: number, statGains: Record<string, number>) {
  return createEvent<LevelUpEvent>('progression:level-up', { newLevel, statGains });
}

export function createXPGainedEvent(amount: number, source: 'combat' | 'quest' | 'exploration') {
  return createEvent<XPGainedEvent>('progression:xp-gained', { amount, source });
}

export function createMapChangedEvent(toMap: string, fromMap?: string) {
  return createEvent<MapChangedEvent>('world:map-changed', { toMap, fromMap });
}

export function createNodeEnteredEvent(nodeId: string, nodeType: 'combat' | 'event' | 'shop' | 'rest') {
  return createEvent<NodeEnteredEvent>('world:node-entered', { nodeId, nodeType });
}
```

Commit: `feat(game): event creation utilities`

### Unit 5 — Update game reducer to return events

File: `src/Game/game.reducer.ts`

Add events return to GameActions result type:

```typescript
import { GameEventType } from './events.types';

// Update action result type
export interface GameActionResult {
  state: GameState;
  events: GameEventType[];
}

// Update gameReducer signature
export function gameReducer(
  state: GameState, 
  action: GameAction
): GameActionResult {
  
  const events: GameEventType[] = [];
  
  switch (action.type) {
    case 'START_COMBAT': {
      const newState = { ...state, combat: action.combat };
      events.push(createCombatStartedEvent(action.enemy, action.playerStance));
      return { state: newState, events };
    }
    
    case 'END_COMBAT': {
      const newState = { ...state, combat: null };
      events.push(createCombatEndedEvent(action.result, action.xpGained));
      if (action.xpGained) {
        events.push(createXPGainedEvent(action.xpGained, 'combat'));
      }
      return { state: newState, events };
    }
    
    // Add events to other relevant actions...
    
    default:
      return { state, events: [] };
  }
}
```

Commit: `feat(game): game reducer returns events alongside state`

### Unit 6 — Update Zustand store to handle events

File: `src/Game/store.ts`

Update store to expose events:

```typescript
import { GameEventType } from './events.types';

export interface GameStore {
  // ... existing fields ...
  events: GameEventType[];
  
  // Actions that now handle events
  dispatch: (action: GameAction) => void;
  getEvents: () => GameEventType[];
  clearEvents: () => void;
}

export function createGameStore(adapter: PersistenceAdapter = nullAdapter): GameStore {
  return create<GameStore>((set, get) => ({
    // ... existing implementation ...
    events: [],
    
    dispatch: (action: GameAction) => {
      const current = get();
      const result = gameReducer(current, action);
      
      set({
        ...result.state,
        events: [...current.events, ...result.events],
      });
      
      // Auto-save after state changes
      if (action.type !== 'LOAD_GAME') {
        adapter.save(result.state);
      }
    },
    
    getEvents: () => get().events,
    
    clearEvents: () => set({ events: [] }),
  }));
}
```

Commit: `feat(game): Zustand store exposes event stream`

### Unit 7 — Combat CLI refactor to use events

File: `src/CLI/combat.cli.ts`

Refactor to subscribe to events instead of direct logging:

```typescript
import { GameEventType } from '../Game/events.types';

// Event handlers for CLI rendering
function handleCombatEvent(event: GameEventType): void {
  switch (event.type) {
    case 'combat:started':
      console.log(`⚔️  Combat begins against ${event.enemy}!`);
      console.log(`You enter ${event.playerStance} stance.`);
      break;
      
    case 'combat:round-resolved':
      console.log(`\n--- Round ${event.round} ---`);
      console.log(`You ${event.playerAction}, Enemy ${event.enemyAction}`);
      if (event.playerDamage > 0) console.log(`You deal ${event.playerDamage} damage!`);
      if (event.enemyDamage > 0) console.log(`Enemy deals ${event.enemyDamage} damage!`);
      break;
      
    case 'combat:damage-dealt':
      const target = event.to === 'player' ? 'You' : 'Enemy';
      const critText = event.isCritical ? ' (CRITICAL!)' : '';
      console.log(`${target} take${event.to === 'player' ? '' : 's'} ${event.amount} damage${critText}`);
      break;
      
    case 'combat:ended':
      if (event.result === 'victory') {
        console.log('\n🎉 Victory!');
        if (event.xpGained) console.log(`Gained ${event.xpGained} XP!`);
      } else if (event.result === 'defeat') {
        console.log('\n💀 Defeat...');
      } else {
        console.log('\n🤝 Friendship achieved!');
      }
      break;
      
    case 'progression:level-up':
      console.log(`\n🌟 Level up! Now level ${event.newLevel}`);
      Object.entries(event.statGains).forEach(([stat, gain]) => {
        console.log(`  ${stat}: +${gain}`);
      });
      break;
  }
}

// Main combat loop now processes events
function runCombatLoop() {
  const store = createGameStore();
  
  // Process events after each action
  function processEvents() {
    const events = store.getEvents();
    events.forEach(handleCombatEvent);
    store.clearEvents();
  }
  
  // Combat actions now dispatch through store
  store.dispatch({ type: 'START_COMBAT', combat: combatState, enemy: 'Test Enemy', playerStance: 'mind' });
  processEvents();
  
  // Continue with combat rounds...
}
```

Commit: `feat(cli): combat CLI subscribes to events instead of direct logging`

### Unit 8 — API surface cleanup

File: `src/index.ts`

Light cleanup - remove obviously internal exports:

```typescript
// Remove internal test utilities (keep in separate test-utils export)
// Remove debugging helpers like MIND_MARK_ID constant
// Remove internal reducer helpers not meant for consumer use

// Add cleaner documentation
/**
 * axiomancer-mechanics — public package surface.
 * 
 * Core game engine exports for React Native and other JavaScript consumers.
 * For Node.js specific adapters, import from 'axiomancer-mechanics/node'.
 */

// Keep existing exports organized, remove:
// - MIND_MARK_ID (internal constant)
// - updateCombatPhase, addBattleLogEntry (internal reducer helpers)
// - Internal debug utilities
```

Commit: `refactor(api): light cleanup of internal exports`

### Unit 9 — Documentation

File: `docs/api.md` (new)

```markdown
# Public API Reference

## Stability Levels

- **Stable**: Committed to semver for breaking changes
- **Beta**: May change in minor versions with deprecation notice  
- **Experimental**: May change without notice

## Core Exports (from 'axiomancer-mechanics')

### Character
- `createCharacter()` - Stable
- `Character`, `BaseStats`, `DerivedStats` types - Stable

### Combat  
- `resolveCombatRound()` - Stable
- `determineAdvantage()`, damage/healing functions - Stable
- Combat types (`CombatState`, `Action`, etc.) - Stable

### Game Store
- `createGameStore()` - Stable  
- `gameReducer()` - Stable
- Event types and utilities - Beta

### Items, Skills, World, Effects
- Core creation and manipulation functions - Stable
- Type definitions - Stable

## Node.js Exports (from 'axiomancer-mechanics/node')

### Persistence
- `createNodeAdapter()` - Stable
- `PersistenceAdapter` interface - Stable

## React Native Usage

The core package exports work in React Native. For persistence, implement the `PersistenceAdapter` interface with AsyncStorage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorageAdapter: PersistenceAdapter = {
  async load() {
    const data = await AsyncStorage.getItem('game-state');
    return data ? JSON.parse(data) : null;
  },
  async save(state) {
    await AsyncStorage.setItem('game-state', JSON.stringify(state));
  }
};
```

## Versioning

This package follows strict semantic versioning:
- **Major**: Breaking changes to stable APIs
- **Minor**: New features, changes to beta APIs  
- **Patch**: Bug fixes only

Beta APIs are marked in this documentation and may change in minor releases.
```

Commit: `docs(api): public API reference with stability levels`

### Unit 10 — Update package.json files field

File: `package.json`

Ensure build artifacts are included correctly:

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

Also add Node build step to ensure node.ts compiles to dist/node.js.

Commit: `feat(package): ensure Node subpath builds correctly`

### Unit 11 — Export event types from barrel

File: `src/index.ts`

Add event exports:

```typescript
// ── Events ─────────────────────────────────────────────────────────────────
export type {
  GameEvent, GameEventType, 
  CombatStartedEvent, CombatEndedEvent, RoundResolvedEvent,
  DamageDealtEvent, HealedEvent, CriticalHitEvent,
  LevelUpEvent, XPGainedEvent, MapChangedEvent, NodeEnteredEvent,
} from './Game/events.types';

export {
  createEvent, createCombatStartedEvent, createCombatEndedEvent,
  createRoundResolvedEvent, createDamageDealtEvent, createHealedEvent,
  createLevelUpEvent, createXPGainedEvent, createMapChangedEvent, createNodeEnteredEvent,
} from './Game/events.utils';
```

Commit: `feat(game): export event types and utilities from barrel`

### Unit 12 — Hermetic e2e test

File: `src/Game/e2e/events.engine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { createCharacter } from '../../Character';
import { initializeCombat } from '../../Combat';
import { createEnemy } from '../../Enemy';

describe('Events engine', () => {
  it('emits combat events in correct sequence', () => {
    const store = createGameStore(nullAdapter);
    const player = createCharacter({ name: 'Test' });
    const enemy = createEnemy({ name: 'Test Enemy', difficulty: 'easy' });
    const combat = initializeCombat(player, enemy);
    
    // Start combat
    store.dispatch({ type: 'START_COMBAT', combat, enemy: 'Test Enemy', playerStance: 'mind' });
    
    const events = store.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('combat:started');
    expect(events[0]!.enemy).toBe('Test Enemy');
    
    store.clearEvents();
    
    // End combat  
    store.dispatch({ type: 'END_COMBAT', result: 'victory', xpGained: 50 });
    
    const endEvents = store.getEvents();
    expect(endEvents).toHaveLength(2); // combat:ended + progression:xp-gained
    expect(endEvents[0]!.type).toBe('combat:ended');
    expect(endEvents[1]!.type).toBe('progression:xp-gained');
  });
  
  it('provides stable event IDs and timestamps', () => {
    const store = createGameStore(nullAdapter);
    
    store.dispatch({ type: 'START_COMBAT', combat: {}, enemy: 'Test', playerStance: 'mind' });
    store.dispatch({ type: 'START_COMBAT', combat: {}, enemy: 'Test', playerStance: 'mind' });
    
    const events = store.getEvents();
    expect(events[0]!.id).not.toBe(events[1]!.id);
    expect(events[0]!.timestamp).toBeLessThanOrEqual(events[1]!.timestamp);
  });
});
```

Commit: `test(game): hermetic e2e for event system`

## Decisions made upfront — DO NOT ASK

- **API trim level**: Light cleanup only - remove internal debugging constants and reducer helpers, keep wider API surface for ecosystem growth.
- **Zustand approach**: Keep as dependency with createGameStore as primary, pure reducers remain available for non-Zustand consumers.
- **Node adapter location**: Subpath export 'axiomancer-mechanics/node' to avoid bundling fs in React Native while keeping adapters available.
- **AsyncStorage handling**: Document interface, no implementation - let React Native apps provide their own adapter to avoid dependency bloat.
- **Event channel shape**: Reducers return `{ state, events }`, store accumulates events, consumers read and clear events array.
- **Event taxonomy**: Combat lifecycle, damage/healing, progression, world navigation - focused on UI rendering needs.
- **CLI integration**: Combat CLI subscribes to events and renders them, removing direct console.log from engine.
- **Versioning**: Strict semver with stability levels documented - breaking changes require major version.
- **Package exports**: Dual export - main entry for core, /node for Node-specific adapters.

## Verify gate

```bash
npm run type-check   # must pass - new types compile correctly
npm test             # includes events.engine.test.ts
npm run build        # must produce dist/ with both index.js and node.js
```

## Commit body template

```
feat(package): phase 12 — package architecture and events

- Package.json exports field for Node/core separation
- Event system with typed GameEventType union for UI consumption  
- Game reducer returns state + events, store exposes event stream
- Combat CLI refactored to subscribe to events vs direct logging
- Light API cleanup removing internal debugging exports
- Node adapter moved to subpath export for React Native compatibility
- Documentation for public API surface and React Native usage

Decisions:
- Light API trim over aggressive - keep wider surface for ecosystem
- Subpath exports over package splitting for simpler maintenance
- Event accumulation in store over EventEmitter for simpler consumption
- Documentation over implementation for AsyncStorage adapter
```

## Definition of Done

- [ ] package.json `exports` field with core/Node subpaths
- [ ] `src/node.ts` exports Node-specific adapters  
- [ ] Event types defined in `Game/events.types.ts`
- [ ] Event utilities in `Game/events.utils.ts`
- [ ] Game reducer returns `{ state, events }` structure
- [ ] Zustand store exposes and accumulates events
- [ ] Combat CLI subscribes to events instead of direct logging
- [ ] Light API cleanup in `src/index.ts` (remove internal exports)
- [ ] `docs/api.md` documents public surface and stability levels
- [ ] Event types exported from barrel
- [ ] `src/Game/e2e/events.engine.test.ts` green
- [ ] React Native can import core without fs errors
- [ ] CLI combat output unchanged (same transcript from events)
- [ ] `npm run verify` green
- [ ] `npm run deploy:check` green (package builds with subpaths)
- [ ] `specs/12-package-architecture-and-events.md` acceptance checklist ticked

## Follow-ups (out of scope for this phase)

- Bundle size analysis and tree-shaking optimization
- Performance testing for event accumulation in long sessions
- EventEmitter alternative for high-frequency event scenarios
- Automated React Native compatibility testing
- Visual event timeline debugging tools