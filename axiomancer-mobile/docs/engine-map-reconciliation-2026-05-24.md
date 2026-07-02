# Engine MapDefinition reconciliation — fishing-village

> **RESOLVED 2026-06-20.** Option A/C was taken: the engine's
> `MapDefinition` is the sole source of truth for the node graph (ids +
> edges + unlock); the mobile fixtures supply only visual positions and
> copy. Both maps are now 25 nodes (`fv-1..fv-25`, `nf-1..nf-25`) and the
> id-sets match the engine exactly. The presenter
> (`state/presenters/exploration.engine.ts`) reads edges from
> `getMapDefinition().nodes[].connectedNodes`; the layout's old
> `connectedNodes`/`type` fields have been deleted as dead data. A new
> guard — `state/exploration-maps/__tests__/layout-engine-parity.test.ts`
> — fails CI if the layout id-set ever drifts from the engine's. The rest
> of this doc is retained as the historical decision record.

---

> Phase 81a Tick A artifact. Diffing mobile layout fixture vs
> engine source MapDefinition. Northern-forest is already in sync
> (same 10 nodes, same edges). Only fishing-village diverges.
>
> **Needs oversight direction call before Tick B.**

## Current state (three versions)

### 1. Published engine (0.11.0 dist) — 10 nodes, linear chain

```
fv-1 → fv-2 → fv-3 → fv-4 → fv-5 → fv-6 → fv-7 → fv-8 → fv-9 → fv-10
```

Strict linear chain. Every node connects to exactly one neighbor.

### 2. Engine source (unpublished) — 25 nodes, spine + 3 districts

Original spine preserved at y=0 with lateral branches into three
new districts (15 new nodes):

**Spine (fv-1..fv-10) — now with lateral exits:**

| Node  | Engine source edges               |
|-------|-----------------------------------|
| fv-1  | fv-2, **fv-11**                   |
| fv-2  | fv-3, **fv-12**                   |
| fv-3  | fv-4, **fv-13**, **fv-16**        |
| fv-4  | fv-5, **fv-17**                   |
| fv-5  | fv-6, **fv-18**                   |
| fv-6  | fv-7                              |
| fv-7  | fv-8, **fv-21**                   |
| fv-8  | fv-9, **fv-22**                   |
| fv-9  | fv-10                             |
| fv-10 | (terminal)                        |

**Harbor district (y=+1..+2):** fv-11..fv-15
- fv-11 ↔ fv-1, fv-12, fv-14
- fv-12 ↔ fv-2, fv-11, fv-13
- fv-13 ↔ fv-3, fv-12
- fv-14 ↔ fv-11, fv-15
- fv-15 ↔ fv-14 (dead-end)

**Inland streets (y=-1..-2):** fv-16..fv-20
- fv-16 ↔ fv-3, fv-17
- fv-17 ↔ fv-4, fv-16, fv-18, fv-19
- fv-18 ↔ fv-5, fv-17, fv-19
- fv-19 ↔ fv-17, fv-18, fv-20
- fv-20 ↔ fv-19 (dead-end)

**Cliff path (y=+1..+2 east):** fv-21..fv-25
- fv-21 ↔ fv-7, fv-22, fv-24
- fv-22 ↔ fv-8, fv-21, fv-23
- fv-23 ↔ fv-22, fv-24
- fv-24 ↔ fv-21, fv-23, fv-25
- fv-25 ↔ fv-24 (dead-end)

### 3. Mobile layout fixture — 10 nodes, independent branching

```
fv-1  → [fv-2]
fv-2  → [fv-3, fv-4]        ← cross-spine branch
fv-3  → [fv-5]              ← skips fv-4
fv-4  → [fv-5, fv-6]        ← cross-spine branch
fv-5  → [fv-8]              ← skips fv-6, fv-7
fv-6  → [fv-7]
fv-7  → [fv-9]              ← skips fv-8
fv-8  → [fv-10]
fv-9  → (terminal)
fv-10 → (terminal)
```

Authored for visual gameplay variety (forks at fv-2 and fv-4,
shortcut edges that skip intermediate nodes).

## Edge collisions (fv-1..fv-10 spine)

| Node | Mobile edges        | Engine source edges          | Conflict                                            |
|------|---------------------|------------------------------|-----------------------------------------------------|
| fv-1 | fv-2                | fv-2, fv-11                  | Engine adds fv-11                                   |
| fv-2 | **fv-3, fv-4**      | fv-3, fv-12                  | Mobile has fv-4 shortcut; engine has fv-12 lateral   |
| fv-3 | **fv-5**            | fv-4, fv-13, fv-16           | Mobile skips to fv-5; engine goes to fv-4 + laterals |
| fv-4 | **fv-5, fv-6**      | fv-5, fv-17                  | Mobile has fv-6 shortcut; engine has fv-17 lateral   |
| fv-5 | **fv-8**            | fv-6, fv-18                  | Mobile skips to fv-8; engine goes to fv-6 + lateral  |
| fv-6 | fv-7                | fv-7                         | Match                                               |
| fv-7 | **fv-9**            | fv-8, fv-21                  | Mobile skips to fv-9; engine goes to fv-8 + lateral  |
| fv-8 | **fv-10**           | fv-9, fv-22                  | Mobile skips to fv-10; engine goes to fv-9 + lateral |
| fv-9 | (terminal)          | fv-10                        | Mobile is terminal; engine continues                 |
| fv-10| (terminal)          | (terminal)                   | Match                                               |

**7 of 10 spine nodes have conflicting edges.** The mobile
fixture's branching was authored independently to create web-like
variety within 10 nodes. The engine source takes a different
approach — it keeps the spine linear and adds richness through
lateral districts (fv-11..fv-25).

## Missing from mobile fixture

15 nodes (fv-11..fv-25) exist in engine source but have no mobile
layout entry. They need:
- Visual positions (x, y) on the 360x400 viewBox
- Labels and thematic blurbs
- Node type classifications

## Direction call (for /oversight)

Two options for Tick B:

### Option A: Align mobile spine to engine source + add 15 new nodes

- Replace mobile fixture's cross-spine edges with engine's linear
  spine edges (fv-2→fv-3 only, fv-3→fv-4 only, etc.)
- Add 15 new NodeLayout entries for fv-11..fv-25 with authored
  positions, labels, types, and descriptions
- Gameplay graph CHANGES: player loses the web-like shortcuts
  (fv-2→fv-4, fv-5→fv-8, etc.) but gains 3 new exploration
  districts with dead-end destinations
- Ship OPEN-set migration (`availableNodes` → `discoveredNodes`)
  in the same tick since engine becomes authoritative

### Option B: Engine widens spine to match mobile + add 15 new nodes

- The engine source adds the mobile's cross-spine edges (fv-2→fv-4,
  fv-3→fv-5, etc.) on top of its existing connections
- Mobile fixture only adds the 15 new nodes (no spine changes)
- Gameplay preserves both the web-like shortcuts AND the new
  districts
- Requires an engine source edit + publish before mobile can migrate

### Option C: Drop cross-spine shortcuts, accept engine-linear spine

- Same as Option A but explicitly acknowledges the gameplay
  narrowing as a design choice ("the spine is a spine; districts
  are where the variety lives")
- Simplest mobile-side change

## Prerequisite for any option

The engine source changes at
`axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts`
must be built and published (version bump to 0.12.0 or similar)
before mobile can consume the 25-node graph. The current published
0.11.0 dist still has the 10-node linear chain.
