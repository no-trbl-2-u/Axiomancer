# Spec 07 — Exploration Screen Wiring

[DONE on 2026-05-13 — see commit 06fc907]

## Goal

Replace `app/(tabs)/exploration.tsx`'s hard-coded node graph with
engine-driven `WorldState` data via `selectExplorationViewModel`.
Tapping a reachable node calls the engine's `moveTo` reducer.

**Success state:** The map renders from `state.world.currentMap`.
Node states (current / available / locked / completed) reflect the
engine. Continent / map transitions are dispatched through actions.

## Why now / dependencies

- **Unblocks:** Spec 08 (events fire on node entry; needs map
  navigation to be real first).
- **Depends on:** Spec 01, 02, 03. Engine exposes
  `createStartingWorld`, `world reducer`, `WorldMap` (per the README's
  `World` group).

## Current state

- `app/(tabs)/exploration.tsx` exists with a literal node graph and
  hard-coded layout.
- The engine ships `World/`, `createStartingWorld`, world reducer,
  map / quest libraries.

## Open questions

1. **Node positions.** Engine map nodes have logical IDs but no
   pixel positions. Where do positions live?
   - (A) **(default)** In a per-map fixture in this repo
     (`app/(tabs)/exploration/maps/<map-id>.layout.ts`) keyed by node
     id.
   - (B) Add `position: { x, y }` to the engine's `WorldMap`.
   - (C) Auto-layout (force-directed) at runtime.
   > Your answer: A

2. **Interactive zoom / pan.** Mock map is static. Add:
   - (A) **(default)** No — single-screen tap-to-move.
   - (B) Pinch-to-zoom + pan via `react-native-gesture-handler`.
   > Your answer: B

3. **Node icons.** Map nodes have types (battle / shop / event / boss).
   Icon source:
   - (A) **(default)** Local `NodeMark` component with `kind` prop
     mapped from engine node type.
   - (B) Engine carries an `iconKey: string`; mobile resolves it.
   > Your answer: A

4. **Map travel time / fast travel.** Out of scope or in?
   > Your answer: Out of scope

5. **Locked / hazard tooltips.** Tapping a locked node should:
   - (A) **(default)** Show why it's locked (missing key, level
     requirement).
   - (B) Do nothing.
   > Your answer: Do nothing. Locked nodes should be a less saturated shade so as to denote it's locked status

6. **Node options** should be shown underneath. Available nodes to select are another way the user can select their next step and also contains a brief thematic explanation of the decision/node.

## Proposed approach

1. **Move `exploration.tsx` into a folder** — `app/(tabs)/exploration/index.tsx`
   plus `exploration.engine.ts`, `e2e/exploration.engine.test.ts`,
   `maps/<map-id>.layout.ts`.
2. **Implement `selectExplorationViewModel`** consuming `state.world`.
3. **Action layer** — `worldActions.moveTo(nodeId)`,
   `worldActions.changeMap(mapId)`.
4. **Refactor the screen.**
5. **Hermetic e2e**:
   - Happy path: starting map → tap an available node → state.world
     updates → presenter reflects new `currentNode`.
   - Locked node: cannot move; presenter exposes `locked: true`.
   - Map transition: completing a continent edge → `currentMap`
     changes; new layout fixture loads.
   - Lifecycle: navigate two nodes; assert engine log entries.

## Acceptance checklist

- [ ] All 5 questions answered.
- [ ] `app/(tabs)/exploration/` folder exists with layout fixtures.
- [ ] No literal node graph in the screen.
- [ ] Hermetic e2e green.
- [ ] `npm test` and `npx tsc --noEmit` clean.

## Out of scope

- Triggering encounters on node entry — Spec 08.
- World generation / random maps — engine Spec 08.
