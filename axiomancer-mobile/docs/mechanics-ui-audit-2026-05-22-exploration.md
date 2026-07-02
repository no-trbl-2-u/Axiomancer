# Mechanics ↔ UI audit — exploration surface (2026-05-22)

> Filed by `/iterate` ([4.0] AUDIT row, oversight 27th).
> Sibling of the combat + event audits. Scope:
> `state/presenters/exploration.engine.ts`,
> `app/(tabs)/exploration/index.tsx`,
> `state/actions.ts` exploration-related actions
> (`moveToAction`, `resolveCurrentMapEventAction`,
> `changeMapAction`), `state/exploration-maps/event-pools.ts`,
> the mobile-local `state/exploration-maps/` fixtures.

---

## Index

| # | Decision | Verdict |
|---|----------|---------|
| 1 | Presenter reads legacy `availableNodes` / `completedNodes` / `lockedNodes` | MOBILE-ONLY (Phase 27 transition state) |
| 2 | `moveToAction` dual-writes legacy fields AND engine `revealAdjacent` | ALIGNED (intentional dual-write per Phase 27) |
| 3 | `resolveCurrentMapEventAction` dual-writes `completedNodes` + engine `markNodeConsumed` | ALIGNED (parallel Phase 27 dual-write) |
| 4 | Mobile `NodeType` (encounter/boss/rest/etc.) vs engine event-pool registration | **DRIFT (latent)** — UI type could disagree with the actually-registered pool |
| 5 | `triggersCombat: kind === 'available' && ENCOUNTER_NODE_TYPES.has(n.type)` | MOBILE-ONLY (chrome only — doesn't drive event firing) |
| 6 | `changeMapAction` uses `createMapState(getMapDefinition(...))` (Phase 60a) | ALIGNED |
| 7 | `(state as any).world` cast in presenter + actions | **DRIFT (typing)** |
| 8 | `getMapLayout(name)` for visual positions / connectedNodes | ALIGNED (Phase 27 boundary: layout = visual-only; engine `getMapDefinition` = unlock-graph truth) |
| 9 | `leaguesFromDistance` 80/160 cutoffs on canonical 360×400 viewBox | MOBILE-ONLY (presentational) |
| 10 | `ACTION_ICON_BY_TYPE['encounter'] = 'flee'` | **DRIFT (chrome)** — encounter nodes show a flee icon |
| 11 | Drawer copy + legend chrome | MOBILE-ONLY |
| 12 | `buildEdges` traveled vs locked classification | ALIGNED |

---

## 1. Presenter reads legacy `availableNodes` / `completedNodes` / `lockedNodes` — MOBILE-ONLY (Phase 27 transition state)

**UI:** `state/presenters/exploration.engine.ts:259-261`:
```ts
const completed = world.currentMap.completedNodes;
const available = world.currentMap.availableNodes;
const locked = world.currentMap.lockedNodes;
```

**Engine:** post-Phase-27 ships parallel `discoveredNodes` and
`consumedNodes` fields populated via `revealAdjacent` /
`markNodeConsumed`. Both shapes coexist on `MapState` (the
legacy ones via mobile dual-write; the new ones via engine
direct).

**Verdict:** MOBILE-ONLY transition state. Per Phase 27's
"visual-layout-only post-Phase-27" boundary doc
(`state/exploration-maps/types.ts`), the presenter still reads
the legacy fields because the screen layer was deferred (Phase
30 TBD). Risk: if the engine ever stops dual-populating the
legacy fields, the presenter silently loses signal.

**Action:** file a `[3.0]` follow-up tick to migrate the
presenter onto `discoveredNodes` / `consumedNodes` and retire
the legacy reads. The mobile dual-write in `moveToAction` can
shrink to engine-only at that point.

---

## 2. `moveToAction` dual-writes legacy + engine fields — ALIGNED (Phase 27)

**UI:** `state/actions.ts:784-828`. After a move:
1. `worldCompleteNode(world, nodeId)` — adds to legacy
   `completedNodes`.
2. Filter `availableNodes` to drop the just-entered node.
3. Walk `layout.connectedNodes` and `worldUnlockNode` each
   outbound edge into `availableNodes`.
4. `writeCurrentNodeId(...)` — sets `currentNodeId`.
5. `revealAdjacent(nextWorld.currentMap, nodeId)` — populates
   the engine's parallel `discoveredNodes` field.

**Engine:** `revealAdjacent(mapState, nodeId)` derives
neighbours from `getMapDefinition(continent, name).nodes[].connectedNodes`
and adds them to `discoveredNodes`.

**Verdict:** ALIGNED. Phase 27 explicitly shipped this as a
dual-write so the engine's parallel data model gets populated
while the screen continues to read legacy. No drift.

---

## 3. `resolveCurrentMapEventAction` dual-writes — ALIGNED

**UI:** `state/actions.ts:985+`. After a non-'none' event
resolves: adds the node to engine `consumedNodes` via
`markNodeConsumed`, coexists with `completedNodes` already
populated by `moveToAction`.

**Engine:** `markNodeConsumed(mapState, nodeId)` — engine
parallel of consumption.

**Verdict:** ALIGNED. Same Phase 27 dual-write pattern.

---

## 4. Mobile `NodeType` vs engine event-pool registration — **DRIFT (latent)**

**UI:** `state/exploration-maps/<map>.layout.ts` declares each
node with a `type: NodeType` (`encounter`, `boss`, `rest`,
`gather`, `treasure`, `quest`). The presenter classifies the
node visually based on this type.

**Engine:** `state/exploration-maps/event-pools.ts` registers a
specific engine event pool per node via
`setNodeEventPoolOverride(continent, mapId, nodeId, poolId)`.
The pool id is a separate constant; what actually fires when
the player walks onto the node depends on the pool, not the
visual type.

**Verdict:** **DRIFT (latent).** A node typed `'encounter'` in
the layout fixture COULD be registered to fire e.g.
`'rest-shared'` (no real check enforces alignment). Today they
agree (event-pools.ts maps each node-type to a sensible pool)
but no test pins the contract. A new map added without the
companion pool registration would render an encounter icon
that fires a gather event.

**Fix proposal:** add a hermetic test that asserts every
`type: 'encounter'` node in the mobile layouts has an
`encounter-*` pool registered for it (and similar for boss /
rest / gather / treasure / quest). The chaos-pool DEV mode
(`DebugChaosToggle`) intentionally violates this; the test
should gate by checking only when chaos is OFF. Score `[3.0]`.

---

## 5. `triggersCombat` is chrome-only — MOBILE-ONLY

**UI:** `state/presenters/exploration.engine.ts:273-275`:
```ts
triggersCombat: kind === 'available' && ENCOUNTER_NODE_TYPES.has(n.type),
```

**Engine:** event firing is entirely driven by
`resolveCurrentMapEventAction` → `resolveMapEvent(state)` → the
node's registered pool. The `triggersCombat` flag never reaches
the engine; the screen uses it for icon swaps and ARIA labels
only.

**Verdict:** MOBILE-ONLY. Worth pinning: if a future refactor
treats `triggersCombat` as authoritative, the screen could
gate combat-related affordances against a wrong source.

---

## 6. `changeMapAction` uses `createMapState(getMapDefinition(...))` — ALIGNED

**UI:** `state/actions.ts:836-852`. Post-Phase-60a migration —
the two-step `createMapState(getMapDefinition(continent,
mapName))` form replaced the removed
`getCoastalMap(name)` single-call.

**Engine:** `getMapDefinition` + `createMapState` are the
canonical post-0.10.1 surface.

**Verdict:** ALIGNED. Migration tracked in Phase 60a row of
the build plan.

---

## 7. `(state as any).world` cast — **DRIFT (typing)**

**UI:** `state/presenters/exploration.engine.ts:243`,
`state/actions.ts:766` + others. The presenter and actions
take a `GameStore` / `AppStore` parameter but cast to `any` to
reach `.world` (and downstream `currentMap`, `currentNodeId`,
etc.).

**Engine:** `GameStore` / `AppStoreState` carries a typed
`world: WorldState` field.

**Verdict:** **DRIFT (typing).** The cast bypasses the engine's
typed world surface. Probably a hold-over from an engine
version where `world` was added late. Behaviorally fine; the
cast can be removed.

**Fix proposal:** drop the `(state as any).world` cast at all
sites; let the engine type narrow `state.world` directly.
Score `[2.5]` (mechanical refactor; ~5 sites).

---

## 8. `getMapLayout(name)` for visual positions / connectedNodes — ALIGNED

**UI:** `state/exploration-maps/index.ts` — `getMapLayout(name)`
returns the mobile-local layout with `x/y` positions, `label`,
`type`, `description`, and `connectedNodes[]` per node.

**Engine:** `getMapDefinition(continent, name).nodes[]`
authoritative for the unlock graph + node ids.

**Verdict:** ALIGNED (Phase 27 boundary).
`state/exploration-maps/types.ts` JSDoc names the boundary
explicitly: layout = visual-only; engine = unlock truth. The
mobile `connectedNodes[]` field shadows the engine's identical
field (the layout fixtures must match the engine map
definition's connectedNodes for the visual edges to match the
playable unlocks). No test pins this — see row 4's adjacent
concern.

---

## 9. `leaguesFromDistance` 80/160 cutoffs — MOBILE-ONLY

**UI:** `state/presenters/exploration.engine.ts:178-182`.
Buckets Euclidean distance (in 360×400 viewBox pixels) into
I/II/III for the step-card right column glyph.

**Engine:** no engine concept of "leagues" (it's a
presentational distance heuristic).

**Verdict:** MOBILE-ONLY. Calibrated against shipped layout
fixtures.

---

## 10. `ACTION_ICON_BY_TYPE['encounter'] = 'flee'` — **DRIFT (chrome)**

**UI:** `state/presenters/exploration.engine.ts:120`. The
step-card for an encounter node uses the `'flee'` icon kind.

**Engine:** N/A — icon mapping is mobile-local.

**Verdict:** **DRIFT (chrome).** Reading the step-card list, an
encounter node displays the same icon used inside the combat
modal for the FLEE button. Visually confusing — the player
could read it as "this step lets you flee combat" rather than
"this step starts combat". Mobile-only inconsistency.

**Fix proposal:** swap `'encounter' → 'sword'` (or a new
`'fight'` glyph kind if visual differentiation from the combat
SKILL action is needed). The combat tab's action picker uses
`'sword'` for ATTACK; reusing it on the exploration step-card
keeps the player's icon vocabulary consistent. Score `[3.5]`.

---

## 11. Drawer copy + legend chrome — MOBILE-ONLY

**UI:** `DRAWER_COPY`, `FALLBACK_VM.legend.left`. All
mobile-local display strings (ritual register + chrome).

**Verdict:** MOBILE-ONLY. No engine counterpart.

---

## 12. `buildEdges` traveled vs locked classification — ALIGNED

**UI:** `state/presenters/exploration.engine.ts:150-168`.
`traveled = both endpoints in completed`; `locked = either
endpoint in locked`.

**Engine:** N/A directly; the legacy `completedNodes` /
`lockedNodes` are mobile-managed (see row 1) but the
classification logic is internally consistent.

**Verdict:** ALIGNED (against its own internal state).

---

## Closing notes

- **Total decisions audited:** 12.
- **DRIFT:** 3 (rows 4, 7, 10). Rows 4 + 10 are MED/LOW; row
  7 is LOW.
- **MOBILE-ONLY by design:** 4 (rows 1, 5, 9, 11).
- **ALIGNED:** 5 (rows 2, 3, 6, 8, 12).

**Next iterate ticks** (if the user wants the fixes filed):

- `[3.5]` Swap `ACTION_ICON_BY_TYPE['encounter']` from
  `'flee'` to `'sword'` (row 10 — high-visibility chrome fix).
- `[3.0]` Add hermetic test pinning mobile `NodeType` ↔ engine
  event-pool registration (row 4).
- `[3.0]` Migrate presenter to engine `discoveredNodes` /
  `consumedNodes`; retire legacy reads (row 1).
- `[2.5]` Drop `(state as any).world` casts (row 7).

**Out of scope for this audit** (queued):
- Inventory surface — final audit in the series; runs next
  iterate per the oversight 27th directive.

**Verification approach:** code-read this tick. The
encounter-icon drift (row 10) is easily live-verified via the
playtest runbook — visible on every exploration screen with
encounter nodes (most maps).
