# Spec 08 — World Content, Exploration & Hazards

> [DONE on 2026-05-13 — acceptance complete; canonical API: `docs/world.md`]

## Goal

Make the world reducer the engine of an actual exploration loop: track which
node the player is on, process node events (encounter / treasure / shop /
quest / NPC), tick persistent effects on movement, and handle quest progress.

**Success state:** From a `GameState`, `processNode(gameState)` returns a
`ProcessNodeResult` (updated `gameState`, `ProcessedEvent`, messages, quest
side-effects). `moveToNode` / `completeCurrentNode` on `WorldState` validate
movement (linear graph, no back-travel into completed nodes). Hazard ticking
pairs with movement via `processWorldEffectTick`. A small demo map chain
exercises the loop end-to-end.

## Why now / dependencies

- **Unblocks:** Spec 09 (top-level orchestrator), real Phase 9 content work.
- **Depends on:** Spec 01 (`processWorldEffectTick`), Spec 07 (encounter
  generator), Spec 04 (NPC-given skills).

## Current state

- **Implemented:** `MapDefinition` / `MapState` split, continent-keyed
  `MAP_REGISTRY`, `moveToNode` + `IllegalMoveError`, `completeCurrentNode`,
  `processNode(gameState)`, `processWorldEffectTick`, `getActiveHazards`,
  per-objective `Quest` / `QuestLog`, branching NPC dialogue
  (`DialogueTree`, `applyDialogueChoice`), demo coastal map content. See
  `docs/world.md` and `src/World/spec08.test.ts` / `src/Game/spec08.e2e.test.ts`.
- **Still legacy on the reducer:** `changeMap`, `completeMap`, `unlockMap`,
  `completeNode`, `unlockNode`, `changeContinent`, `completeUniqueEvent` —
  retained for compatibility; the Spec 08 path is registry + `MapState`.
- **Not in this spec:** a dedicated “story choice node” on `MapEvent` with
  generic `choices[]` / `resolveEvent`. `MapEvent.type === 'event'` is the
  **rest** path (instant heal + narration). Multi-step narrative today is
  **NPC dialogue**, not a free-standing `EventChoice` list on map nodes.
- **`createGameStore`:** still combat / inventory / persistence — it does
  **not** yet wrap `moveToNode` / `processNode` (that orchestration is Spec 09).

## Open questions

1. **Player position.** Add `currentNode: NodeId` to `WorldMap` (per-map
   position) or `currentNode: NodeId` to `WorldState` (one global position)?
   Reasoning: per-map position remembers progress across map switches.
   > Your answer: per map position

2. **Movement model.** Branch via `connectedNodes`:
   - (A) Free movement — any connected node.
   - (B) Linear — each node has a single "next" node, plus optional
     side-paths.
   - (C) Hex/grid — `MapNode.location` is a coordinate; movement is
     directional.
   > Your answer: B (but lock completed nodes so no back travel)

3. **What counts as a "step" for hazard ticks?** Each `moveToNode` call,
   or each map node *transition that crosses a tile* (not idle ticks)? Or
   real-time?
   > Your answer: Each moveToNode call

4. **Active effects in the exploration HUD.** The roadmap notes "Active
   hazard effects shown on the exploration HUD." Engine just exposes the
   data; the UI renders. What does the engine need beyond
   `player.effects` for the UI to present this? E.g. a derived
   `getActiveHazards(player)` helper?
   > Your answer: Yes

5. **Map vs MapState.** Knowledge-Gap 22: split static `MapDefinition` from
   runtime `MapState` so the JSON catalogue is separate from save data?
   - (A) Yes — refactor `WorldMap` into `MapDefinition` (template) +
     `MapState` (per-save progress).
   - (B) No — keep `WorldMap` as the merged object.
   > Your answer: A

6. **Map registry.** Replace `getCoastalMap` with a continent-keyed
   registry so adding a continent doesn't touch existing files? Suggested
   shape: `MAP_REGISTRY: Record<ContinentName, Partial<Record<MapName, MapDefinition>>>` (implemented).
   > Your answer: yes

7. **Quest engine scope.** Minimum viable:
   - (A) Quest state on `GameState.activeQuests: QuestName[]`,
     completion via explicit `completeQuest` reducer.
   - (B) Track per-quest objectives (kill X, find Y) — bigger scope.
   > Your answer:B

8. **Shop economics.** Currency exists conceptually; nothing tracks it.
   Add `Character.currency: number` and shop reducers?
   > Your answer: Just add the currency number. Shop to come in future spec

9. **NPC dialogue depth.** Plain `DialogueMap` (string keyed) or branching
   tree? Branching adds complexity but enables moral choices (Spec 10).
   > Your answer: Branching tree

10. **Rest & recovery.** Roadmap mentions rest. Where?
    - (A) On specific node types (`type: 'event'`, narrated as resting).
    - (B) Anywhere — ability to "wait" on a node.
    - (C) Tied to NPCs / shops (inn).
    > Your answer: A

## Proposed approach

1. **`moveToNode(state, nodeId): WorldState`** — sets the new node, validates
   adjacency per Q2.
2. **Map definition vs state** per Q5.
3. **Map registry refactor** per Q6.
4. **`processNode(gameState): ProcessNodeResult`** — dispatches by event
   type; encounters return an `Encounter` for the caller to pass to
   `startCombat`; quests / NPCs / shops return structured payloads (see
   `docs/world.md`).
5. **`processWorldEffectTick(player)`** per Q3 — DoT / regen / expiry.
   Paired with each `moveToNode` at the **orchestrator** layer (Spec 09),
   not inside the pure `moveToNode` reducer. Lives under `Effects/`.
6. **`getActiveHazards(player)`** if Q4 wants it.
7. **Quest engine** scoped to Q7.
8. **Shop reducers** if Q8 says yes.
9. **Branching dialogue** if Q9 says yes (otherwise keep `DialogueMap`).
10. **Rest mechanics** per Q10.
11. **Sample content** — flesh out 1 map node chain so the demo is real:
    1 NPC, 1 shop, 1 quest, 1 boss.

## Acceptance checklist

- [x] All 10 questions answered.
- [x] `moveToNode` exists and is exercised by a test.
- [x] `processNode` dispatches encounter/event/treasure/shop/npc/quest paths.
- [x] Hazard tick fires when the player moves between nodes (verified with
      a test that applies poison and walks two steps).
- [x] One end-to-end CLI flow: enter map → traverse 3 nodes (one
      encounter, one treasure, one boss) → quest completes → XP + loot
      granted.
- [x] `docs/world.md` updated with the final API.

## Out of scope

- Full continent worth of content — content authoring is a separate effort.
- Procedural map generation.
- Time-of-day or weather systems.
