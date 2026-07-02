# Game loop

> **Status:** Spec 09 landed — `gameReducer` is the dispatch spine, the
> Zustand store delegates every mutation to it, and a `GameEvent` emitter
> broadcasts transitions to UI consumers. Save / load round-trips through a
> versioned `migrate()`. `game.cli.ts` demos the full loop end-to-end:
> Map → Combat → Journal → Skills → Inventory.

## State Shape

```ts
interface GameState {
  version: number;                   // GAME_STATE_VERSION (current: 7)
  runId: string;                     // Phase 72 — UUID per run; bumped by resetRun
  player: Character;
  world: WorldState;
  combat: CombatState | null;        // null when out of combat
  currentEncounter?: Encounter;      // transient — excluded from saves
  quests: QuestLog;
  flags: string[];
  moralMeter: number;                // Spec 10 — clamped to [-100, +100]
  rngState: number;                  // Spec 11 — LCG seed snapshot
  philosophicalAlignment: PhilosophicalAlignment;  // Phase 42 — 3-axis cube
  lastSeenAlignmentCells?: Record<string, string>; // Phase 63 — observer cache
  codex: CodexState;                 // Phase 73 — unlocked journal entries
}
```

`currentEncounter` is the only field the persisted save omits — encounters
re-roll on load (see Spec 07 Q1). Every other field round-trips identically,
including `rngState`: the store calls `getRng().setState(saved.rngState)` on
load so the dice sequence resumes exactly where the save was taken (Spec 11).

## The dispatch spine

```ts
function gameReducer(state: GameState, action: GameAction): GameState
```

The reducer is **pure**: it returns a fresh `GameState` and never touches
disk or time. The single exception is `SAVE_GAME`, which reads the live
`getRng().getState()` so the persisted snapshot can resume the dice sequence
on load (Spec 11). Every top-level transition is expressed as a `GameAction`:

```ts
type GameAction =
  | { type: 'START_COMBAT';        payload: { target: Enemy | Encounter } }
  | { type: 'COMBAT_ROUND';        payload: { playerAction: Action; playerStance: Stance;
                                              skillId?: string; itemId?: string } }
  | { type: 'END_COMBAT';          payload?: { grantedLoot?: Item[]; grantedXp?: number } }
  | { type: 'MOVE_TO_NODE';        payload: { nodeId: string } }
  | { type: 'PROCESS_NODE'  }
  | { type: 'APPLY_DIALOGUE';      payload: { tree: DialogueTree; choice: DialogueChoice } }
  | { type: 'USE_ITEM';            payload: { itemId: string } }
  | { type: 'EQUIP_ITEM';          payload: { item: Equipment } }
  | { type: 'UNEQUIP_ITEM';        payload: { slot: EquipmentSlot } }
  | { type: 'LEVEL_UP'      }
  | { type: 'ALLOCATE_STAT_POINT'; payload: { stat: 'body' | 'mind' | 'heart' } }  // Phase 29
  | { type: 'LEARN_SKILL';         payload: { skillId: string } }                  // Phase 30
  | { type: 'SHIFT_MORAL_METER';   payload: { delta: number; gating?: { min?: number; max?: number } } }
  | { type: 'SAVE_GAME'     }   // reducer stamps `rngState`; store handles I/O
  | { type: 'LOAD_GAME'     };  // reducer no-op — store handles I/O
```

Each branch delegates to an existing module-level reducer
(`Combat/combat.reducer`, `World/world.reducer`,
`World/MapEvents/resolve-map-event` for `PROCESS_NODE` since Phase 25,
`World/dialogue.runtime`, `Items/item.reducer`, etc.). The reducer never
re-implements game math.

### END_COMBAT loot contract

`END_COMBAT` can be dispatched with a pre-rolled `{ grantedLoot, grantedXp }`
payload. The store does this so `endCombat()` can return a populated
`CombatEndReport` referring to the **exact** drops the reducer then applies —
rolling loot twice (once for the report, once inside the reducer) would
diverge. Direct dispatchers can omit the payload and let the reducer roll
internally.

## Store wrapper

`createGameStore(adapter, overrides?, emitter?)` builds a Zustand vanilla
store on top of the reducer. Every store action:

1. Computes the next state via `gameReducer(get(), action)`.
2. Publishes it through Zustand's `set`.
3. Emits a `GameEvent` if an emitter was supplied.
4. Calls `adapter.save(nextState)` to autosave **iff** `action.type`
   appears in the `DURABLE_ACTIONS` allowlist (Spec 09 Q4 path B,
   Phase 51). UI-tier action types pass through steps 1-3 without
   writing to disk. See § "Autosave granularity" below for the full
   allowlist.

The legacy method-style actions (`startCombat`, `endCombat`,
`equipItem`, …) are kept as sugar so existing call sites don't need to
rewrite — they all funnel through `dispatch` now.

### Autosave granularity

Autosave is restricted to a curated `DURABLE_ACTIONS` allowlist (Spec 09
Q4 path B, shipped at Phase 51 `4972f9a`). The allowlist lives in
`src/Game/store.ts`:

```ts
const DURABLE_ACTIONS: ReadonlySet<GameAction['type']> = new Set([
    'COMBAT_ROUND', 'LEVEL_UP', 'END_COMBAT',
    'MOVE_TO_NODE', 'APPLY_DIALOGUE', 'SAVE_GAME',
]);
```

Only actions whose `type` appears in the set write through to
`adapter.save(...)`. UI-tier actions (stat-allocation prompts, tab
switches, choice highlights, etc.) never persist. The original Spec 09
Q4 default ("fires after every action") was the pre-loop Q4 answer; the
two `TODO(spec-09)` markers that flagged the cadence concern (one in
`store.ts`, one in `game.reducer.ts`) were both removed by Phase 51 —
`grep -n "TODO(spec-09)" src/` returns 0. The `DURABLE_ACTIONS` set is
the canonical autosave policy from Phase 51 onward; hermetic coverage
at `src/Game/e2e/autosave-throttling.engine.test.ts`.

## Event surface

```ts
type GameEventType =
  | 'combat:started' | 'combat:round' | 'combat:ended'
  | 'world:moved'   | 'world:processed' | 'dialogue:applied'
  | 'character:levelup'
  | 'inventory:changed'
  | 'game:saved' | 'game:loaded';

// Phase 21 — every emitted event carries the same envelope shape:
interface EnginePayload {
  action: GameAction;       // the dispatched action that produced this event
  state: GameState;         // post-reducer snapshot
  report?: CombatEndReport; // only on 'combat:ended'
  unlockedSkills?: string[];// Phase 30 unit 2 — only on 'character:levelup'
                            // when the promotion crossed an eligibility gate
}

interface GameEvent { type: GameEventType; payload: EnginePayload }

interface GameEventEmitter {
  on(type, handler): () => void;     // type-scoped subscription
  onAny(handler):    () => void;     // every event
  emit(event):       void;
}
```

The emitter is passed into `createGameStore`. It lives **outside** `GameState`
because handlers and subscription Sets must not serialise to disk.

### Typed narrowing (Phase 21)

Consumers should subscribe through the typed aliases + guards rather
than casting `payload` by hand. The package exports one per topic:

```ts
import {
  TypedLevelUpEvent, TypedCombatRoundEvent, TypedCombatEndedEvent,
  // ... full set covers all 10 GameEventTypes
  isLevelUpEvent, isCombatRoundEvent, isCombatEndedEvent,
  // ... matching is*Event guards exported from events.utils
} from 'axiomancer-mechanics';

emitter.on('character:levelup', e => {
  if (!isLevelUpEvent(e)) return;
  const unlocked = e.payload.unlockedSkills ?? [];   // type-narrowed; no cast
  if (unlocked.length) showUnlockToast(unlocked);
});
```

The `is*Event` guards live in `src/Game/events.utils.ts` and narrow the
generic `GameEvent` down to the matching `TypedGameEvent<T>`. The
`unlockedSkills` field is populated by `enrichExtra` in
`src/Game/store.ts` whenever a `LEVEL_UP` dispatch actually promoted
the level — empty array / undefined otherwise.

## Persistence

```ts
interface PersistenceAdapter {
  load(): GameState | null;
  save(state: GameState): void;
}
```

Two adapters ship with the package:

- **`nullAdapter`** — silent no-op. Tests, combat sims, headless CLIs.
- **`createNodeAdapter()`** — JSON file on disk. Node-only.

The React Native consumer is responsible for an `AsyncStorage` adapter that
implements the same interface (Spec 09 Q5 — kept in the consumer to preserve
separation of responsibilities). The recommended shape lives in
[`docs/api.md`](./api.md) under "React Native Usage" (post-Phase 21).

#### Extending PersistenceAdapter for async backends (Phase 55)

The two-method shape is intentionally synchronous — `gameReducer`
dispatches don't await persistence. Consumers bridging to an async
backend (AsyncStorage, IndexedDB, network) should **extend** the
interface, not re-declare it locally:

```ts
import type { PersistenceAdapter } from 'axiomancer-mechanics';

export interface AsyncStorageAdapter extends PersistenceAdapter {
    /** Populate the in-memory cache before load() returns meaningful data. */
    preload(): Promise<void>;
    /** Wait for any debounced write to land. */
    flush(): Promise<void>;
    /** Wipe cache + on-disk slot. */
    clear(): Promise<void>;
}
```

The pattern is: `load()` returns from an in-memory cache (sync), `save()`
schedules a debounced write (sync), and the host calls `preload()` once
at startup before the engine starts dispatching. The
`axiomancer-mobile/state/persistence/asyncStorageAdapter.ts` consumer
is the canonical reference implementation. The synchronous engine
contract stays clean while async bridging happens at the consumer
boundary.

### Save versioning + migration

```ts
export function migrate(
  raw: unknown,
  fromVersion: number,
  toVersion: number = GAME_STATE_VERSION,
): GameState
```

The save file carries `version`. On load, the adapter hands the raw payload
to `migrate()`, which:

- Returns it as-is when versions match.
- Refuses payloads newer than the runtime.
- Funnels older payloads through stepwise upgrades. The ladder today:
  `migrateV2toV3` (adds `moralMeter`, Spec 10) → `migrateV3toV4` (adds
  `rngState`, Spec 11) → `migrateV4toV5` (adds `philosophicalAlignment`
  defaulting to `{ epistemology: 0, outlook: 0, scope: 0 }`, Phase 42).
- Validates the top-level shape before handing back a `GameState`.

When `GAME_STATE_VERSION` next bumps, add a `migrateV5toV6` step and call it
from `migrate()` for `fromVersion < 6`. Each step is a pure
`(prev) => next` function — no I/O, no defaults pulled at call time.

**Phase 72 update:** `GAME_STATE_VERSION` is now `6`. The ladder gained
`migrateV5toV6` which defaults the required `runId: string` field on
legacy v5 saves via `generateRunId(() => getRng().random())`.

## Run-loop reset (Phase 72)

Closes GH#65 ask 2. Mobile BEGIN AGAIN currently full-heals + dismisses
as a band-aid; this surface replaces that with a proper engine
primitive.

```ts
store.resetRun({ keepCharacter: true }): GameState
```

`resetRun` dispatches a `RESET_RUN` action through the standard
`gameReducer` → `set` → `emit` → autosave pipeline. The action is in
`DURABLE_ACTIONS` so the new state persists immediately.

### Preserve / reset matrix

| Field | `keepCharacter: true` | `keepCharacter: false` |
| --- | --- | --- |
| `player` | preserved (id, name, level, baseStats, equipment, knownSkills, inventory) | fresh `createCharacter` (level 1) |
| `player.health` | refilled to `maxHealth` | new character → full health |
| `player.effects` | cleared (defensive — already empty between combats) | empty |
| `philosophicalAlignment` | preserved (character ledger) | `defaultAlignment()` |
| `moralMeter` | preserved (character ledger) | `0` |
| `rngState` | preserved (don't reset mid-session — breaks deterministic replay) | preserved |
| `runId` | NEW (always bumped) | NEW |
| `world` | `createStartingWorld()` (back to fishing-village `fv-1`) | `createStartingWorld()` |
| `combat` | `null` | `null` |
| `currentEncounter` | `undefined` | `undefined` |
| `quests` | `emptyQuestLog()` | `emptyQuestLog()` |
| `flags` | `[]` | `[]` |
| `lastSeenAlignmentCells` | `undefined` (observer cache resets) | `undefined` |

### Starting hearth

The "hearth" reuses `MapDefinition.startingNode` — no new type
primitive. `STARTING_REGION: MapName = 'fishing-village'` constant
names the canonical run-start region; `resetRun` routes the world
through `createStartingWorld()` which already lands on that region's
starting node (`fv-1`). Per-region custom hearths defer to a future
phase when regions other than fishing-village become viable
start points.

### runId

```ts
export function generateRunId(rng: () => number): string
```

16-char hex id (e.g. `"a3f2c1b9d4e0f1a2"`), matching `/^[0-9a-f]{16}$/`.
Generated at `createNewGameState()` time AND bumped on every
`resetRun()` call. Persists in save data so future runs-history features
can key off per-run identity. The supplied `rng` is invoked 16 times;
engine internals always pass `() => getRng().random()`, but consumers
can supply their own rng for deterministic tests. No `crypto`
dependency — the engine ships into React Native and the core barrel
avoids Node-only imports.

### Mobile callsite (post-engine release)

`axiomancer-mobile`'s `state/combat-mode.tsx` BEGIN AGAIN handler will
drop its full-heal + dismiss band-aid in favour of:

```ts
store.resetRun({ keepCharacter: true });
```

When the engine wants to model death + character lockout in the
future, the same surface handles it with `keepCharacter: false`.

## game.cli.ts

`src/CLI/game.cli.ts` is the demonstrational driver. It is **wiring only** —
all math lives in the resolvers/reducers. Tabs:

| Tab        | What it does                                                     |
|------------|------------------------------------------------------------------|
| Map        | Lists reachable adjacents, dispatches `MOVE_TO_NODE`, then resolves the destination node's `MapEvent` via `resolveMapEvent` (Spec 23). Auto-pivots into Combat when the resolved event is an `encounter`. |
| Combat     | Resumes any active fight. Drives `resolveCombatRound` round by round; offers `attack` / `defend` / `skill` / `item` actions when affordable. |
| Journal    | Read-only: active / completed quests + flags + alignment stub.   |
| Skills     | Read-only: learned/unlocked skills; legacy equipped view is removed by Phase 99. |
| Codex      | **(Phase 82)** Read-only render of `state.codex.unlockedEntries` (Phase 73). Looks up each entry id via a one-time `EnemyLibrary` walk (`codexLookup` at module load); renders title + body per entry. Empty-state copy: "Your codex is empty — befriend a foe with a journal entry to start filling it." |
| Inventory  | Read-only listing of carried items.                              |
| Character  | Full stats + equipment + effects sheet (Phase 26 unit 3). When `availableStatPoints > 0`, prompts the player to spend points into heart / body / mind via `allocateStatPoint` (Phase 29). |
| Debug      | Spawns any enemy from `ENEMY_REGISTRY` directly into combat (Phase 19). |
| Begin again | **(Phase 82)** Prompts the player to reset to the starting hearth via `store.resetRun({ keepCharacter })` (Phase 72). Three options: **full reset** (`keepCharacter: false` — new character + new world), **keep character** (`keepCharacter: true` — fresh world, character ledger preserved per the Phase 72 D-decisions: `philosophicalAlignment` + `moralMeter` + `rngState` + `codex` survive), and **cancel** (no-op return). Logs the post-reset `runId` + hearth node id. |
| Save       | Writes the current state to the `--save-file` snapshot slot via a dedicated `PersistenceAdapter` (Phase 27 unit 2). Decoupled from dispatch-time autosave so Load is a real rollback. |
| Load       | Restores the snapshot via `setState`. Emits `game:loaded`. |
| Quit       | Emits `cli:exit` with reason `'quit'` and returns. |

Run via `npm run game` (which invokes `npx ts-node src/CLI/game.cli.ts`).
Flags: `--script <path>` for scripted answers (Phase 20), `--json-events`
for machine-clean stdout, `--state-log <path>` for the Phase 26 state
log, `--save-file <path>` for the Phase 27 Save / Load slot.
