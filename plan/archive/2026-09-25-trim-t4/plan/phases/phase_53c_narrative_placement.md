# Phase 53c — Placement: the quest-giver on the spine, and a coverage floor

> Agent-facing brief. The first map's premise quest is never active in real
> play, because the only NPC who starts it has no node. Put him back, home
> three more voices, and ship the measurement that stops load-bearing
> narrative landing on a coin flip again. Mechanics. Third of the
> **narrative-encounters** batch; needs 53a and 53b first.

## Why this exists

Two separate problems that share one fix.

**The quest chain cannot begin.** Searching the tree for who starts
`starting-quest`:

```
maps.ts:73   effect: { startQuest: 'starting-quest' }   # Old Marrow, "Consider it done."
maps.ts:92   startQuest: 'starting-quest'               # Old Marrow, the pessimist branch
DebugQuestState.tsx:45                                  # the dev menu
```

Both authored sites are inside Old Marrow's dialogue tree, and Old Marrow is
unreachable — `fishing-village` has exactly one `interaction` node and it
names a `Weathered Fisher` who is in no roster. Nothing auto-grants the
quest on map entry. So the kill-objective repair shipped 2026-08-08 is
correct and currently advances a quest **no player has ever held**.

Two committed documents still assert where he belongs. `docs/story.md`:
*"Old Marrow (Fishing Village, `fv-2`)"*. And `maps.ts`'s own header
comment: `fv-1 (start) → fv-2 (interaction — quest giver) → fv-3 (village)`.
`fv-2` is a loot cache today. He lost his node in the Phase 65 expansion
from 6 nodes to 25 and nothing failed, because nothing checked.

**The narrative is off the spine.** Exhaustive walk of all 1479 legal
routes, and a route is 10 nodes long:

| node | content | share of routes |
|---|---|---|
| `fv-1` | arrival cutscene | **100%** |
| `fv-6` | the boss | **100%** |
| `fv-15` | quest board — "build the boat" | 33.3% |
| `fv-14` | the father dilemma | 29.4% |
| `fv-19` | the mute NPC node | 27.6% |

Only two nodes are on every route, both placed there deliberately by the
last audit. Everything narrative landed in the lanes — not as designed
rarity, but because nobody could measure it until `auditMapTraversal`
existed.

## Inputs

1. `src/World/Continents/Coastal-Village/maps.ts` — the `fishingVillage`
   node array (columns 0-9, `location: [x, y]`), the rosters, the inline
   trees.
2. `src/World/MapEvents/content.ts` — `fvArrival`, `fvShoreInteraction`,
   `FV_LOOT_NODES`, `FV_ENCOUNTER_FOES`, and the
   `FISHING_VILLAGE_NEW_PLAYER_POOLS` assignment chain.
3. `src/World/world.reducer.ts` — `auditMapTraversal`, `legalMovesFrom`,
   `isMapTerminalNode`.
4. `src/World/e2e/map-traversal.engine.test.ts` — the strand invariant this
   phase must keep green.
5. `specs/story/S-02-fishing-village-voices.md` — which four NPCs are homed,
   where, and why the other four are not.
6. `docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md` § N2, § N6.
7. `axiomancer-mobile/state/presenters/onboarding.engine.ts` — reads
   `completedNodes.length === 0` and the start node id. Re-read it before
   touching column 1; the last re-layer broke the title screen by coupling
   it to the start node's edge count.

## Scope

**Narrow column 1 to a single node.** `fv-1 → fv-2` only; `fv-2` then opens
onto all three column-2 nodes. The fork is not removed, it moves one column
later. Old Marrow goes on `fv-2` — restoring the placement both documents
above already assert, and giving the map a third 100% node.

The fiction improves with the topology: the boy leaves the hovel and the
dockmaster is on the quay between him and the three roads, so the premise is
handed over *before* the first choice of lane and the choice becomes an
informed one. Move the arrival cutscene's closing line ("Three ways out of
the yard…") into Marrow's mouth — a man pointing at roads beats a narrator
listing them.

**Home three more, per S-02.**

| NPC | where | why there |
|---|---|---|
| Coastal Beggar | a column-2/3/4 node, before the boss | the moral choice should be fresh at the climax |
| Captain Blackwater | post-boss, wharf lane | he is a docks character |
| Fisherman's Daughter | post-boss, inland lane | reads `fv-14`, which is column 3 |

`fv-19`'s `Weathered Fisher` is retired in the process — 53a's accepted
exception is removed in this phase.

**Grid stays at 25.** Encounter nodes change hands; nothing is added.
`fv-2`'s loot cache moves to whichever node is displaced from column 1.

**Ship the coverage floor.** Export the route-coverage walk as a real
auditor beside `auditMapTraversal` (it exists only as a scratch script
today) and assert a floor: any node carrying a **load-bearing** beat — the
quest giver, the quest board, the boss, the arrival — is on 100% of routes,
and the test names each one. Non-load-bearing narrative is explicitly
allowed to be rare; the floor is about what a run cannot afford to miss.

## Decisions made upfront — DO NOT ASK

- **Narrow column 1; do not add a node, and do not auto-grant the quest on
  map entry.** Auto-granting would make the quest active without the boy
  agreeing to it, which deletes the map's first moral fork (take the coin /
  take half / demand double is Old Marrow's whole function per spec 10) and
  papers over the placement bug rather than fixing it.
- **Grid stays at 25.** Growing it re-opens the strand class the 2026-08-08
  re-layer closed structurally, and invalidates the route-length and
  coverage numbers that audit tuned.
- **Four NPCs homed, four left unstaged** — settled in S-02 with a reason
  each. Do not home a fifth to be generous; 53a's guard needs the unstaged
  set declared, not emptied.
- **The three lane NPCs sit strictly after the boss.** A gauntlet has no
  back-travel, so an NPC can only react to an earlier column — see S-02
  § "the law a gauntlet imposes". Placing a reader before the beat it reads
  produces unreachable content, which is the class this batch exists to
  stop.
- **Accept the route-count drop.** Branching starting a column later means
  fewer distinct routes. Guaranteeing the premise beats maximising
  permutations; say the new number in the commit body rather than treating
  it as a regression.
- **Nothing in this phase rewrites a line of existing dialogue.** Moving the
  cutscene's road line into Marrow's greeting is the one copy edit, and it
  is a move, not a retheme. 44g owns prose.

## Surface as `[needs-user-call]`

- If the re-layer forces a choice between the coverage floor and a strand-free
  topology, stop and say so. Both invariants are load-bearing and trading one
  for the other silently is exactly the failure mode of the last two audits.

## Prove (DoD)

- **The finding, as a test:** starting from a fresh game state, a legal
  route reaches Old Marrow, his greeting is available, and `starting-quest`
  becomes active. That single test is the phase — it is the first time in
  the project's history that assertion could pass.
- `auditMapTraversal` on both maps: zero strands, zero unreachable nodes,
  terminals unchanged in kind. The existing invariant test stays green
  without being weakened.
- Coverage floor test: `fv-1`, `fv-2`, `fv-6` at 100%; the quest board at
  100% or its move recorded and justified in the brief's follow-ups.
- Old Marrow's node coverage asserted as a number, not "reachable".
- 53a's `fv-19` exception is gone and the registry-wide guard passes with no
  exceptions on fishing-village.
- The onboarding view-model still shows the title screen on a fresh store —
  the regression the last re-layer caused, re-checked deliberately.
- `npm run verify --workspace axiomancer-mechanics` and
  `--workspace axiomancer-mobile`, plus the Playwright journeys
  (`npm run e2e:minigames --workspace axiomancer-mobile`) — this phase moves
  map topology, and the journeys are the only coverage for cross-slice
  routing. See the pending AUDIT row on the verify gate's blind spot; do not
  rely on `npm run verify` alone here.

## Follow-ups

- 53d places the four S-01 dilemmas into encounter nodes on the re-layered
  grid; it must re-run both auditors afterward.
- 53e adds the reactive branches to the three post-boss NPCs this phase
  homes.
- The quest board (`fv-15`, 33.3%) is left where it is unless the re-layer
  naturally lifts it. Whether "build the boat" is load-bearing enough to
  demand the spine is a design question for 46a/46c, which own the
  early-game and the Quest Board tutorial.
