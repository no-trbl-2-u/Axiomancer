# Prompt: THE MAP REVAMP — M3 onward (the four Act 1 maps, the Labyrinth door, docs)

> Written 2026-09-25 at the close of the kickoff session
> (`plan/2026-09-25-map-revamp-kickoff.prompt.md`). Read these first, in
> order:
> 1. `plan/2026-09-25-refactor-strategy.decisions.md`: D1, D2, D5, D15, D16,
>    and **D21–D25** (the kickoff ballot and T's landmark ruling). These are
>    policy. Never re-ask them.
> 2. `axiomancer-mechanics/content/story/story-overview.md`. **The story is
>    the overview and nothing else.** Invent no canon.
> 3. `skills/forge.md`, the **Map** wiring checklist (around line 86). Its
>    "column-layering law" line is stale until M5 rewrites it.
> 4. The kickoff prompt's §3 (out of scope) and §4 (standing notes: line
>    endings, `verify:visual` on Windows, baseline regen, the guard hook,
>    merging, worktrees). All of that still applies.
>
> This is an attended session. Its first act is the §2 ballot below.

## 0. State at hand-off

| Phase | PR | State |
|---|---|---|
| M0: CI gap | #382 | Open, CI green. The gap was already closed on 2026-08-22 (`plan/AUDIT.md` contract row). M0 records D21–D24 and pins the mobile map paths in `scripts/ci-e2e-scope.test.mjs`. |
| M1: art | #383 | Open, stacked on #382. Four plates at `axiomancer-mobile/assets/images/maps/act1-{coast,forest,mountains,underworld}.webp` (2400×2400, D22 plain resize, one parchment tint), registered as `ACT1_PLATES`. Also: **`act1-landmarks.json`** (73 landmark positions as plate fractions), `act1-prompts.md`, provenance and the art-catalog entries. D25 recorded. |
| M2: per-map sheet | #384 | Open, stacked on #383. `MapLayout.sheet: MapSheet` (`width`, `height`, `scale`, `backdrop`, `plateOpacity`, `chartTexture`) replaces the global `SPREAD` and the region regex. The shipped maps use `legacySheet(plate)` and render pixel-identical. |

Merge in order: #382 → #383 → #384. Each is stacked on the one before, so
after a merge the next PR's diff shrinks to its own commit. The repo uses
merge commits, and auto-merge is disabled.

What D21 changed from the kickoff's plan: **M3 no longer re-authors the
shipped maps.** It builds four new maps, one per plate, in the order coast →
forest → mountains → underworld (D23). The seven shipped maps stay playable
until a later act re-slots them. So there is no node-id migration of shipped
content in M3. Every node id is new.

## 1. Ask T first (one `AskUserQuestion` batch, per `docs/asking-well.md`)

Recommend an option for each, put it first, and give each a defer path.
Record the answers as D26 onward.

1. **Names and descriptions for the four maps.** D21's consequence: the
   story overview names none of these places, and the kickoff forbids
   inventing canon. Offer to draft candidates in the house voice for T to
   pick or edit, one map at a time. Defer path: build the coast map under a
   placeholder region string marked `[needs-T-name]` that must not ship to
   `main`.
2. **Where Act 1 sits in play.** Today `createStartingWorld()`
   (`src/World/index.ts:13`) starts a new game on fishing-village. Options:
   - (a) A new game starts on the coast map; the underworld's last travel
     door leads into the shipped chain (fishing-village onward) until the
     re-slot.
   - (b) Act 1 is reachable only through a door from the shipped chain for
     now, and the start map changes once all four ship.
   - (c) Something else.

   The cost of (a): existing saves, the opening narration (story-overview
   rulings 10–11) and the first-map e2e tests all assume fishing-village.
   The cost of (b): Act 1 is hidden until it is complete.
3. **The engine home for the four maps.** A new continent (for example an
   `act-1` key, which needs `createStartingWorld()`'s catalogue and a route),
   or the existing continents (coast and forest under `coastal-continent`,
   mountains and underworld under `northern-continent`). Recommend a new
   continent: the shipped continents' `nodeIdToMapName()` prefixes and
   regions stay untouched.
4. **Enemies and events per map.** The forge checklist says to reference
   existing enemy pools and NPCs, and file needs to `adjust-enemies` /
   `adjust-npcs` rather than author them in a map PR. Confirm that each Act 1
   map borrows the nearest shipped pool (coast from fishing-village, forest
   from northern-forest, underworld from caverns, mountains from caverns or
   northern-city) until the story-dependent revamp (D1 step 4).

## 2. Phases

| Phase | Scope | Notes |
|---|---|---|
| **M3a–d: one map per PR** (coast, forest, mountains, underworld) | Engine `MapDefinition` + `map.library.ts` union + `map.registry.ts` + `nodeIdToMapName()` prefix + event pools (`MapEvents/content.ts`) + a mobile layout in `exploration-maps/` registered in `index.ts` + a travel door in (a map without a door is not shipped). | **D25:** one node on every landmark in `act1-landmarks.json` for that plate, and more only between landmarks. Mobile `sheet`: `width`/`height` from the plate's aspect (square), `scale` chosen so the canvas is at least ~1600px square (D16), `backdrop: ACT1_PLATES.<region>`, `plateOpacity` about 0.85, `chartTexture: false`. Node `x`/`y` = landmark fraction × sheet size. The engine's forward column skeleton still governs progression (D16). Only `x`/`y` is free, and a road may run any direction on the plate. Every node must be reachable at least once under frontier roaming (engine pins in `src/World/e2e/map-traversal.engine.test.ts`). **Underworld:** plate or halo the node marks, because the plate is the densest and darkest of the four. Check with `verify:visual`. |
| **M4: the Labyrinth door (D24)** | The underworld's `vault-door` landmark node enters the Aporia on arrival through `enterLabyrinthAction`'s snapshot and return path (`mobile/state/labyrinth/store-actions.ts:107`), with a hermetic test for enter, return and resume. | Its own PR, after M3d. The `'travel'` MapEvent (`MapEvents/types.ts:183`, `handlers.ts:271`) does not take the labyrinth path today. The act content and `plan/labyrinth/acts` are normative. |
| **M5: docs** | Rewrite `docs/world.md` (the "Map Registry", "Movement … linear with completed-lock" and "Demo Content" sections are stale) and the "column-layering law" line in `skills/forge.md` to describe D16's shape and the `MapSheet`. | Can ride with M3d. |

The M3 pins to write, per map:
- On-sheet: already sheet-relative since M2.
- Glyph-clear edges: `branching-legibility` reads `sheet.scale`. Add the new maps to its `MAPS` list.
- **A D25 pin:** every landmark in `act1-landmarks.json` for the plate has a layout node within a small radius of it, say 2% of the sheet.
- **A D16 not-a-climb pin:** the layout's node bounding box spans at least half the sheet on both axes, and the entry node is not on the bottom edge.

## 3. Definition of done for the next session

- §1 answered and recorded as D26 onward.
- M3a (coast) merged, or in review with its gates green.
- This file updated with what remains.
