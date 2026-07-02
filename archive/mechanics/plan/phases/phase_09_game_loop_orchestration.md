# Phase 09 — Game Loop Orchestration

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

`gameReducer(state, action): GameState` exists, is the dispatch spine of
the Zustand store, and is tested via a full-transcript hermetic e2e:
new game → explore → combat → win → level up → save → load → state matches.
`game.cli.ts` demonstrates the full loop interactively.

## Source spec

`specs/09-game-loop-orchestration.md` — answers for all open questions:

1. Store as primary; `gameReducer` as the underlying dispatch (Q1: answer B
   adapted — fully Zustand-driven, `gameReducer` provides the switch logic
   that Zustand actions call into).
2. Action shape: tagged union `{ type: 'START_COMBAT', payload }` (Q2).
3. Save versioning: migration via `migrate(state, fromVersion, toVersion)` (Q3).
4. Save granularity: autosave on every `GameAction` with a TODO comment to
   revisit if the game seems too brutal (Q4).
5. Persistence transport: document `PersistenceAdapter` interface; ship
   `nullAdapter` + `node.adapter.ts`; defer `AsyncStorage` adapter to
   Phase 12 (Q5).
6. Event surface: event emitter / observable returning `GameEvent[]` (Q6).
   Wire as `createEventEmitter()` in `Game/events.ts`. Consumers subscribe.
7. `game.cli.ts` includes: title screen → load-or-new → map view → combat
   (via existing `combat.cli` flow) → journal tab (quests + alignment) →
   skills tab → inventory. CLI is demonstrational; focus on wiring, not
   polish (Q7).

## Implementation units (commit per unit)

### Unit 1 — `GameAction` type union

File: `src/Game/actions.types.ts`

Define the tagged union:

```typescript
type GameAction =
  | { type: 'START_COMBAT';  payload: { enemy: Enemy } }
  | { type: 'COMBAT_ROUND';  payload: { playerAction: Action; playerStance: Stance } }
  | { type: 'END_COMBAT';    payload: { outcome: 'win' | 'flee' | 'lose' } }
  | { type: 'MOVE_TO_NODE';  payload: { nodeId: string } }
  | { type: 'PROCESS_NODE';  payload?: undefined }
  | { type: 'APPLY_DIALOGUE';payload: { choiceId: string } }
  | { type: 'USE_ITEM';      payload: { itemId: string } }
  | { type: 'EQUIP_ITEM';    payload: { itemId: string; slot: EquipSlot } }
  | { type: 'LEVEL_UP';      payload?: undefined }
  | { type: 'SAVE_GAME';     payload?: undefined }
  | { type: 'LOAD_GAME';     payload?: undefined }
```

Export from `src/index.ts` as `GameAction`.

Commit: `feat(game): GameAction tagged union`

### Unit 2 — `gameReducer`

File: `src/Game/game.reducer.ts` (extend existing minimal file)

```typescript
export function gameReducer(state: GameState, action: GameAction): GameState
```

Switch over `action.type`; delegate to existing pure reducers:
- `START_COMBAT` → `initializeCombat(state, action.payload.enemy)`
- `COMBAT_ROUND` → `resolveCombatRound(state, ...)`
- `END_COMBAT` → `endCombat(state, action.payload.outcome)`
- `MOVE_TO_NODE` → `moveToNode(state, action.payload.nodeId)`
- `PROCESS_NODE` → `processNode(state)`
- `APPLY_DIALOGUE` → `applyDialogueChoice(state, action.payload.choiceId)`
- `USE_ITEM` → `useConsumable(state, action.payload.itemId)`
- `EQUIP_ITEM` → `existing item/equipment reducers`
- `LEVEL_UP` → existing character progression reducer
- `SAVE_GAME` → call `state.adapter.save(state)`; return state
- `LOAD_GAME` → call `state.adapter.load()`; return loaded state

Autosave: after every action, call `state.adapter.save(nextState)`.
Add a TODO comment: `// TODO: revisit autosave granularity — may be too brutal`.

Commit: `feat(game): gameReducer delegating to existing reducers`

### Unit 3 — `GameState` version migration

File: `src/Game/game.migrate.ts`

```typescript
export function migrate(raw: unknown, fromVersion: number, toVersion: number): GameState
```

For now: `fromVersion === 1` is the only case; return `raw` as `GameState`
if the shape validates. Log a warning for unknown versions. Export from
`src/index.ts`.

Commit: `feat(game): save-state migration (v1 baseline)`

### Unit 4 — Event emitter

File: `src/Game/events.ts`

```typescript
type GameEventType =
  | 'combat:started' | 'combat:round' | 'combat:ended'
  | 'world:moved' | 'world:processed'
  | 'character:levelup' | 'game:saved' | 'game:loaded'

interface GameEvent { type: GameEventType; payload: unknown }

interface GameEventEmitter {
  on(type: GameEventType, handler: (event: GameEvent) => void): () => void
  emit(event: GameEvent): void
}

export function createEventEmitter(): GameEventEmitter
```

Wire `gameReducer` to emit events after each state transition. The emitter
is stored on `GameState` (or passed separately — choose: store it outside
state to avoid serialization issues; pass to `createGameStore` as a
parameter).

**Decision:** pass `emitter` as an optional second param to `createGameStore`.
Emit inside the store's action implementations after calling `gameReducer`.

Commit: `feat(game): GameEvent emitter surface`

### Unit 5 — Refactor `store.ts`

File: `src/Game/store.ts`

Current state: Zustand store with inlined action implementations.
Target: Zustand store where each action calls `gameReducer(get(), action)` and
then `set(nextState)`. Retain all existing action names for backwards
compatibility.

Add new actions: `moveToNode(nodeId)`, `processNode()`, `applyDialogue(choiceId)`.

Wire autosave: after every `set(nextState)`, call `state.adapter.save(nextState)`.

Commit: `refactor(game): store actions delegate to gameReducer`

### Unit 6 — Export

Update `src/index.ts`:
- Export `GameAction`, `GameEvent`, `GameEventEmitter`, `GameEventType`
- Export `gameReducer`
- Export `migrate`
- Export `createEventEmitter`

Commit: `feat(game): export gameReducer, GameAction, events surface`

### Unit 7 — Hermetic e2e test

File: `src/Game/e2e/game.loop.engine.test.ts`

Full transcript test:

```
1. createCharacter + createEnemy
2. dispatch START_COMBAT
3. dispatch COMBAT_ROUND × N until combat ends
4. dispatch END_COMBAT (win)
5. dispatch LEVEL_UP
6. dispatch MOVE_TO_NODE
7. dispatch SAVE_GAME
8. Reload: load saved state via migrate()
9. Assert: loaded state matches pre-save state
```

Use `mockFixedRng` for deterministic combat rounds.
Verify combat `outcome`, character level, world node, quest log.

Commit: `test(game): hermetic e2e transcript — new game → combat → level up → save/load`

### Unit 8 — `game.cli.ts`

File: `src/CLI/game.cli.ts`

Interactive CLI demonstrating the full loop. Tabs:
- **Map** — list nodes, choose to move
- **Combat** — delegates to existing combat.cli flow driven by `dispatch`
- **Journal** — quests (active, completed) + current alignment
- **Skills** — unlocked skills list
- **Inventory / Equipment** — use/equip items

Wire to `createGameStore` + `createEventEmitter`. Log events to console.

This is **demonstrational** — focus on wiring, not visual polish. The CLIs
exist for manual testing; the React Native UI will be the real consumer.

Commit: `feat(cli): game.cli.ts full-loop demonstration`

### Unit 9 — Docs

File: `docs/gameloop.md`

Document: `GameAction` union, `gameReducer` contract, event surface,
`PersistenceAdapter` interface. Link from `README.md`.

Update `specs/09-game-loop-orchestration.md`: tick acceptance checklist.

Commit: `docs(game): gameloop.md — reducer, events, persistence adapter`

## Decisions made upfront — DO NOT ASK

- **`gameReducer` return type:** `GameState` (not `{ state, events }`).
  Events are side-emitted through the `GameEventEmitter`. This keeps state
  serializable and the emitter optional.
- **Emitter placement:** passed to `createGameStore` as optional param; not
  stored on `GameState` (avoids serialization issues).
- **Autosave on every action:** yes, with a TODO comment.
- **`AsyncStorage` adapter:** defer to Phase 12. Document the interface now.
- **`game.cli.ts` tabs:** Map, Combat, Journal, Skills, Inventory — all
  as demonstrational stubs; Journal shows quests + alignment.
- **Missing primitives (e.g. level-up reducer):** wire placeholder that
  increments `character.level`; Phase 10/11 will flesh out.
- **Backwards compatibility:** retain all existing `store.ts` action names.

## Verify gate

```bash
npm run type-check   # must pass
npm test             # includes game.loop.engine.test.ts
npm run build        # must produce dist/ without error
```

## Commit body template

```
feat(game): phase 09 — game loop orchestration

- GameAction tagged union + gameReducer dispatch
- store.ts delegates all actions to gameReducer
- GameEvent emitter surface (observer pattern)
- migrate() for save-state versioning
- game.cli.ts: full loop (map → combat → journal → skills → inventory)
- hermetic e2e: new game → combat × N → win → level up → save → load → match

Decisions:
- emitter passed to createGameStore (not stored on state) — avoids serialize issues
- autosave on every action with TODO to revisit granularity
- AsyncStorage adapter deferred to Phase 12
```

## Definition of Done

- [ ] `GameAction` tagged union exported from `src/index.ts`
- [ ] `gameReducer` exported and used by `store.ts`
- [ ] `GameEvent` emitter exported and wired in store
- [ ] `migrate()` exported; save/load round-trip test passes
- [ ] `game.cli.ts` runs interactively, all tabs reachable
- [ ] `src/Game/e2e/game.loop.engine.test.ts` green
- [ ] `npm run verify` green
- [ ] `docs/gameloop.md` committed
- [ ] `specs/09-game-loop-orchestration.md` acceptance checklist ticked

## Follow-ups (out of scope for this phase)

- Multiple save slots
- `AsyncStorage` adapter (Phase 12)
- Moral/difficulty meter (Phase 10)
- RNG seeding retrofit (Phase 11)
