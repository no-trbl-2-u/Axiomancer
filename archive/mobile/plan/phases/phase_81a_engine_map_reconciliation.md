# Phase 81a — Engine MapDefinition reconciliation

> **Phase family**: 81a → 81c  
> **Resolves**: AUDIT `[4.0]` + `[3.0]` `[needs-engine-release]` rows  
> **Direction**: Option A (align mobile spine to engine source)

## Outcome

Aligns mobile's fishing-village layout with engine source's 25-node branching graph, resolving the data source divergence that blocks Phase 27 OPEN-set migration.

## Context

**Problem**: Three-way conflict between data sources:
- **Engine source** (unpublished): 25-node branching graph with 3 districts
- **Published engine** (0.11.0): 10-node linear chain  
- **Mobile fixture**: 10-node graph with custom cross-spine shortcuts

**Reconciliation doc**: `docs/engine-map-reconciliation-2026-05-24.md` (commit `040a7f2`) documents the conflict and maps exact edge differences.

## Routes / API endpoints / CLI surface

**Files modified**:
- `src/game/layouts/fishing-village.layout.ts` — core data structure
- `src/components/map/MapGraph.tsx` — rendering component (if affected)
- `src/components/map/__tests__/MapGraph.test.ts` — unit tests
- `__tests__/e2e/map-graph.spec.ts` — e2e validation

## Content / data reads

**Current**: 10-node linear with custom branching  
**Target**: 25-node structure from engine source with:
- Linear spine: fv-1 → fv-2 → ... → fv-10 (preserved)
- Harbor district: 5 nodes branching from fv-3, fv-7
- Inland district: 5 nodes branching from fv-5, fv-9  
- Cliff district: 5 nodes branching from fv-8, fv-10

**Helper**: No new helpers needed — direct layout data replacement.

## Components / handlers

**Reused**:
- `MapGraph.tsx` rendering (if compatible with 25 nodes)
- Existing node type rendering components

**Modified**:
- Update `fishing-village.layout.ts` data structure
- Coordinate recalculation for visual positioning

## Cross-links

**In (verify)**: Map rendering displays all 25 nodes correctly  
**Out (ship)**: Map graph navigation works with new branching structure  
**Retro-fit**: None required — internal data structure change

## SEO / metadata / output schema

**N/A**: Internal layout data, no user-facing metadata impact.

## Hero / body / sub-section composition

**Map visualization**: 25-node graph within existing 360x400 viewBox  
**Layout strategy**: Preserve linear spine positioning, add lateral districts  
**Visual density**: Distribute 15 new nodes without overcrowding

## Empty / loading / error states

**Preserved**: Existing map loading and error states unchanged  
**Node unavailable**: Standard disabled styling for unreachable nodes

## Decisions made upfront — DO NOT ASK

1. **Data source authority**: Engine source is canonical — mobile follows completely
2. **Visual shortcuts**: REMOVE fv-2→fv-4, fv-5→fv-8 mobile-specific edges  
3. **Coordinate strategy**: Maintain spine Y-axis progression, add lateral X-offsets for districts
4. **Node IDs**: Use exact engine source IDs (fv-11 through fv-25)
5. **Connection structure**: Implement engine's exact adjacency list without modification
6. **Backward compatibility**: Not required — this is a breaking layout change
7. **District theming**: Use existing node types; no new visual categories needed

## Mobile reflow / responsive / paginate / output limits

**Viewport constraint**: 360x400 viewBox accommodates 25 nodes via:
- Spine nodes: vertical progression as before
- District nodes: clustered laterally at -80px, +80px X-offsets
- Zoom/pan: Available if overcrowding detected

## Pages × tests matrix

| Test | Scope |
|------|-------|
| `fishing-village.layout.test.ts` | Data structure validation, 25 nodes present, connections correct |
| `MapGraph.test.tsx` | Rendering 25 nodes, proper positioning |
| `map-graph.spec.ts` | E2E navigation through new districts |

## Verify gate

1. **Typecheck**: `pnpm typecheck` — layout matches engine interface
2. **Unit tests**: All layout/component tests pass
3. **E2E**: Map graph loads and displays 25 nodes correctly
4. **Build**: `pnpm build` succeeds

## Commit body template

```
feat: align fishing-village layout with engine 25-node graph — phase 81a

- Replace 10-node linear with 25-node branching structure
- Add harbor, inland, cliff districts (fv-11..fv-25)
- Remove mobile-specific cross-spine shortcuts
- Preserve spine progression fv-1→fv-10

Decisions:
- Engine source authority: mobile follows exact adjacency list
- Visual shortcuts removed: fv-2→fv-4, fv-5→fv-8 edges
- Districts positioned laterally at ±80px X-offset

Resolves AUDIT [4.0] + [3.0] engine alignment blockers.

Closes #<issue-number>
```

## DoD

- [ ] `fishing-village.layout.ts` contains all 25 nodes with correct connections
- [ ] Map graph renders without visual overcrowding
- [ ] All unit tests pass
- [ ] E2E test validates navigation through new districts  
- [ ] No typecheck failures
- [ ] Build succeeds

## Follow-ups (out of scope)

- **Phase 81b**: Engine 0.12.0 publish coordination  
- **Phase 81c**: Full engine-mobile integration verification
- **Future**: Performance optimization if 25-node rendering impacts mobile performance