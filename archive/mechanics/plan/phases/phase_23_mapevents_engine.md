# Phase 23 — MapEvents engine + node discovery

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

A new `resolveMapEvent` dispatcher lands next to `processNode`,
covering the new 8-kind event taxonomy and a fog-of-war discovery
mechanic. The new surface:

- Lives in `src/World/MapEvents/` (new module).
- Exports `resolveMapEvent(state, rng?): { state, event }` — the
  single entry point that rolls a one-shot event from the active
  node's pool and resolves it through the appropriate handler.
- Ships eight handlers, one per kind: `encounter`, `interaction`,
  `gathering`, `rest`, `village`, `cutscene`, `hazard`, `loot-cache`.
- Tracks **discovered** and **consumed** node sets on `MapState`.
  Nodes start undiscovered; entering a node reveals its adjacent
  nodes; resolving a node's event marks it consumed.
- The old `processNode` stays untouched; Phase 24 migrates content
  into the new shape and removes `processNode`. This phase ships the
  engine in parallel.

A hermetic e2e covers discover → reveal → roll → resolve → exhaustion
across all eight kinds.

## Source spec

This phase introduces a new spec file: `specs/23-map-events.md`. The
spec captures the 8-kind taxonomy, the pool-roll model, and the
fog-of-war + one-shot mechanics. The brief is a faithful reduction.

Resolved questions:

1. **Live alongside or replace `processNode`?**
   Live alongside. Phase 24 migrates content + removes the old
   dispatcher. Keeping both during Phase 23 keeps the existing world
   e2e suite green throughout.
2. **Module name?**
   `src/World/MapEvents/` (PascalCase to match `Character/`, `Combat/`).
   Public barrel re-exports through `src/World/index.ts` and
   `src/index.ts`.
3. **Event kind taxonomy?**
   The eight final names (per `plan/PHASE_CANDIDATES.md`):
   `encounter`, `interaction`, `gathering`, `rest`, `village`,
   `cutscene`, `hazard`, `loot-cache`. NO `npc` / `shop` kinds —
   `interaction` folds `npc`; `village` folds `shop`.
4. **Event-pool shape?**
   ```ts
   export interface MapEventPoolEntry {
       kind: MapEventKind;
       weight: number;          // for weighted-random draw
       payload: MapEventPayload; // discriminated by kind
   }
   export interface MapEventPool {
       id: string;              // e.g. 'fishing-village.coastal-encounter'
       entries: readonly MapEventPoolEntry[];
   }
   ```
   Pools live in content files (Phase 24); the engine consumes them.
5. **Per-node vs per-region pool?**
   Per-region by default (one pool per map). A node can override by
   declaring `eventPoolId` on its definition. Both live on
   `MapDefinition`; the engine prefers node-level when present.
6. **Discovery state shape?**
   Extend `MapState`:
   ```ts
   readonly discoveredNodes: ReadonlySet<NodeId>;
   readonly consumedNodes:   ReadonlySet<NodeId>;
   ```
   The reducer exposes `revealAdjacent(state, nodeId)` and
   `markNodeConsumed(state, nodeId)`. Both pure.
7. **Discovery seeding?**
   The map's `startingNode` is auto-discovered when the map is
   entered. The engine never moves the player; discovery is a side
   effect of `moveToNode` (existing reducer) + `resolveMapEvent`.
8. **One-shot consumption?**
   `resolveMapEvent` checks `consumedNodes`. If the active node is
   already consumed, returns `{ state, event: { kind: 'none' } }`
   without re-rolling. Players can still walk through consumed nodes.
9. **RNG plumbing?**
   `resolveMapEvent(state, rng = getRng().random)` follows the same
   contract as `dropItem`. Tests inject a deterministic RNG via
   `mockSequentialRng` etc.
10. **What does `event` in the return shape look like?**
    Discriminated by `kind`:
    ```ts
    export type ResolvedEvent =
        | { kind: 'encounter'; encounter: Encounter; isBoss: boolean }
        | { kind: 'interaction'; npcName: string; dialogue?: DialogueTree }
        | { kind: 'gathering'; items: Item[] }
        | { kind: 'rest'; healed: number }
        | { kind: 'village'; villageName: string; merchants: NPC[] }
        | { kind: 'cutscene'; lines: readonly string[] }
        | { kind: 'hazard'; effects: ActiveEffect[]; damage: number }
        | { kind: 'loot-cache'; items: Item[]; currency: number }
        | { kind: 'none' };
    ```
11. **Naming for new types?**
    `MapEventKind` (the 8-way union), `MapEventPayload`,
    `MapEventPool`, `MapEventPoolEntry`, `ResolvedEvent`,
    `ResolveMapEventResult`. Old `MapEvent` and `MapEventType` stay
    in `src/World/types.d.ts` for the duration of Phase 23 and
    disappear in Phase 24.
12. **Hermetic e2e shape?**
    `src/World/MapEvents/e2e/map-events.engine.test.ts` —
    one `describe` per kind, plus an integration block that walks
    discover → reveal → roll → resolve → consumed-noop. Use
    `mockSequentialRng` or `mockFixedRng` to pin the weighted draw.
13. **Documentation?**
    `docs/world.md` gains a "MapEvents (Spec 23)" subsection. Bearings
    is unchanged — the new module doesn't affect cross-cutting rules.

## Implementation units (commit per unit)

### Unit 1 — Author `specs/23-map-events.md`

The spec doc captures everything from the brief in the project's
standard spec format (Goal / Open questions with locked answers /
Acceptance checklist). The spec is the durable record; the brief is
the implementer's task list.

Commit: `specs: add Spec 23 — MapEvents engine + node discovery`

### Unit 2 — Add the new types

File: `src/World/MapEvents/types.ts` (new)

Exports the 8-way `MapEventKind`, the per-kind `MapEventPayload`
discriminated union, the `MapEventPool` shape, and `ResolvedEvent` /
`ResolveMapEventResult` return shapes.

Commit: `feat(world): add MapEvents type surface (8-kind taxonomy)`

### Unit 3 — Discovery state on `MapState`

File: `src/World/types.d.ts` — add `discoveredNodes` and
`consumedNodes` to `MapState`.

File: `src/World/world.reducer.ts` — add `revealAdjacent`,
`markNodeConsumed`, plus update `createMapState` to seed
`discoveredNodes` with the map's `startingNode`. Update existing
callers (the encounter-test fixture, the world e2e walkthrough)
minimally: empty sets are fine for the migration window.

Commit: `feat(world): track discoveredNodes + consumedNodes on MapState`

### Unit 4 — Per-kind resolution handlers

File: `src/World/MapEvents/handlers/` — one file per kind. Each
handler takes `(state, payload, rng)` and returns
`{ state, event }`. Reuse existing helpers where possible
(`generateEncounter`, `applyReward` semantics from `process-node.ts`,
`progressQuest`, `applyEffect`).

Commit: `feat(world): implement 8 MapEvent handlers`

### Unit 5 — The `resolveMapEvent` dispatcher

File: `src/World/MapEvents/resolve-map-event.ts` (new)

Signature: `resolveMapEvent(state, rng?): { state, event }`. The
dispatcher:
1. Looks up the active node.
2. If already in `consumedNodes`, returns `{ state, event: { kind: 'none' } }`.
3. Reveals adjacent nodes (via `revealAdjacent`).
4. Picks the active node's event pool (node-level override → map
   default).
5. Weighted-rolls one entry from the pool.
6. Delegates to the matching handler.
7. Adds the active node to `consumedNodes`.
8. Returns the result.

Commit: `feat(world): add resolveMapEvent dispatcher (pool roll + handler delegate)`

### Unit 6 — Public exports + hermetic e2e

Files:
- `src/World/index.ts` — re-export the new public types + dispatcher.
- `src/index.ts` — re-export through the package barrel.
- `src/World/MapEvents/e2e/map-events.engine.test.ts` (new) — 8
  per-kind describes + 1 integration describe.

Commit: `test(world): hermetic e2e for MapEvents engine`

### Unit 7 — Docs + DoD

- `docs/world.md`: add a "MapEvents (Spec 23)" subsection summarising
  the taxonomy, the pool model, and the discovery / consumption
  contract.
- Flip Phase 23 in `plan/steps/01_build_plan.md` to `[x]`.

Commit: `plan: phase 23 shipped — MapEvents engine + node discovery`

## Decisions made upfront — DO NOT ASK

- **Live alongside `processNode`.** Phase 24 migrates and removes.
- **Eight kinds, fixed.** Future kinds add via a separate spec.
- **Per-region pools, node-level override.** §Q5.
- **`MapState` discovery + consumption sets.** §Q6.
- **RNG injectable.** §Q9.
- **No public-API breakage in Phase 23.** Phase 24 owns the
  removal of `MapEvent` / `MapEventType` / `processNode`.

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Definition of Done

- [ ] `specs/23-map-events.md` exists
- [ ] `src/World/MapEvents/types.ts` exports the 8-kind taxonomy
- [ ] `MapState` has `discoveredNodes` and `consumedNodes`
- [ ] `revealAdjacent` and `markNodeConsumed` reducers exist
- [ ] 8 per-kind handlers under `src/World/MapEvents/handlers/`
- [ ] `resolveMapEvent` dispatcher exists at
      `src/World/MapEvents/resolve-map-event.ts`
- [ ] `src/World/MapEvents/e2e/map-events.engine.test.ts` covers all
      8 kinds + the integration walkthrough
- [ ] Public barrel (`src/index.ts`) re-exports the new surface
- [ ] `docs/world.md` has a MapEvents (Spec 23) section
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] Phase 23 row in `plan/steps/01_build_plan.md` is `[x]` with hash

## Follow-ups (out of scope)

- Phase 24 migrates `fishing-village` + `northern-forest` content
  into the new shape and removes `processNode`.
- Shrine / puzzle / monument kinds — track in PHASE_CANDIDATES as a
  follow-up spec if needed.
- Cross-region travel events — out of scope.
