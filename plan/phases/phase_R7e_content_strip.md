# Phase R7e — Content strip

## Sources

- Part plan: [`plan/revamp/content-strip.md`](../revamp/content-strip.md)
  (Delete, Keep, Save migration, Tests, Split).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D72** (the checkpoint is scaffolding; strip the parked
  content, keep the plumbing), **D53** (the world is Act 1; the northern
  maps parked in R3a), **D54** (the Labyrinth stays parked), **D50** (delete;
  git history is the archive), **D45** (carrier rule), **D58** (nothing is
  authored), **D62** (the dev menu changes only where a deletion forces it).
- Siblings: phase R3a (`v27 → v28`, the move onto the Lantern Deep) and R3b
  (`v28 → v29`, fishing-village purged from the catalogue, `mapStates` and
  the quest log) for the world strip and its migration.

## Outcome

No parked northern map, map event, NPC tree or quest is left in the tree.
Dialogue, shops and the quest engine still run, each witnessed by a neutral
test fixture that the live world never registers. Act 1 and the Labyrinth
are unchanged.

## Split (the part plan's own split, taken up front)

The surface is about 70 files across both workspaces (six maps, about 1,700
lines of map events, 13 NPC trees, 9 quests, six mobile layouts, their
arena art and the state fixtures that stood on them). The relic strip
touches a disjoint set of readers (first-node grant, starting relics,
signatures, sims, CLI flags, item picker). One tick cannot hold both:

- **R7e — the world**: maps, map events, NPCs, quests, enemy pools, mobile
  layouts and art, the fixture witnesses, the save migration for maps and
  quests.
- **R7e2 — the relics**: ten relics and their GUARD 5 signature
  placeholders go, the Suppliant's Ring stays; every reader re-pointed; the
  save drops the deleted relics. Requires R7e. B4 and R8 then require R7e2.

## Scope — R7e

1. **Maps.** `northern-forest`, `caverns`, `northern-city`,
   `connecting-river`, `town-across-river` and `the-capital` leave
   `map.registry.ts`, the `MapName` unions in `map.library.ts` and
   `Coastal-Village/maps.ts` (the file goes; `CoastalContinentMapNames` moves
   beside `breakwater.ts`), `Northern-Continent/maps.ts` (goes),
   `Northern-Forest/npcs.ts` (goes) and `encounter.ts`'s node-prefix table.
   The `ContinentName` union stays: `northern-continent` still holds the
   Beacon Crags and the Lantern Deep.
2. **Map events.** The northern-forest block and the northern-continent
   block of `World/MapEvents/content.ts` go (encounters, rests, caches,
   gathering, hazards, cutscenes, travel doors, the 7 shops, the 6 inline
   dialogue trees), with their registration in `registerMapEventContent`.
3. **NPCs and quests.** All 13 NPC trees and all 9 quest objects go.
   `QuestName` becomes `string`: no quest is authored, and the engine's
   name-keyed lookups need a name type that a fixture can fill.
   `QUEST_TITLES` in mobile `engine-id-copy.ts` goes.
4. **Enemy pools.** The six `EnemiesByMap` rows go; the Sandbag fixture
   re-points its `mapName` to `breakwater` (it is never drawn).
5. **Mobile.** The six parked `state/exploration-maps/*.layout.ts` files,
   their index rows, the arena art only they used (with `provenance.json` /
   `art-sources.json` rows), the deleted maps' `DebugWorldTravel` rows, the
   `DebugQuestState` quest rows, and the northern-forest `rich` cache tier
   branch.
6. **State fixtures.** `apprentice-nf-interaction`, `wanderer-nf-village`
   and `wanderer-nf-cutscene` re-point to Act 1 nodes with a new optional
   `StateFixture.stagedEvent` (see Decisions); `l30-caverns-hazard` and
   `l30-caverns-hazard-arrive` move to the Breakwater's first hazard node
   (`bw-3`). New ids: `apprentice-staged-dialogue`, `wanderer-staged-village`,
   `wanderer-staged-cutscene`, `l30-bw-hazard`, `l30-bw-hazard-arrive`; every
   script, doc and skill that names the old ids follows.
7. **Scripts and playtest.** The northern-forest mid-game playtest scenario
   and its probe go; the CLI route audit, catalog and capture scripts lose
   their parked-map rows.

### As shipped (R7e, 2026-10-01)

- **Engine**: the six maps, their event blocks (about 1,580 lines of
  `content.ts`), 13 NPC trees, 9 quests and six enemy-pool rows are gone.
  Lantern Deep's four shared builders moved into the Act 1 shared builders
  under neutral names (`ironVeinPool`, `campRestPool`, `damageHazardPool`,
  `currencyLootPool`). `auditRouteCoverage` went: its only callers were the
  parked maps' route-coverage tests.
- **Fixtures**: `Game/fixtures/fixture-content.ts` holds `FIXTURE_NPC`,
  `FIXTURE_SHOP`, `FIXTURE_QUEST` and three staged payloads;
  `resolveMapEvent(state, rng, staged?)` and mobile's
  `resolveCurrentMapEvent(sourceNodeType, staged?)` resolve them.
  `applyDialogueChoice`'s `startQuest` also finds a quest already offered
  in the log, since no map carries quests.
- **Mobile**: six layouts, the five parked arena plates (with provenance,
  art-sources and art-catalogue rows), the `QUEST_TITLES` entries and the
  northern-forest `rich` cache branch. The `rich` tier stays: the dev
  rewards menu still rolls it (D62). The map plates stay: the screen
  backgrounds use them.
- **Save v34**: the brief's hop, as written.

## Keep (plumbing), each witnessed by one neutral fixture

- **Dialogue**: `NPCs/` (tree walker, types), `dialogue.runtime.ts`, the
  `interaction` and `narration` kinds, the mobile `/dialogue` route. Witness:
  `FIXTURE_NPC` (a two-node placeholder tree) in `Game/fixtures/`.
- **Shops**: `Items/shop.reducer.ts`, `shop.types.ts`, the `village` kind,
  the mobile `/village` route. Witness: `FIXTURE_SHOP` (sells the healing
  potion) in `Game/fixtures/`.
- **Quests**: `quest.engine.ts`, `narrative-reachability.ts`, the `codex`
  slice, the memoir quest section. Witness: `FIXTURE_QUEST` (one `reach`
  objective on an Act 1 node).
- **Equipment slots**: untouched here (R7e2).

## Save / schema contracts

`GAME_STATE_VERSION` 33 → 34, `migrateV33ToV34`:

- A save standing on a deleted map (reachable only through dev travel since
  v28) moves onto the Lantern Deep's sealed deep stair (`ld-18`), reusing the
  v28 move; the staged encounter drops. A save in the Labyrinth is left alone
  (D54: parked, untouched).
- The deleted maps leave every continent's `availableMaps` / `lockedMaps` /
  `completedMaps` and `world.mapStates` (the v29 scrub).
- The 9 deleted quests leave the quest log (`available`, `active`,
  `completed`).
- Flags keyed to deleted content drop: flags naming a deleted NPC tree or a
  parked node prefix (`nf-`, `nc-`, `ncy-`, `cr-`, `tar-`, `cap-`). Flags the
  engine still reads stay.
- `createNewGameState`'s continent catalogue stops seeding the deleted maps.

## Carrier sweep (D45)

Glossary / atlas rows, glyphs, map icons, `engine-id-copy` titles and dev
catalog rows left naming only a deleted map, NPC or quest go (both
workspaces). The `rich` loot tier goes if its only reader was the
northern-forest branch.

## Decisions made upfront — DO NOT ASK

- **Split R7e / R7e2 now**, along the part plan's own seam (world vs relics).
- **`StateFixture.stagedEvent`** (a `MapEventPayload`) is how a fixture
  stages dialogue, a shop or a cutscene on an Act 1 node.
  `resolveMapEvent(state, rng, staged?)` resolves the staged payload in
  place of the node's pool; mobile's fixture arrival passes it through.
  Rejected: registering a node override from the fixture builder (a
  process-global write that shadows a live Act 1 node and trips the
  content-parity shadow guard). The fixtures are test-only and never
  registered in the live world (part plan, Keep).
- **The fixture copy is plain placeholder text** ("Fixture NPC", "A
  placeholder line."), never story (D58).
- **`QuestName` is `string`.** A nine-name union with no quests behind it
  is a dead carrier; a union of one fixture name would put test vocabulary
  in the engine's public type.
- **Labyrinth saves pass through.** v28 moved them onto the vault door; a
  dev-travelled Labyrinth save today is a parked map the part plan keeps.
- **Act 1's gathering nodes and materials stay** (part plan, Not in R7e).

## Tests matrix

- Deleted with their subjects: the `nf-12`, `nf-19`, `nf-21/nf-14` staging
  suites; `NPCs/e2e/story-npcs`; the parked rows of
  `continents.engine.test.ts`, `content.engine.test.ts`,
  `content-parity`, `travel-kind`, `rest-shelter`, `gathering-grant`,
  `node-event-kind`, `map-traversal`, `world.engine`, `world.reducer.test`,
  `shop.engine`, `card.engine`, `source-id`, the CLI route audit, and the
  mobile layout parity, branching, travel-door, exploration, event and
  world-travel suites.
- Rewritten: the state-fixture suites (both workspaces) onto the staged
  fixtures and `bw-3`; dialogue, shop and quest suites onto the fixtures.
- Added: `migrateV33ToV34` (parked-map save moves to `ld-18`, catalogue
  scrub, quest and flag drop, Act 1 and Labyrinth saves pass through,
  idempotent); `resolveMapEvent` with a staged payload.
- Unchanged and green: every Labyrinth suite; narrative reachability pinned
  to Act 1.

## Verify gate

`npm run verify` (both workspaces), root `npm test`, `npm run lint:content`,
`node scripts/check-lexicon.mjs`.

## Commit body template

```
chore: the parked world's content goes — phase R7e

- <maps / events / NPCs / quests>
- <plumbing kept and its fixtures>
- <mobile>
- <save v34>

Decisions:
- <...>

Closes #<mirror>
```

## DoD

- No `nf-` / `nc-` / `ncy-` / `cr-` / `tar-` / `cap-` node, parked map name,
  NPC tree or quest is left in live code.
- Dialogue, village and quest plumbing pass on fixtures.
- A v33 save on a parked map loads onto `ld-18`.
- Gates green; R7e ticked; the R7e2 row added; B4 and R8 require R7e2.

## Follow-ups (out of scope)

- R7e2: the relic strip.
- Comments and docs that narrate the deleted maps: R10c.
