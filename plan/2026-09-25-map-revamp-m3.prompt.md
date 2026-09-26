# Prompt: THE MAP REVAMP — M3 onward (the four Act 1 maps, the Labyrinth door, docs)

> Written 2026-09-25 at the close of the kickoff session, after T answered
> the M3 ballot. Read these first, in order:
> 1. `plan/2026-09-25-refactor-strategy.decisions.md`: D1, D2, D5, D15, D16,
>    and **D21–D29**. These are policy. Never re-ask them. D26–D29 answer
>    everything this session needs from T up front. The only open
>    owner-input is each map's name pick (D26), made inside the session.
> 2. `axiomancer-mechanics/content/story/story-overview.md`. **The story is
>    the overview and nothing else.** Invent no canon: the one sanctioned
>    exception is D26's drafted names, and only once T has picked one.
> 3. `skills/forge.md`, the **Map** wiring checklist (around line 86). Its
>    "column-layering law" line is stale until M5 rewrites it.
> 4. `plan/2026-09-25-map-revamp-kickoff.prompt.md` §3 (out of scope) and §4
>    (standing notes: line endings, `verify:visual` on Windows, baseline
>    regen, the guard hook, merging, worktrees). All of that still applies.

## 0. State at hand-off

| Phase | PR | State |
|---|---|---|
| M0: CI gap | #382 | Open, CI green. The gap was already closed on 2026-08-22. M0 pins the mobile map paths in `scripts/ci-e2e-scope.test.mjs`. |
| M1: art | #383 | Open, stacked on #382. Four plates at `axiomancer-mobile/assets/images/maps/act1-{coast,forest,mountains,underworld}.webp` (2400×2400, D22), exported as `ACT1_PLATES`. **`act1-landmarks.json`** holds 73 landmark positions as plate fractions, 17–20 per plate. Also `act1-prompts.md`, provenance and art-catalog entries. |
| M2: per-map sheet | #384 | Open, stacked on #383. `MapLayout.sheet: MapSheet` (`width`, `height`, `scale`, `backdrop`, `plateOpacity`, `chartTexture`) replaced the global `SPREAD` and the region-regex plate pick. The shipped maps use `legacySheet(plate)` and render pixel-identical. |
| M3a: the Breakwater + new start | #385 | **Merged 2026-09-26** (2b289bb2). See §3a. |
| M3b: the Charcoal Wood | #389 | Built 2026-09-26. See §3b. |

**First act of the session:** get #382 → #383 → #384 merged, in order (the
repo uses merge commits; auto-merge is disabled). Each PR's decisions-file
and prompt edits were also filed straight to main on 2026-09-25, so a
merge may conflict on `plan/2026-09-25-refactor-strategy.decisions.md` or
this file. Resolve by taking main's version. M3 builds on M1's
`ACT1_PLATES` and `act1-landmarks.json` and M2's `MapSheet`, so nothing in
M3 starts before #384 is in.

## 1. What T ruled (the shape of M3)

- **D21:** four brand-new maps, one per plate. The seven shipped maps are
  not re-authored, so no shipped node id changes.
- **D23:** play order is coast → forest → mountains → underworld.
- **D25:** a node on every landmark in `act1-landmarks.json`, and extra
  nodes only between landmarks.
- **D26:** before each map's PR, draft three name + description candidates
  in the house voice (spec 34 §2.5: terse, cold, priced scenery; no
  thee/thou/ye). Ask T to pick with `AskUserQuestion`, one map at a time,
  recommended candidate first. Record the pick in the story overview's
  "The maps — place and theme" table in the same PR. Keep the `what` field
  in the landmarks file drawing-only; it is not canon.
- **D26 picks (all made; do not re-ask).** Use these names and descriptions
  verbatim. Each map's PR records its pick in the story overview's map table.
  - **Forest (M3b): The Charcoal Wood.** "Burners work the clearings and sell
    the smoke by the sack. Three caves open in the south cliff; nobody sells
    the way back."
  - **Mountains (M3c): The Beacon Crags.** "A fire on the summit tells the
    valley who is coming. The rope bridge charges for the crossing, and again
    for the fall."
  - **Underworld (M3d): The Lantern Deep.** "Every light below the stair was
    carried down and paid for. Past the drowned temple, the lanterns stop."
  - Map ids and node prefixes are the builder's call under D28's
    no-prefix-collision rule (M3a used `breakwater` / `bw-`).
- **D27:** a new game starts on the coast from M3a. The last built Act 1
  map's exit door leads into the shipped chain at fishing-village. Once the
  underworld ships, its door does.
- **D28:** coast and forest go under `coastal-continent`; mountains and
  underworld under `northern-continent`. Each map gets its own node-id
  prefix, distinct from every shipped one (`fv-`, `nf-`, `nc-`, `ncy-`,
  `cr-`, `tar-`, `cap-`, `ap1-`–`ap3-`). Pick prefixes that don't prefix-
  collide (see the `ncy-`/`nc-` note in `nodeIdToMapName()`,
  `src/World/encounter.ts`).
- **D29:** borrow the nearest shipped pools: coast from fishing-village,
  forest from northern-forest, mountains and underworld from caverns. No
  new enemies, NPCs or events. File any gap to `adjust-enemies` /
  `adjust-npcs`.

## 2. Phases

| Phase | Scope | Notes |
|---|---|---|
| **M3a: the coast, and the new start** | D26 name pick → engine `MapDefinition` under `src/World/Continents/Coastal-Village/` (or a sibling dir) + `map.library.ts` union + `map.registry.ts` + `nodeIdToMapName()` prefix + event pools in `MapEvents/content.ts` borrowed per D29 + mobile layout in `exploration-maps/` registered in `index.ts` + an exit door to fishing-village. **Plus D27:** `createStartingWorld()` (`src/World/index.ts:13`) starts on the coast. | The heaviest PR. See §3 for the start-map fallout. |
| **M3b: the forest** | Same checklist. The coast's exit door now leads to the forest, and the forest's leads to fishing-village. | Reuse `ACT1_SHEET_SIZE` from `breakwater.layout.ts` and add the map to `act1-layouts.test.ts`'s `ACT1_MAPS`. |
| **M3b+: Android preview build** (T, 2026-09-26) | Once M3b is merged, trigger the EAS preview APK so T can play the first two Act 1 maps on a phone: `gh workflow run preview-build.yml -f platform=android -f profile=preview` (the `preview` profile in `axiomancer-mobile/eas.json` builds an internal-distribution APK; `npm run deploy:preview` is the local equivalent). Hand T the build's install link. | Not a PR. Watch the run to completion and report its link, or its failure with the log. |
| **M3c: the mountains** | Same checklist, under `northern-continent`. The first cross-continent step in Act 1: follow how the shipped chain's travel doors cross continents, not a new mechanism. | |
| **M3d: the underworld** | Same checklist, under `northern-continent`. Its exit door leads to fishing-village. Plate or halo the node marks, because this plate is the densest and darkest. | Check with `verify:visual`. |
| **M4: the Labyrinth door (D24)** | The underworld's `vault-door` landmark node enters the Aporia on arrival through `enterLabyrinthAction`'s snapshot and return path (`mobile/state/labyrinth/store-actions.ts:107`), with a hermetic test for enter, return and resume. | Its own PR, after M3d. The `'travel'` MapEvent (`MapEvents/types.ts:183`, `handlers.ts:271`) does not take the labyrinth path today. The act content and `plan/labyrinth/acts` are normative. |
| **M5: docs** | Rewrite `docs/world.md` (the "Map Registry", "Movement … linear with completed-lock" and "Demo Content" sections are stale) and `skills/forge.md`'s "column-layering law" line to describe D16's shape and the `MapSheet`. | Can ride with M3d. |

**Every Act 1 map layout's sheet:** `ACT1_SHEET_SIZE` (M3a): `width`/`height`
1000×1000 (the plate is square), `scale` 2.4, the plate's native 2400px. (1.6
left the plate's edge and black showing on a desktop opening fit, which zooms
out to the 0.6 floor; 2.4 still spans 1440px there.) The canvas is at least 1600px on both
axes (D16), `backdrop: ACT1_PLATES.<region>`, `plateOpacity` about 0.85,
`chartTexture: false`. Node `x`/`y` = landmark fraction × 1000. The
engine's forward column skeleton still governs progression (D16); only
`x`/`y` is free, and a road may run any direction on the plate. Every node
must be reachable at least once under frontier roaming (engine pins in
`src/World/e2e/map-traversal.engine.test.ts`).

**New pins, per map:**
- Add the map to `branching-legibility`'s `MAPS` list (it already reads each
  layout's sheet).
- **D25:** every landmark for the plate has a layout node within 2% of the
  sheet of it.
- **D16, not a climb:** the node bounding box spans at least half the sheet
  on both axes, and the entry node is not on the bottom edge.

## 3. D27's fallout: moving the new-game start

The start has been fishing-village since the first build. Measured
2026-09-25: `createStartingWorld()` has three non-test callers
(`Game/game.migrate.ts`, `Game/game.reducer.ts`, `Game/run-loop.ts`) and
**82 test files** name `fishing-village` or `fv-` ids. Approach for M3a:

1. **Saves in progress stay where they are.** Check what `game.migrate.ts`
   uses `createStartingWorld()` for. A migration must never teleport a
   player on fishing-village (or later) to the coast. If it builds a
   default world for a missing field, pin that behaviour with a test
   before changing the start.
2. **Tests that mean "a world on fishing-village" say so.** Add a test
   helper that builds a world placed on a named map (a thin wrapper over
   the same factory). Move tests that exercise fishing-village content onto
   it, instead of letting them silently follow the new-game start. Tests
   that genuinely mean "a new game" (the new-player journey, the opening
   narration, the start-node arrival) move to the coast.
3. **The opening narration** (story-overview rulings 10–11) is placement-
   independent: X is fleeing the Drowned Parish. Don't rewrite its text.
   Check only that nothing in it names the first node. The overview's
   "Noted" line (the shipped fishing-village opening vs the prologue) stays
   open; the coast start doesn't settle it.
4. **The CLI and the stage-profile sim** (`run-loop.ts`, the playtest
   matrix) start from the new-game world. If the matrix numbers move,
   re-stamp the baseline and cite before/after (`npm run baseline:check`,
   kickoff §4 "Baseline regen").

If the fallout outgrows one PR, split M3a in two: the coast map with a
debug-travel entry first, then the start move. Don't ship a coast that no
path reaches: under D27 it is the start, so the split's first half needs
the start move before it merges to main, or a door.

## 3a. M3a — shipped state (2026-09-26)

M3a is on branch `claude/map-revamp-m3a` (PR opened the same day). What it
settled, so M3b–d copy it rather than re-derive it:

- **The Breakwater:** `breakwater`, prefix `bw-`, 18 nodes on the 18 coast
  landmarks (D25), columns as rings out from the windmill, door at the river
  bridge. Engine: `Continents/Coastal-Village/breakwater.ts`. Events:
  `BREAKWATER_POOLS` in `MapEvents/content.ts`, built from fishing-village's
  builders. Enemy pool shared via `FISHING_VILLAGE_POOL` in `enemy.library.ts`.
- **The start (D27):** `STARTING_MAP` in the World barrel;
  `createStartingWorld(startMap?)` and `createNewGameState({ startMap })`
  place a fresh game on any campaign map (`STARTABLE_MAPS`). The fallout was
  far smaller than the 82-file estimate: 15 mechanics and 8 mobile test files.
  Tests about fishing-village content now pass `'fishing-village'` explicitly.
- **Start on any map (T, 2026-09-26):** CLI `--start-map <map>`, and the dev
  menu's **DEBUG · NEW GAME ON** row (a fresh run on any campaign map in the
  active slot). Travel-without-reset stays in the existing TRAVEL row.
- **Agent calls T may overrule:**
  - The Breakwater has **no boss**. Its last fight is water-holger at the
    watchtower, since fishing-village's boss (the King of Revenge) is still
    ahead in the shipped chain.
  - The windmill start is a **rest (camp)**, so a new game opens on the rest
    screen, then the first-node relic.
  - The Breakwater has **no combat plate** yet. It is listed in
    `AWAITING_PLATE` and falls back like the Northern Forest.
  - Fishing-village's own lore also has a "breakwater": its King of Revenge
    "rises from the breakwater". The two names now overlap.
- **Fixed on the way:** the map vignette SVG had no size and rendered as a
  dark 300×150 box on web (hidden under the dim atmosphere plates).
- **Baseline:** re-stamped at `e2befb89`. The matrix did not move (stamp-only diff).

## 3b. M3b — shipped state (2026-09-26), and the checklist M3c–d copy

**The Charcoal Wood:** `charcoal-wood`, prefix `cw-`, 20 nodes on the 20 forest
landmarks. Arrival over the river bridge on the west edge (cutscene), rings
east and north, door at the carved stair cave (`cw-20`, travel to
fishing-village until M3c re-points it). The Breakwater's `bw-18` now leads
here. Engine: `Continents/Coastal-Village/charcoal-wood.ts`. Events:
`CHARCOAL_WOOD_POOLS` in `MapEvents/content.ts`. Enemy pool: the northern
forest's list, now the shared `NORTHERN_FOREST_POOL` const.

Two things M3b found that M3c and M3d must not rediscover:

- **Pin every fight's level.** The borrowed rosters are far above Act 1: the
  northern forest's is level 9 and up, and so is most of the caverns'. An
  unpinned or level-less encounter scales to `max(enemy.level, player.level)`,
  so a level-2 player would meet a level-9 foe. M3b pins each encounter with
  the payload's `level` (2 early, 3 late; `cwEncounterPool`). Keep the
  mountains and underworld low too (about 3–4), and let
  `charcoal-wood.engine.test.ts`'s level pin be the model. Fishing-village's
  boss is level 3 (`FV_BOSS_LEVEL`) and still comes after all of Act 1: that
  ordering is an open difficulty question, filed in `plan/AUDIT.md`, not
  something a map PR settles.
- **Inns only inside settlements.** `rest-shelter.engine.test.ts` (Phase 52b)
  fails any `inn` outside a settlement, so wild rests are camps (`ncCampPool`).

**Per-map checklist** (every file M3b touched, in order):

1. Engine map `Continents/<Continent>/<map>.ts` (header comment with the ring
   diagram), `maps.ts` name union, `map.registry.ts`, `nodeIdToMapName()` in
   `encounter.ts`.
2. `EnemiesByMap` entry sharing the borrowed pool's const in `enemy.library.ts`.
3. Pools in `MapEvents/content.ts` (after the previous Act 1 map's block),
   registered in `registerMapEventContent()`; re-point the previous map's door
   (engine pool and its mobile layout node's description).
4. Engine test `World/e2e/<map>.engine.test.ts` (copy the Charcoal Wood's);
   update `breakwater.engine.test.ts` (locked-map list, `STARTABLE_MAPS`) and
   `map-traversal.engine.test.ts` (registry list); update the previous map's
   engine test door case.
5. Mobile layout `state/exploration-maps/<map>.layout.ts` on `ACT1_SHEET_SIZE`,
   registered in `index.ts`; add to `act1-layouts.test.ts` `ACT1_MAPS` and to
   `branching-legibility.test.ts` `MAPS` (raise the rib total); add the region
   to `AWAITING_PLATE` and bump the live-region count in
   `assets/images/combat/__tests__/index.test.ts`.
6. Story overview map-table row; this file's §0; tick the row in
   `plan/steps/01_build_plan.md`.
7. Gates: mechanics `verify`, mobile `verify`, root `npm test`, then
   `baseline:regen` after committing (it refuses a dirty tree).

## 4. Definition of done, and who does what

- **M3a:** merged 2026-09-26 (#385).
- **M3b (The Charcoal Wood):** built by the attended session of 2026-09-26,
  then the Android preview build (M3b+) and its install link to T. Its PR
  ticks M3b in `plan/steps/01_build_plan.md` and unblocks M3c.
- **M3c, M3d, M4, M5:** rows in `plan/steps/01_build_plan.md` for the
  autonomous loop, in strict order (each requires the row above it `[x]`).
  Each ships as one PR per `/ship-a-phase`, with the pins in §2 and the
  pattern in §3a.
- Whoever ships a row updates §0 of this file with its PR.
