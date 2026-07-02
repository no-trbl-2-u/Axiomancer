# Phase 21 — Phase 12 API cleanup

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

The four Phase 12 cleanup findings filed by `/critique` (one HIGH, two
MEDs, one LOW) are resolved in a single coherent pass:

- `createNodeAdapter` is no longer re-exported from the core barrel — RN
  consumers get an `fs`-free import.
- The typed event surface (`events.types.ts` + `events.utils.ts`) is
  rewritten to match the shape the engine actually emits. All 10
  `GameEventType` topics are covered; the partial / fictional payload
  contracts are gone.
- The unused `create*Event` factories are deleted (engine doesn't call
  them; consumer code didn't either).
- The redundant `as Payload` casts go with the factories.
- `is*Event` guards stay, expanded to cover all 10 topics.
- `src/Combat/e2e/events.engine.test.ts` (and any other consumer of the
  changed surface) is updated to the new shape.

## Source spec

No dedicated `specs/21-*.md` file — feature row in
`plan/steps/01_build_plan.md`:

> Phase 21 — Phase 12 API cleanup (Node adapter leak, partial typed events, unused creators, redundant casts)

Resolved questions:

1. **Widen the typed payloads, or rewrite the engine to produce the
   declared shapes?**
   Widen. The engine emits a uniform `{ action, state, report? }`
   envelope from `eventForAction` (Spec 09 design); refactoring every
   reducer / emit site to produce hand-crafted per-topic payloads is a
   much larger project than this phase and would touch the store, the
   game-reducer, and every dispatch path. Aligning the types to reality
   resolves the HIGH critique today; richer payloads can land later as
   a deliberate UI-facing rewrite.
2. **Keep the `Typed*Event` aliases?**
   Yes, as a generic alias. Replace each per-event interface with a
   `type` alias over a generic `TypedGameEvent<T>`:
   ```ts
   export interface EnginePayload { action: GameAction; state: GameState; report?: CombatEndReport; }
   export interface TypedGameEvent<T extends GameEventType = GameEventType> extends GameEvent {
       type: T;
       payload: EnginePayload;
   }
   export type TypedCombatStartedEvent = TypedGameEvent<'combat:started'>;
   // ...for all 10 topics.
   ```
3. **Drop the `create*Event` factories?**
   Yes. Engine never used them; consumer-side construction is
   unmotivated (consumers consume events, they don't fabricate them).
   Deleting them resolves the MED finding and removes the LOW
   cast-finding's surface.
4. **Keep the `is*Event` guards?**
   Yes. Expand to all 10 topics. A guard like
   `isInventoryChangedEvent(e)` is genuine type-narrowing sugar over
   `e.type === 'inventory:changed'` and stays useful for
   filter-style consumer code.
5. **`PersistenceAdapter` interface on core barrel?**
   Keep. RN consumers need it to author their own AsyncStorage adapter.
   Concrete `createNodeAdapter` moves to `'./node'` subpath exclusively
   (Phase 12 already created that subpath; we're closing the leak).
6. **Public-API removals — semver concern?**
   The library is `0.6.0` pre-1.0; breaking changes in 0.x are
   conventional. The typed event surface was labelled Beta in
   `docs/api.md` so churn was foreshadowed. No semver bump in this
   phase; document the change in the commit body.
7. **Existing `events.engine.test.ts` references?**
   Update. The two `isCombatStartedEvent` / `isCombatEndedEvent` call
   sites stay green; the test that asserts on rich payload fields will
   need to be relaxed to match the new envelope shape.
8. **Update `docs/api.md`?**
   Yes — rewrite the Beta-events row to reflect the post-Phase-21
   shape and document `'./node'` as the only path for
   `createNodeAdapter`.

## Implementation units (commit per unit)

### Unit 1 — Drop `createNodeAdapter` from the core barrel

Files:
- `src/index.ts`: remove `createNodeAdapter` from the value export
  block (line ~130). Keep `PersistenceAdapter` (line ~136) — it's the
  interface RN consumers need.
- `src/Game/index.ts`: remove `createNodeAdapter` from the re-export
  block (line ~34).
- `src/node.ts`: confirm it still exports `createNodeAdapter` —
  unchanged.
- `docs/api.md`: update the Stability Levels list to mark
  `createNodeAdapter` as available only via the `'./node'` subpath.

Run `npm run type-check && npm test` — must stay green.

Commit: `fix(api): remove createNodeAdapter from core barrel (RN tree-shake fix)`

### Unit 2 — Rewrite `events.types.ts`

File: `src/Game/events.types.ts` — full rewrite (~60 LOC →
~40 LOC).

New content (full file):

```ts
/**
 * Typed event surface (post-Phase-21).
 *
 * The engine emits one uniform envelope from `eventForAction`:
 *   { type, payload: { action, state, report? } }
 * `TypedGameEvent<T>` narrows the `type` field for consumers; the
 * `payload` shape is the same for every topic. Per-topic aliases
 * (`TypedCombatStartedEvent`, ...) cover all 10 `GameEventType`
 * values so the narrowed type is concrete at every guard call site.
 */

import type { GameEvent, GameEventType } from './events';
import type { GameState } from './types';
import type { GameAction } from './actions.types';
import type { CombatEndReport } from './store';

/** The shape every emitted event carries today. */
export interface EnginePayload {
    action: GameAction;
    state: GameState;
    report?: CombatEndReport;
}

/** GameEvent narrowed by `type`. Payload is always the engine envelope. */
export interface TypedGameEvent<T extends GameEventType = GameEventType> extends GameEvent {
    type: T;
    payload: EnginePayload;
}

export type TypedCombatStartedEvent     = TypedGameEvent<'combat:started'>;
export type TypedCombatRoundEvent       = TypedGameEvent<'combat:round'>;
export type TypedCombatEndedEvent       = TypedGameEvent<'combat:ended'>;
export type TypedWorldMovedEvent        = TypedGameEvent<'world:moved'>;
export type TypedWorldProcessedEvent    = TypedGameEvent<'world:processed'>;
export type TypedLevelUpEvent           = TypedGameEvent<'character:levelup'>;
export type TypedInventoryChangedEvent  = TypedGameEvent<'inventory:changed'>;
export type TypedDialogueAppliedEvent   = TypedGameEvent<'dialogue:applied'>;
export type TypedGameSavedEvent         = TypedGameEvent<'game:saved'>;
export type TypedGameLoadedEvent        = TypedGameEvent<'game:loaded'>;
```

The deleted symbols:
- `CombatStartedPayload`, `CombatEndedPayload`, `CombatRoundPayload`,
  `LevelUpPayload`, `InventoryChangedPayload`, `WorldMovedPayload`,
  `WorldProcessedPayload`, `CombatSubEvent` — replaced by
  `EnginePayload`.

Commit: `fix(events): align typed event payloads with engine reality (EnginePayload)`

### Unit 3 — Rewrite `events.utils.ts`

File: `src/Game/events.utils.ts` — drop the seven `create*Event`
factories and expand the guards to cover all 10 topics.

New content (full file):

```ts
/**
 * Type guards for narrowing `GameEvent` by topic. Sugar over
 * `event.type === '...'` that lets consumers use Array.filter /
 * Array.find with proper type narrowing.
 *
 * Pre-Phase-21 also shipped `create*Event` factories; they were
 * removed because the engine emits events directly via the store's
 * dispatch path and consumer-side fabrication has no use case.
 */

import type { GameEvent } from './events';
import type {
    TypedCombatStartedEvent, TypedCombatRoundEvent, TypedCombatEndedEvent,
    TypedWorldMovedEvent, TypedWorldProcessedEvent,
    TypedLevelUpEvent, TypedInventoryChangedEvent,
    TypedDialogueAppliedEvent, TypedGameSavedEvent, TypedGameLoadedEvent,
} from './events.types';

export function isCombatStartedEvent(e: GameEvent): e is TypedCombatStartedEvent {
    return e.type === 'combat:started';
}
export function isCombatRoundEvent(e: GameEvent): e is TypedCombatRoundEvent {
    return e.type === 'combat:round';
}
export function isCombatEndedEvent(e: GameEvent): e is TypedCombatEndedEvent {
    return e.type === 'combat:ended';
}
export function isWorldMovedEvent(e: GameEvent): e is TypedWorldMovedEvent {
    return e.type === 'world:moved';
}
export function isWorldProcessedEvent(e: GameEvent): e is TypedWorldProcessedEvent {
    return e.type === 'world:processed';
}
export function isLevelUpEvent(e: GameEvent): e is TypedLevelUpEvent {
    return e.type === 'character:levelup';
}
export function isInventoryChangedEvent(e: GameEvent): e is TypedInventoryChangedEvent {
    return e.type === 'inventory:changed';
}
export function isDialogueAppliedEvent(e: GameEvent): e is TypedDialogueAppliedEvent {
    return e.type === 'dialogue:applied';
}
export function isGameSavedEvent(e: GameEvent): e is TypedGameSavedEvent {
    return e.type === 'game:saved';
}
export function isGameLoadedEvent(e: GameEvent): e is TypedGameLoadedEvent {
    return e.type === 'game:loaded';
}
```

Commit: `fix(events): drop dead create*Event factories; expand guards to all 10 topics`

### Unit 4 — Update barrel + test

File: `src/index.ts`:
- Drop value re-exports of the seven `create*Event` factories.
- Drop type re-exports of the old `*Payload` interfaces and
  `CombatSubEvent`.
- Add `EnginePayload`, the three new typed aliases
  (`TypedDialogueAppliedEvent`, `TypedGameSavedEvent`,
  `TypedGameLoadedEvent`), and the three new guards
  (`isDialogueAppliedEvent`, `isGameSavedEvent`, `isGameLoadedEvent`).

File: `src/Game/e2e/events.engine.test.ts`:
- Relax the "rich payload" assertion. The new payload is
  `{ action, state, report? }`. Update the test to assert the
  envelope shape instead.

Run `npm run verify` — full suite plus type-check plus build must stay
green.

Commit: `chore(api): refresh src/index.ts exports + events.engine.test for new envelope`

### Unit 5 — Move the four CRITIQUE findings to Done + Phase 21 DoD

File: `plan/CRITIQUE.md`:
- Move these from Pending to Done with the final commit hash:
  - `[HIGH] Typed event payloads diverge from runtime shape — guards are fictional`
  - `[MED] Phase 12 left Node adapter duplicate-exported on the core barrel`
  - `[MED] Phase 12 typed event surface covers only 7 of 10 GameEventType values`
  - `[MED] Typed event creators are exported but never produced inside the engine`
  - `[LOW] events.utils.ts uses redundant `as Payload` casts on literal payloads`

File: `plan/steps/01_build_plan.md`:
- Flip Phase 21 to `[x]` with the final commit hash.

Run `npm run deploy:check` — must exit 0.

Commit: `plan: phase 21 shipped — Phase 12 API cleanup`

## Decisions made upfront — DO NOT ASK

- **Widen, don't rewrite.** §Q1.
- **Drop `create*Event` factories.** §Q3.
- **Keep `is*Event` guards for all 10 topics.** §Q4.
- **`createNodeAdapter` lives only at `'./node'`.** §Q5.
- **`PersistenceAdapter` interface stays on the core barrel.** §Q5.
- **No semver bump.** Pre-1.0; Beta tier explicit. §Q6.
- **No commander, no inquirer, no new deps.**

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Definition of Done

- [ ] `createNodeAdapter` removed from `src/index.ts` and `src/Game/index.ts`; still in `src/node.ts`
- [ ] `src/Game/events.types.ts` exports `EnginePayload` and 10 `Typed*Event` aliases
- [ ] `src/Game/events.utils.ts` exports 10 `is*Event` guards; no `create*Event` factories
- [ ] `src/index.ts` re-exports the new surface
- [ ] `docs/api.md` reflects the post-Phase-21 shape
- [ ] `plan/CRITIQUE.md` has the four Phase-12 critique findings under Done
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] Phase 21 row in `plan/steps/01_build_plan.md` is `[x]` with hash

## Follow-ups (out of scope)

- A real "rich payload" pass (separate per-topic payload shape that the
  engine actually produces) — that's a Phase 30-ish project, not this
  cleanup.
