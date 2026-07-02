# Phase 27 — Exploration `moveToAction` migration (engine `revealAdjacent` / `markNodeConsumed`)

> **Status: [ ] — sized 1-2 ticks.** Promoted via `/oversight`
> 2026-05-15 (score 6.6). Candidate filed in expand pass 6;
> source: Phase 23 brief deferral, original cross-repo
> versioning audit gap I.

## Outcome

Mobile's `moveToAction` in `state/actions.ts` populates the
engine's new exploration data model (`discoveredNodes` /
`consumedNodes`) alongside the legacy fields it already
writes (`availableNodes` / `completedNodes`). The local
`getMapLayout` traversal that re-derived the unlock graph
from a mobile-side fixture goes away — engine `revealAdjacent`
reads `getMapDefinition(continent, mapName).nodes[].connectedNodes`
directly. The exploration screen continues to render from the
legacy fields (visual-layout-only consumer); a follow-up phase
migrates the screen.

## Routes / API endpoints / CLI surface — locked

None. Internal-only refactor.

## Content / data reads — engine surface

Every read is from `axiomancer-mechanics` top-level barrel.

| Helper | From | Use |
|---|---|---|
| `revealAdjacent(MapState, NodeId): MapState` | top-level (`World/world.reducer`) | After successful move, populate `state.discoveredNodes` with the destination's neighbours per the engine's `MapDefinition` registry |
| `markNodeConsumed(MapState, NodeId): MapState` | top-level | After event resolution at a node, mark it consumed so future encounters don't re-fire there |
| `getMapDefinition(continent, mapName)` | top-level (transitive — invoked inside `revealAdjacent`) | The engine looks up the canonical map graph; no mobile call needed |

**Legacy reducers stay** (still called for the legacy fields the screen reads):

- `completeNode(WorldState, nodeId)` — writes `completedNodes`
- `unlockNode(WorldState, nodeId)` — writes `availableNodes`

## Engine-shape gotcha — DO NOT ASK

The candidate row described the migration as "replace
`worldCompleteNode` / `worldUnlockNode` with `revealAdjacent` /
`markNodeConsumed`." That's misleading. The engine ships
**both data models in the same MapState**:

- Legacy: `availableNodes`, `completedNodes`, `lockedNodes`
- New: `discoveredNodes`, `consumedNodes`

The new fns write only to the new fields; legacy fns write only
to the legacy fields. So the migration is **additive**: mobile
now writes both models. Phase 27 does NOT delete the legacy
calls.

A follow-up phase (call it Phase 30+) migrates the screen and
presenter to read the new fields, after which the legacy
writes can be dropped. Phase 27 is the substrate.

## Components / handlers — modified

**Modified file:**

- `state/actions.ts:moveToAction`
  - Keep the existing `worldCompleteNode` + `worldUnlockNode`
    chain and the `availableNodes` filter cleanup (screen
    reads these).
  - **Add** a `revealAdjacent(currentMap, nodeId)` call after
    the legacy reducer chain, so `discoveredNodes` populates
    with the engine-computed neighbours.
  - **Remove** the `getMapLayout(map.name)` traversal block
    that loops over `connectedNodes` and calls
    `worldUnlockNode` — `revealAdjacent` now populates the
    engine's analogue. The legacy `availableNodes` still
    needs population for the screen, so retain that part via
    a presentation-shape helper (read connectedNodes from
    layout fixture but ONLY for `availableNodes` population,
    not `discoveredNodes`).
  - Note: the legacy `availableNodes` population could later
    derive from `discoveredNodes` once the screen migrates.
- `state/actions.ts:eventActions.resolveCurrentMapEvent`
  - After `resolveMapEvent` returns a non-`none` event, call
    `markNodeConsumed(currentMap, currentNodeId)` so the
    engine's `consumedNodes` field reflects what the player
    actually triggered.

**Untouched (intentionally):**

- `state/exploration-maps/` fixtures stay as the source of
  visual layout (positions, hand-drawn edges). The screen
  reads these for x/y coordinates the engine doesn't carry.
- `app/(tabs)/exploration/index.tsx` — reads
  `availableNodes` / `lockedNodes` / `completedNodes` through
  the presenter. No change.
- `state/presenters/exploration.engine.ts` — reads same
  legacy fields. No change.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at baseline (357/357).
- `revealAdjacent` + `markNodeConsumed` exported from
  `axiomancer-mechanics` top-level (verified at
  `dist/index.d.ts` and `dist/World/world.reducer.d.ts`).
- The maps mobile uses (e.g. `'fishing-village'`) ARE
  registered with `getMapDefinition` — verify via a test that
  calls `revealAdjacent` on a fresh map state and expects a
  non-empty `discoveredNodes` after a move.

**Out (ships in this phase):**

- `state/actions.ts` — `moveToAction` rewrite (additive),
  `resolveCurrentMapEvent` adds `markNodeConsumed` call.
- `state/exploration-maps/` — review to confirm it's only
  used for visual positions, not unlock propagation. Update
  the file-level JSDoc to name the new boundary explicitly
  (Phase 27 made layout fixture visual-only).
- `state/e2e/exploration.engine.test.ts` — add cases:
  - moving to a node populates `discoveredNodes` with its
    neighbours
  - resolving an event marks the node `consumed`
  - legacy `availableNodes` / `completedNodes` still
    populated (screen still reads them)

**Retro-fit (out of scope, follow-up):**

- Phase 30 (TBD): migrate the exploration screen + presenter
  to read `discoveredNodes` / `consumedNodes`. Then drop the
  legacy `availableNodes` / `completedNodes` writes from
  `moveToAction`.
- `state/exploration-maps/` could be reduced further once the
  legacy graph data isn't needed at the screen.

## Decisions made upfront — DO NOT ASK

1. **Additive migration, not replacement.** Engine's new
   data model coexists with the legacy fields in MapState
   (verified). Phase 27 populates both; future phases drop
   the legacy writes. Don't break the screen.

2. **`revealAdjacent` derives neighbours from the engine
   registry**, not the mobile layout fixture. This is the
   point of the migration — removing duplicated graph data.
   The mobile fixture stays for visual positions only.

3. **`markNodeConsumed` is called from
   `resolveCurrentMapEvent`**, not from `moveToAction`. The
   semantics differ: a node becomes "consumed" when its
   event fires, not when the player walks past. (The current
   mobile code conflates these — every move marks a node
   `completed`, regardless of whether an event resolved.)

4. **`completedNodes` legacy write stays in `moveToAction`**
   for now (screen reads it). When the screen migrates, the
   legacy write either drops or moves to
   `resolveCurrentMapEvent` to align with the new semantics.

5. **No new types or exports.** Phase 27 is internal action
   layer only; AppActions / AppStoreState unchanged.

6. **Test fixtures stay deterministic.** Add e2e via a
   real `createGameStore(createMemoryAdapter())` and the
   `'fishing-village'` map; assert post-move that
   `discoveredNodes` includes the neighbours per
   `getMapDefinition`.

## Pages x tests matrix

| Surface | Test file | Cases |
|---|---|---|
| `moveToAction` populates `discoveredNodes` | `state/e2e/exploration.engine.test.ts` | (1) fresh map → move to a node → `discoveredNodes` contains its `connectedNodes` per engine MapDefinition; (2) revealing the same neighbours twice is idempotent; (3) legacy `availableNodes` still populated (no regression for the screen) |
| `resolveCurrentMapEvent` marks consumed | same file (or new section) | (a) resolve a non-none event → `consumedNodes` contains the current node; (b) `kind === 'none'` does NOT mark consumed |
| no-regression on legacy lifecycle | same file | existing legacy-field assertions still pass |

Expected delta: `+3-5` hermetic tests.

## Verify gate

```bash
pnpm verify
```

Target: green. Current baseline 357/357. Expected ~360-362 after ship.

## Deploy gate

Stub. No deploy-side change.

## Commit body template

```
refactor: exploration moveToAction migration to engine reveal/consume (Phase 27)

Engine 0.7.0 ships revealAdjacent + markNodeConsumed reducers
that operate on MapState's new discoveredNodes / consumedNodes
fields. Mobile's moveToAction now populates these alongside the
legacy availableNodes / completedNodes the screen reads —
additive migration, not replacement. The screen + presenter
migration to the new fields is a follow-up phase.

- state/actions.ts: moveToAction adds revealAdjacent call;
  drops the local getMapLayout connectedNodes traversal
  (engine derives neighbours from getMapDefinition).
- state/actions.ts: resolveCurrentMapEvent adds markNodeConsumed
  call after a non-'none' event resolves.
- state/exploration-maps/ JSDoc updated to name the new
  boundary (visual-layout-only now).
- state/e2e/exploration.engine.test.ts: +3-5 cases pinning
  the new data-model writes + no-regression on legacy fields.

Decisions per the brief:
- Additive migration (legacy + new in parallel).
- markNodeConsumed semantics tied to event resolution, not
  movement.
- legacy availableNodes population kept for screen compat.

verify: N tests passing.

Closes #47
```

## Definition of Done

1. `state/actions.ts:moveToAction` calls `revealAdjacent`
   after the legacy lifecycle.
2. `state/actions.ts:resolveCurrentMapEvent` calls
   `markNodeConsumed` after a non-`none` event resolves.
3. `state/exploration-maps/` JSDoc explicitly notes
   "visual-layout-only post-Phase-27".
4. `+3-5` hermetic e2e cases pin the new behaviour and
   no-regression on legacy fields.
5. Phase 27 row flipped `[ ]` → `[x]` with the commit hash.
6. Phase log entry appended.

## Follow-ups (out of scope this phase)

- **Phase 30 (TBD): exploration screen + presenter migration.**
  Switch `state/presenters/exploration.engine.ts` and
  `app/(tabs)/exploration/index.tsx` to read
  `discoveredNodes` / `consumedNodes`. Drop the legacy
  writes from `moveToAction`. Reduce
  `state/exploration-maps/` to coordinates only.
- **Map registry verification.** If the engine
  `getMapDefinition` registry doesn't carry every map mobile
  uses, the migration silently fails for those maps. Add a
  one-time smoke test that asserts the mobile-used maps are
  in `MAP_REGISTRY` before Phase 27 ships.
