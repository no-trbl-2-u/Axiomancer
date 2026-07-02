# Phase 135 — Hazard Minigame — Persistent World-State Tracking

## Outcome

Extend WorldState and MapState to track persistent hazard outcomes, enabling the three flagged hazard cards (H08, H12, H15) to apply lasting map modifications that affect future hazard encounters and route availability — replacing one-time reward placeholders with genuine world-state persistence.

## Source spec

CDR-0006 doctrine (hazard minigame v0) + docs/hazard-minigame.md sections on persistent map benefits. Implementation target: H08 "Poisoned Spring" (next Supply hazard -2 thresholds), H12 "Riddled Bridge" (auto-succeed Stability ≤6 + route blocking on final round failure), H15 "Dark Narrows" (hazard removal for future passes). Remove ⚑ deferral notes from docs/hazard-minigame.md upon completion.

## Implementation units

### Unit 1 — WorldState persistence extensions
- **Files**: `src/World/types.ts`, `src/World/world.reducer.ts`
- **Types**: Extend existing types with hazard outcome tracking:
  ```ts
  interface HazardNodeOutcome {
    nodeId: NodeId;
    hazardId: string;
    outcome: 'cleared' | 'blocked' | 'modified';
    appliedDate: string; // ISO timestamp
    modifierEffects?: HazardModifierEntry[];
  }

  interface HazardModifierEntry {
    hazardType: 'supply' | 'stability' | 'escape' | 'force';
    thresholdAdjustment: number; // negative = easier, positive = harder
    description: string;
  }

  // Extend MapState
  interface MapState {
    // ... existing fields
    hazardOutcomes: HazardNodeOutcome[];
    blockedRoutes: Array<{ from: NodeId; to: NodeId; reason: string }>;
  }
  ```
- **Logic**: State initialization in `createMapState()`, outcome recording functions, route validation updates
- **Pattern**: New reducer actions `RECORD_HAZARD_OUTCOME`, `BLOCK_MAP_ROUTE`, state queries `getHazardOutcomesForNode()`, `isRouteBlocked()`

### Unit 2 — HazardModifierTable system
- **Files**: `src/World/Hazard/hazard.modifiers.ts`, `src/World/Hazard/hazard.engine.ts` (integration)
- **Types**: Threshold adjustment engine:
  ```ts
  interface HazardModifierTable {
    nodeId: NodeId;
    modifiers: HazardModifierEntry[];
  }

  function applyHazardModifiers(
    hazardCard: HazardCard, 
    mapState: MapState, 
    currentNode: NodeId
  ): HazardCard;

  function buildModifierTable(mapState: MapState, nodeId: NodeId): HazardModifierTable;
  ```
- **Logic**: Scan `mapState.hazardOutcomes` for applicable modifiers, compute threshold adjustments, create modified hazard card copies
- **Pattern**: Pure functions, immutable hazard card modification, modifier stacking (multiple effects can compound)

### Unit 3 — Route blocking dispatcher integration
- **Files**: `src/World/world.reducer.ts` (moveToNode function), `src/World/map.dispatcher.ts` (if exists) or create new file
- **Types**: Route validation with blocking state:
  ```ts
  interface RouteValidationResult {
    valid: boolean;
    blockedReason?: string;
    alternativePaths?: NodeId[][];
  }

  function validateMoveToNode(
    mapState: MapState, 
    fromNode: NodeId, 
    toNode: NodeId
  ): RouteValidationResult;
  ```
- **Logic**: Check `mapState.blockedRoutes` before allowing movement, provide alternative path suggestions where possible
- **Pattern**: Integration with existing `moveToNode()` validation, graceful failures with user feedback

### Unit 4 — Hazard card persistence wiring
- **Files**: `src/World/Hazard/hazard.hazards.library.ts`, `src/World/Hazard/hazard.engine.ts`
- **Types**: Update the three flagged hazard cards with persistence effects:
  ```ts
  // H08 - Poisoned Spring bottom route success
  function purifySpringEffect(mapState: MapState, nodeId: NodeId): MapState;
  
  // H12 - Riddled Bridge outcomes
  function bridgeRepairEffect(mapState: MapState, nodeId: NodeId): MapState;
  function bridgeCollapseEffect(mapState: MapState, nodeId: NodeId): MapState;
  
  // H15 - Dark Narrows bottom route success
  function clearNarrowsEffect(mapState: MapState, nodeId: NodeId): MapState;
  ```
- **Logic**: Wire hazard resolution to emit world-state persistence calls, replace placeholder VITAE/item grants with actual persistence
- **Pattern**: Hazard completion callbacks invoke world-state mutations through game store dispatch

### Unit 5 — Documentation cleanup and hermetic e2e coverage
- **Files**: `src/World/Hazard/e2e/hazard.persistence.engine.test.ts`, `docs/hazard-minigame.md`
- **Types**: Comprehensive e2e test scenarios:
  ```ts
  describe('Hazard World-State Persistence', () => {
    test('H08 bottom route success modifies future supply hazards')
    test('H12 bridge repair enables auto-success for low stability checks')
    test('H12 bridge collapse blocks route and forces alternate path')
    test('H15 bottom route success permanently removes hazard')
    test('modifier stacking: multiple supply benefits compound correctly')
    test('route blocking: moveToNode rejects blocked paths')
    test('alternative path computation: suggests valid routes around blocked areas')
  })
  ```
- **Logic**: End-to-end testing with stubbed RNG covering persistence lifecycle, documentation update removing all ⚑ deferral markers
- **Pattern**: Multi-round test scenarios simulating hazard completion → persistence → future encounter modification

## Decisions made upfront — DO NOT ASK

- **D1 — Storage location.** Hazard outcomes stored directly on `MapState.hazardOutcomes` array, not separate global persistence layer. Keeps state co-located with map progress.
- **D2 — Modifier stacking.** Multiple modifiers of the same type stack additively (e.g., two -2 supply modifiers = -4 total adjustment). No diminishing returns or caps in v0.
- **D3 — Route blocking granularity.** Blocked routes are bidirectional `{from, to}` pairs. Blocking A→B also blocks B→A unless explicitly stated otherwise in hazard card text.
- **D4 — Persistence scope.** Hazard outcomes persist for the current map only. Switching maps does not carry modifiers across continents (may change in future phases).
- **D5 — Alternative path algorithm.** Simple breadth-first search for alternate routes around blocked connections. No complex pathfinding or cost optimization.
- **D6 — Migration strategy.** No GameState version bump required — new fields are optional/default-empty arrays. Existing saves continue working without modification.
- **D7 — Performance constraints.** Linear scan of `hazardOutcomes` array acceptable for expected map sizes (≤50 nodes). No indexing or optimization until proven necessary.
- **D8 — Effect duration.** All persistence effects are permanent within the map scope. No time-based expiration or conditional removal mechanics.

## Verify gate

- `npm run type-check` clean
- `npm test -- --run` with ≥7 new hermetic e2e test scenarios covering persistence lifecycle
- `npm run build` clean
- `npm run deploy:check` clean
- Manual verification: All ⚑ deferral notes removed from `docs/hazard-minigame.md`

## Commit body template

```
feat(world): Phase 135 — Hazard minigame persistent world-state tracking

- Extend WorldState/MapState for hazard outcome persistence per CDR-0006 doctrine
- Add per-node outcome flags (cleared, blocked, modified) with timestamp tracking
- Implement HazardModifierTable for adjusting threshold values on future encounters
- Add route-blocking state integration with map dispatcher validation
- Wire H08/H12/H15 hazard cards to emit and consume persistent state flags
- Replace placeholder VITAE/item grants with genuine world-state modifications
- Remove ⚑ deferral notes from docs/hazard-minigame.md

Technical implementation:
- MapState.hazardOutcomes array tracks per-node modifications
- HazardModifierTable computes threshold adjustments from outcome history
- Route blocking via MapState.blockedRoutes with moveToNode validation
- Alternative path suggestions through breadth-first search algorithm
- Hermetic e2e coverage for persistence lifecycle and modifier stacking
- No GameState version bump required (additive optional fields)
```

## Definition of Done

- [ ] MapState extended with `hazardOutcomes: HazardNodeOutcome[]` and `blockedRoutes` arrays
- [ ] HazardModifierTable system implemented with threshold adjustment engine
- [ ] Route blocking integrated with `moveToNode()` validation and alternative path computation
- [ ] H08 "Poisoned Spring" wired to modify future supply hazard thresholds by -2
- [ ] H12 "Riddled Bridge" wired for auto-success on stability ≤6 and route blocking on failure
- [ ] H15 "Dark Narrows" wired to permanently remove hazard for future passes
- [ ] Placeholder VITAE/item grants replaced with actual persistence effects
- [ ] Hermetic e2e coverage for ≥7 persistence scenarios (outcome recording, modifier application, route blocking, alternative paths)
- [ ] All ⚑ deferral notes removed from `docs/hazard-minigame.md`
- [ ] Verify gate checks pass (type-check, test, build, deploy)
- [ ] No breaking changes to existing hazard minigame API surface

## Follow-ups (out of scope)

- **Cross-map persistence** — Modifiers that carry across continent boundaries
- **Temporal effects** — Time-based expiration of persistence effects
- **Complex pathfinding** — Weighted routing algorithms for optimal alternative paths
- **Performance optimization** — Indexing and caching for large map hazard outcome histories
- **Persistence UI** — Visual indicators in mobile showing active world-state modifications
- **Modifier caps** — Diminishing returns or maximum threshold adjustment limits
- **Persistence rollback** — Mechanics for undoing or reversing world-state modifications