# Spec 23 — MapEvents engine + node discovery

> **Addendum (Phase 137, 2026-06-12):** this spec shipped with a fixed
> 8-kind taxonomy. A ninth kind, `quest` (`QuestEventPayload { boardId }`
> → `{ kind: 'quest', boardId }`), was added for the Quest Board
> minigame (`World/QuestBoard`), and the `rest` resolved event now
> carries `healFraction` alongside `healed`. The text below is the
> original point-in-time contract; read "eight" as "the original eight".

## Goal

Replace the bespoke `processNode` dispatcher (Spec 08) with a
`resolveMapEvent(state, rng?): { state, event }` engine that:

- Operates on a fixed 8-kind event taxonomy.
- Rolls an event from a **weighted pool** at the moment a node is
  entered, rather than reading an authored event off `MapDefinition`.
- Tracks **discovery** (fog-of-war) and **consumption** (one-shot)
  per node on `MapState`.

The engine ships **alongside** `processNode` in this spec; Spec 24
migrates content and removes the old dispatcher.

**Success state:** A consumer can `resolveMapEvent(state)` against a
loaded `GameState`, receive a typed `event` describing what happened,
and walk a hermetic e2e from `discoverNode → reveal adjacents → roll
event → resolve → consumed-noop` across all eight kinds.

## Why now / dependencies

- **Unblocks:** Phase 24 (MapEvents content) — needs the engine
  in place.
- **Depends on:** Spec 09 (game store), Spec 08 (current `processNode`
  + `MapState` shape).

## Open questions (all locked here)

1. **Event taxonomy.**
   Eight kinds, final:
   `encounter` (combat), `interaction` (dialogue / story trigger;
   folds old `npc`), `gathering` (resource collection), `rest`
   (recovery), `village` (settlement scene; folds old `shop`),
   `cutscene` (non-interactive beat), `hazard` (environmental damage
   / status), `loot-cache` (fixed-pool inventory grant).
   > Locked.

2. **Pool authoring location.**
   (B) Per-region by default (one pool per map), node-level override
   via an optional `eventPoolId` on the node definition.
   > Locked.

3. **Pool roll cadence.**
   (A) Rolled the first time a node is entered. Result is cached for
   the rest of that node visit (the resolver returns the same event
   if called twice on a not-yet-consumed node).
   > Locked.

4. **Consumption model.**
   (A) One-shot. Once `resolveMapEvent` returns a non-`'none'` event,
   the node is added to `MapState.consumedNodes`; subsequent
   resolution returns `{ kind: 'none' }`. Players can still walk
   through consumed nodes.
   > Locked.

5. **Discovery seeding.**
   The map's `startingNode` is in `discoveredNodes` from
   `createMapState`. Subsequent reveals happen via `revealAdjacent` —
   called from `resolveMapEvent` after a node is consumed.
   > Locked.

6. **Reveal pacing.**
   (A) Revealing adjacent nodes happens at the same time as
   consumption — i.e., the player only sees what's next *after*
   they've resolved the current node.
   > Locked.

7. **Backward compatibility.**
   Spec 23 keeps `processNode` and the old `MapEvent` /
   `MapEventType` types in place. Spec 24 will:
   - Migrate `fishing-village` + `northern-forest` content into
     `MapEventPool` form.
   - Remove `processNode`, `MapEventType`, and the old `MapEvent`
     interface.
   - Switch `gameReducer`'s `PROCESS_NODE` action to dispatch
     `resolveMapEvent` instead.
   > Locked.

8. **RNG plumbing.**
   `resolveMapEvent(state, rng = getRng().random)` follows the same
   contract as `dropItem`. Tests inject a deterministic RNG via the
   `mockSequentialRng` / `mockFixedRng` helpers.
   > Locked.

9. **Return shape (`ResolvedEvent`).**
   Discriminated union by `kind`:
   ```ts
   export type ResolvedEvent =
       | { kind: 'encounter'; encounter: Encounter; isBoss: boolean }
       | { kind: 'interaction'; npcName: string; dialogue?: DialogueTree }
       | { kind: 'gathering'; items: Item[] }
       | { kind: 'rest'; healed: number }
       | { kind: 'village'; villageName: string; merchants: NPC[]; shop?: ShopInventory }
       | { kind: 'cutscene'; lines: readonly string[] }
       | { kind: 'hazard'; effects: ActiveEffect[]; damage: number }
       | { kind: 'loot-cache'; items: Item[]; currency: number }
       | { kind: 'none' };
   ```
   > Locked. The `village` variant gained the optional `shop?:
   > ShopInventory` field at Phase 37 (`f9c18f0`); type lives in
   > `src/Items/shop.types.ts` and rides on the village payload
   > without affecting any other variant.

10. **Pool entry shape.**
    ```ts
    export interface MapEventPoolEntry {
        kind: MapEventKind;
        weight: number;          // weighted-random draw
        payload: MapEventPayload; // discriminated by kind
    }
    export interface MapEventPool {
        id: string;
        entries: readonly MapEventPoolEntry[];
    }
    ```
    > Locked.

11. **Empty / missing pool.**
    Returns `{ kind: 'none' }`. Not an error.
    > Locked.

## Public API additions

```ts
// src/World/MapEvents/types.ts
export type MapEventKind =
    | 'encounter' | 'interaction' | 'gathering' | 'rest'
    | 'village' | 'cutscene' | 'hazard' | 'loot-cache';

export type MapEventPayload = /* discriminated by kind, see below */;
export interface MapEventPoolEntry { kind: MapEventKind; weight: number; payload: MapEventPayload; }
export interface MapEventPool { id: string; entries: readonly MapEventPoolEntry[]; }

export type ResolvedEvent =
    | { kind: 'encounter';  encounter: Encounter; isBoss: boolean }
    | { kind: 'interaction'; npcName: string; dialogue?: DialogueTree }
    | { kind: 'gathering';   items: Item[] }
    | { kind: 'rest';        healed: number }
    | { kind: 'village';     villageName: string; merchants: NPC[]; shop?: ShopInventory }
    | { kind: 'cutscene';    lines: readonly string[] }
    | { kind: 'hazard';      effects: ActiveEffect[]; damage: number }
    | { kind: 'loot-cache';  items: Item[]; currency: number }
    | { kind: 'none' };

export interface ResolveMapEventResult {
    state: GameState;
    event: ResolvedEvent;
}

// src/World/MapEvents/resolve-map-event.ts
export function resolveMapEvent(
    state: GameState,
    rng?: () => number,
): ResolveMapEventResult;
```

`MapState` additions:

```ts
readonly discoveredNodes: ReadonlySet<NodeId>;
readonly consumedNodes:   ReadonlySet<NodeId>;
```

`world.reducer.ts` additions:

```ts
export function revealAdjacent(state: MapState, nodeId: NodeId): MapState;
export function markNodeConsumed(state: MapState, nodeId: NodeId): MapState;
```

## Acceptance checklist

- [x] All open questions are locked above. — Phase 23 `fd01029` shipped
      with every Q resolved; Phase 37 `f9c18f0` added Q on village shop
      attachment (folded into the existing Q9 `village` variant).
- [x] `src/World/MapEvents/types.ts` exports the 8-kind taxonomy and
      every type listed in §Public API additions. — Phase 23 `fd01029`;
      Phase 37 `f9c18f0` added `ShopInventory` re-import +
      `VillagePayload.shop?` field.
- [x] `src/World/MapEvents/handlers/<kind>.ts` exists for all 8 kinds
      and is unit-tested via the integration hermetic e2e. — Phase 23
      `fd01029`; collapsed to a single `handlers.ts` file per the brief
      decision noted at the top of that file (each handler stays short;
      the dispatch table at `handlers.ts:209` keeps the contract).
      Coverage via `src/World/MapEvents/e2e/map-events.engine.test.ts`.
- [x] `src/World/MapEvents/resolve-map-event.ts` exports the
      dispatcher and is hermetic e2e tested. — Phase 23 `fd01029`;
      Phase 31 `711b49e` extended with `unlockAdjacent` traversal fix.
- [x] `MapState` has `discoveredNodes` and `consumedNodes`. — Phase 23
      `fd01029`; `availableNodes` + `lockedNodes` added at Phase 31
      `711b49e`.
- [x] `createMapState` seeds `discoveredNodes` with `startingNode`. —
      Phase 23 `fd01029`; pinned by
      `src/World/world.reducer.test.ts`.
- [x] `revealAdjacent` and `markNodeConsumed` reducers exist. —
      Phase 23 `fd01029`; `unlockAdjacent` added at Phase 31 `711b49e`.
- [x] `processNode` and the old `MapEvent`/`MapEventType` types are
      untouched (Phase 24 removes them). — Phase 25 `7002642` removed
      them per the original deferral; world e2e suite rewritten against
      the new dispatcher (`grep -rn "processNode" src/` returns zero).
- [x] `npm test` and `npm run type-check` are clean. — Standing
      invariant; verify gate green throughout the loop.
- [x] `npm run verify` exits 0. — Standing invariant; pinned by the
      `npm run deploy:check` post-push gate every tick.
- [x] **Phase 37 shop extension.** `VillagePayload.shop?:
      ShopInventory` (+ resolved-event `shop?` mirror), forwarded by
      `resolveVillage`, authored on `fv-3` Fishing Village Stalls and
      `nf-8` Glen Market. — Phase 37 `f9c18f0`; content-drift assertion
      in `src/World/MapEvents/e2e/content.engine.test.ts`
      ("Phase 37 shop content").
- [x] **Phase 43 alignment-shifting extension.** `MapEventPoolEntry.alignmentDelta?:
      Partial<PhilosophicalAlignment>` (sibling field to `payload`,
      applied by `resolveMapEvent` between handler and consume/reveal).
      Authored across 6 pool entries (fv-1 / fv-8 / fv-9 / fv-10 /
      nf-4 / nf-10) inside the `±1..±5` band moralMeter uses. — Phase 43
      `764de7f`; field declaration + apply path in `src/World/MapEvents/types.ts`
      + `src/World/MapEvents/resolve-map-event.ts`; hermetic coverage in
      `src/Philosophy/e2e/alignment-authoring.engine.test.ts`.
- [x] **Phase 65 fishing-village expansion (content delta).** The
      canonical starting map grew from a linear 10-node chain along
      the dockside to a 25-node branching grid with three sub-areas
      (Harbor District `fv-11..fv-15`, Inland Streets `fv-16..fv-20`,
      Cliff Path `fv-21..fv-25`). The original spine `fv-1..fv-10`
      preserved verbatim along `y=0`; `connectedNodes` extended (not
      replaced) so existing Phase 23 / 24 pool overrides, Phase 43
      `alignmentDelta` authoring, Phase 62 flag-gated dialogue, and
      Phase 63 observer wiring continue to function without
      modification. 15 new `MapEventPool` consts registered in
      `FISHING_VILLAGE_POOLS`; all 8 `MapEventKind` values now appear
      multiple times across the 25 nodes. 6 of the 15 new pools carry
      `alignmentDelta` annotations (~60% density mirroring Phase 43's
      first-pass). Phase 60 befriendable enemies placed in the world
      (MournfulGull at `fv-15` gull crag; HollowEyedBeggar at `fv-18`
      back alley). — Phase 65 `4f3b9ec` (node structure) + `e8d3b90`
      (pool authoring) + `e7da1d7` (hermetic e2e + docs); 7 cases in
      `src/World/e2e/world.engine.test.ts` Phase 65 describe block.

## Out of scope

- Migrating existing content (`fishing-village`, `northern-forest`)
  into the new shape — that's Spec 24.
- Removing `processNode` — Spec 24.
- Authoring per-region pools — Spec 24.
- Shrine / puzzle / monument kinds — track in PHASE_CANDIDATES.
- Cross-region travel events — out of scope.
