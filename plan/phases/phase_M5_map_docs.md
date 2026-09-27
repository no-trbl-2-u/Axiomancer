# Phase M5 — Map docs (D16, MapSheet)

> Row: `plan/steps/01_build_plan.md` → THE MAP REVAMP. Parent brief:
> `plan/2026-09-25-map-revamp-m3.prompt.md` §2 (M5).

## Outcome

`axiomancer-mechanics/docs/world.md` and `skills/forge.md` describe the maps
as they are after M3a–M4: frontier roaming (D1), the forward column skeleton
with lateral ribs (the layer law), the free per-map mobile layout on a
`MapSheet` (D15/D16), one node per plate landmark (D25), and the Act 1 chain
that a new game walks.

## Why

M3a–M4 re-authored the Act 1 maps and moved the new-game start to the
Breakwater (D27). The docs still describe the old maps. `world.md`'s
"Movement" section says moves are linear with no back-travel, which D1
repealed on 2026-09-21. Its "Map Registry" section is missing seven maps and
the Aporia. Its "Demo Content" section says fishing-village is the starting
map. `forge.md`'s Map checklist names a "column-layering law" that D1 relaxed
and says nothing about the sheet. The next `/forge` map tick would author
against rules that no longer hold.

## Scope

1. **`docs/world.md` → Map Registry.** All three continents and every map
   registered in `map.registry.ts`. `createMapState` and `createStartingWorld`
   (the `STARTING_MAP`, the catalogue, the uncatalogued Aporia). Adding a map
   means a registry entry, an authoring file, a mobile layout and a door.
2. **`docs/world.md` → Movement.** Replace "linear with completed-lock" with
   frontier roaming: the spent set, `frontierNodes`, blocked routes cut from
   the adjacency, `pendingArrival`, and the labyrinth exception. The legacy
   `availableNodes`/`lockedNodes` lists are kept in sync and are not the
   authority.
3. **`docs/world.md` → Map shape (new) and Demo Content (rewritten).** The
   engine graph is columns and lanes: every edge runs one column forward, or
   sideways between neighbouring lanes in a column; terminal nodes share the
   last column and have no edges (pinned in `map-traversal.engine.test.ts`).
   The mobile layout's `x`/`y` on a `MapSheet` is free of the column order
   (D16). Document the `MapSheet` fields, `ACT1_SHEET_SIZE` and
   `legacySheet`. "Demo Content" becomes "Campaign maps": the door chain from
   the Breakwater to the capital, the Act 1 rules (one elite per map and no
   boss, D30; arrival cutscene, D31) and the Lantern Deep's Labyrinth door
   (D24). The historical fishing-village node tables go.
4. **Small accuracy fixes in the same file.** The status header, the kind
   count (twelve, with `labyrinth`) and the `WorldState` shape
   (`mapStates`).
5. **`skills/forge.md` Map checklist.** Replace "obeying the column-layering
   law" with the layer law plus D16's free layout on a `MapSheet`, one node
   per landmark when the plate has landmarks (D25), and the traversal pins.

## Tests

Docs only. `npm run verify` stays green (the lexicon and doc-link lints run
in it).

## Out of scope

- Any code change.
- Retiring `legacySheet` for the seven pre-revamp maps (D21's re-slot).
- Rewriting `docs/world.md`'s MapEvents, Quest, Dialogue and minigame
  sections beyond the kind count.
