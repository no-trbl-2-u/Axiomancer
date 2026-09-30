# Revamp — content strip

> Part plan of [THE REVAMP](README.md). Phase **R7e** (loop). Decision
> **D72**. Added via an attended session with T, 2026-09-30.

## Why

T, 2026-09-30: the checkpoint (RC) is "engine and UI scaffolding. No cards
or relics yet (other than the starters), no real story implemented, no
content. Just a good starting point in case another revamp is due."

At `7ad16ee1` (R7b shipped), the only content left outside Act 1 is parked
content. It is compiled and tested but cannot be reached in play. R7e
deletes the part T ruled out and keeps the plumbing that part exercised.

## Rulings (D72)

| Surface | Ruling |
|---|---|
| Parked world: northern-forest and the northern continent (caverns, northern-city, connecting-river, town-across-river, the-capital) | **Delete the content, keep the plumbing** |
| The Labyrinth (engine, three acts, the mobile route, art) | **Stays parked, untouched** (as in [labyrinth.md](labyrinth.md)) |
| Relics | **The Suppliant's Ring only.** The other ten are deleted |
| Act 1 (four regions, 73 nodes, arrival cutscenes, node prose) | **Stays as it is**: it is the scaffold's test bed and RC's walk |

## R7e — Content strip (loop)

Requires R7d. B4 and R8 require R7e: B4 then inventories the stripped
tree, and R8 cleans the final set of mobile routes.

### Delete

1. **Parked maps.** Remove northern-forest and the five northern-continent maps
   from `map.registry.ts` / `map.library.ts`. Delete
   `Continents/Coastal-Village/maps.ts` (northern-forest),
   `Continents/Northern-Forest/npcs.ts`, and the parked maps in
   `Continents/Northern-Continent/maps.ts`. Keep `beacon-crags.ts` and
   `lantern-deep.ts`.
2. **Parked map events.** Remove the northern-forest and northern-continent
   blocks of `World/MapEvents/content.ts` (about lines 1–548 and 1168–2272 at
   `7ad16ee1`): their encounters, rests, caches, gathering, hazard nodes,
   cutscenes, travel doors, the 7 shops, and the 6 inline dialogue trees.
3. **NPCs and quests.** Delete all 13 parked NPC trees and all 9 quests in
   `quest.library.ts`. Delete the `QUEST_TITLES` entries in mobile
   `state/presenters/engine-id-copy.ts`.
4. **Parked enemy pools.** Remove the `EnemiesByMap` entries for the deleted maps
   (the Labyrinth's stay).
5. **Mobile.** Delete the parked `state/exploration-maps/*.layout.ts` files
   and the arena art that only those maps used. Remove the deleted maps'
   rows from `DebugWorldTravel`; the Labyrinth row stays.
6. **Relics.** Delete ten relics from `Items/relic.library.ts` and keep the
   Suppliant's Ring. Delete their GUARD 5 signature placeholders from
   `Combat/combat.signature.ts`; The Open Hand stays. Re-point every reader:
   `first-node-grant.ts` (including `STAND_IN_RELIC_ID`),
   `seedStartingRelics`, `cloneStartingRelics`, fixtures, sims, CLI flags
   and the dev item picker.

### Keep (plumbing), each witnessed by one minimal fixture

Every system below loses its last authored content in this phase. It stays
in the tree and stays tested by one **neutral test fixture**: a placeholder
NPC, shop or quest defined under `test-utils/` or `Game/fixtures/`. The
fixture is never registered in the live world, and its text is plain
placeholder copy, not story.

- **Dialogue:** `NPCs/` (tree walker and types), `dialogue.runtime.ts`, and
  the mobile `/dialogue` route. `Game/fixtures/state-fixture.registry.ts`
  currently stages the Shrine Keeper on nf-3; re-point it to the fixture NPC.
- **Shops:** `Items/shop.reducer.ts` / `shop.types.ts`, the `village`
  event kind, and the mobile `/village` route and presenter.
- **Quests:** `quest.engine.ts`, `quest-reward.ts`,
  `narrative-reachability.ts`, the `codex` slice, and the quest section of
  the mobile memoir tab.
- **Equipment slots:** equip and unequip across every slot, now tested
  with fixture relics.

### Save migration

- A save on a deleted map moves onto the Lantern Deep, reusing the R3a
  migration.
- A save holding a deleted relic drops it: the relic comes off its slot
  and out of the inventory.
- A save holding the Suppliant's Ring keeps it.
- A save with a quest or NPC flag for deleted content drops those keys.

### Tests

- Reachability stays pinned to Act 1.
- The fixture witnesses above pass.
- The mobile state fixtures for `/dialogue` and `/village` still render.
- `lint:content` and `check-lexicon` pass.
- Every Labyrinth test is unchanged and green.

### Split

If one tick cannot hold the phase, split it along the R2/R3 precedent:
**R7e-1** covers the world, NPCs, quests and mobile layouts; **R7e-2**
covers the relics.

## Not in R7e

- No new content, and no rewriting of Act 1 prose.
- The Labyrinth is left alone.
- Gathered materials that nothing consumes, and Act 1's gathering nodes,
  are an open call for T and stay as they are.
- The card-art map is R8's job.
- Stage profiles and sim policies belong to R7c's test-only sweep, or to
  B4's inventory.
