# Phase — Inter-map travel: the doors open (2026-08-28)

## Outcome

The game has inter-map travel. A new `travel` MapEventKind walks the
player through authored doors: fishing-village `fv-10` → northern-forest,
northern-forest `nf-10` (the cave mouth) → **the caverns**, a fully
authored 25-node first map of the northern continent (`nc-` prefix,
gauntlet, column-layered). `createStartingWorld` populates a real
two-continent catalogue; `changeContinent` is no longer a no-op;
`get-to-forest` and `get-to-cave` complete in live play;
`GAME_STATE_VERSION` 20 → 21 seeds the catalogue onto old saves.

## Design calls (decided in this phase)

1. **Preserve, don't reset — `completedMaps` semantics win.** The world
   is a PLACE the player moves around in. Departing a map through a door
   preserves its runtime `MapState` under the new optional
   `WorldState.mapStates` record and marks the map in `completedMaps`
   ("walked through", never "reset"). A door that later leads back
   restores the preserved state instead of `createMapState`-fresh.
2. **Doors resolve on arrival and are never consumed.** One-way per door
   but repeatable: the dispatcher skips the consume/reveal step for
   `travel` (consuming would also scribble the departed node's id onto
   the destination map's books). Re-resolving the node travels again.
3. **Door placement.** Both doors sit in their map's terminal column:
   `fv-10` (the spine's "coast road out", four columns past the fv-6
   King of Revenge — matching Old Marrow's post-boss `get-to-forest`
   grant) displaced the barnacle hazard; `nf-10` (the cave mouth the
   `get-to-cave` quest already reached for) displaced its cutscene,
   whose prose survives as the door's description.
4. **Caverns end-of-map: boss node, not a sealed travel stub.** A travel
   event fires the moment the node resolves, so a "sealed door" travel
   node toward the unshipped `northern-city` would either throw or
   travel. The map instead ends at a singleton terminal boss column
   (`nc-25`, the Under-Gate — `rawhead-rex` pinned to L6, the fv-6
   precedent) with the sealed stair authored as scenery (`nc-16`,
   cutscene) beside the last camp.
5. **Caverns shape.** Ten columns, three lanes (SEAM/GALLERY/SUMP) plus
   one hang-off node (`nc-24`, [3,-2], fv-12/13 pattern). Three
   singleton columns — arrival, the Delver (`nc-2`, quest-giver
   guaranteed on every route, the fv-2/Old Marrow precedent), and the
   boss. `gather-iron` (a previously dangling `CavernsQuests` union
   name) is authored: collect 2 `iron-ore`, granted by The Delver, the
   map's one staged NPC. `get-to-northern-city` stays dangling — its
   target map is not shipped. Enemy pool reuses the existing roster
   skewed to the harder forest tier; no new enemies.
6. **Catalogue sync.** `completeMap` / `unlockMap` / `changeContinent`
   now write through to the `world` array so catalogue and
   `currentContinent` cannot drift. The labyrinth-continent stays
   deliberately uncatalogued (dev-menu + CLI only, W-01).

## Follow-ups (not this phase)

- Mobile travel-event presenter/route/UI (door confirmation, crossing
  screen); engine + layout data only shipped here. `travel` currently
  falls to the empty VM defensively in `event.engine.ts`.
- A bespoke door glyph on the exploration map (`travel` borrows the
  narrative icon).
- Homing Forest Ranger / Lost Trader — northern-forest is reachable now,
  their unstaged reasons were rewritten to say so.
- `northern-city` and the stair unseal; a return-door policy if any map
  ever links backward (the engine already restores preserved states).
