# Prompt: THE MAP REVAMP — kick off D2 (with D15, D16 and the D5 Labyrinth door)

> Written 2026-09-25 at T's direction, after TRIM THE FAT finished (T1–T5,
> #369–#381). This is step 2 of THE REFACTOR STRATEGY. Read these first, in
> order:
> 1. `plan/2026-09-25-refactor-strategy.decisions.md`: D1, D2, D5, D15, D16
>    and D20. Those decisions are policy. Never re-ask them.
> 2. `axiomancer-mechanics/content/story/story-overview.md`: its rulings (2
>    in particular: plates are "imagery, not structure"), "The maps — place
>    and theme" table, and its open questions. **The story is the overview
>    and nothing else.** Invent no canon (see mechanics `CLAUDE.md`).
> 3. `skills/forge.md`, the **Map** wiring checklist (around line 86).
> 4. This file.
>
> Nothing here overrides those. This is an attended kickoff. Whatever T
> answers in §2 becomes D21 onward in the decisions file.

## 0. State at hand-off

Main is green. Mechanics has 221 files / 3,501 tests, mobile has 304 suites
/ 3,019 tests, root `npm test` is 218/218, and `baseline:check` is FRESH.
The trim removed dead systems only; no map or content changed.

What the map system is today:

| Surface | Where | Shape |
|---|---|---|
| Engine maps | `src/World/Continents/{Coastal-Village,Northern-Continent}/maps.ts`, registry `src/World/map.registry.ts` | 7 maps. Coastal: fishing-village 28 nodes, northern-forest 25. Northern: caverns 26, northern-city 26, connecting-river 13, town-across-river 7, the-capital 9. Nodes are written `location: [column, lane]`, with edges inline. |
| Traversal | `world.reducer.ts` (`frontierNodes` ~125, `forwardEdges` ~615) | Frontier roaming (D1). Progression follows the forward column skeleton, and lateral "ribs" run within a column. |
| Engine shape pins | `src/World/e2e/map-traversal.engine.test.ts` (whole file); `Continents/e2e/continents.engine.test.ts:25,62` | No strands, full reachability, a single terminal column, forward edges only one column ahead, distinct coordinates, no single-file corridors, plus per-map beat and spine pins. |
| Node-keyed content | `MapEvents/content.ts` (7 `setNodeEventPoolOverride` calls plus pools keyed by node id), NPC staging, quest objectives, `narrative-reachability.ts:50` | Renaming or removing a node id breaks these. |
| Mobile layouts | `axiomancer-mobile/state/exploration-maps/<map>.layout.ts` (7 files) | Hand-placed `x, y` in a shared 360×400 viewBox. Columns run bottom-to-top and lanes map to x = 90/180/270/330. That is the "climb" D16 forbids. |
| Canvas | `components/exploration/MapCanvas.tsx` | `SPREAD = 2.6` (`:36`), one portrait canvas for every map, pinch and pan, the plate drawn inside the transformed canvas with `cover` at `opacity: 0.2` (`:570`). |
| Mobile pins | `exploration-maps/__tests__/{layout-engine-parity,branching-legibility,fishing-village.layout}.test.ts`, `state/presenters/__tests__/exploration-map-legibility.test.ts` | Id-set parity, on-sheet and edge-length rules that import `SPREAD`, the fv vertical spine, and the ribs-within-a-column rule. |
| Backdrops | `assets/images/maps/` (5 webp), `mapBackdropFor(region)` regex, `provenance.json`, `plate-crop.test.ts` | Chosen by a regex over the region string, not per map. |
| Labyrinth (D5) | `src/World/Labyrinth/`, `mobile/state/labyrinth/store-actions.ts:107` `enterLabyrinthAction`, `app/labyrinth/` | Reachable only from `DebugWorldTravel` and the CLI. The `'travel'` MapEvent (`MapEvents/types.ts:183`, `handlers.ts:271`) does not take the labyrinth snapshot path. |
| CI scope | `scripts/ci-e2e-scope.mjs:133-139` | Closed since 2026-08-22: every `src/World/**` change routes to the mobile verify plus the `encounters` journeys, so the parity test runs on engine map changes. |

**The Act 1 engraving is not in the repo.** T generated it in an earlier
session: a square, four-quadrant, Doré-style engraving (coast and harbour,
great-tree forest, mountain fastness, candlelit underworld). You need the
file from T before any art step.

## 1. Mandate

Make the maps read as places you explore rather than ladders you climb
(D2, D16), and lay the groundwork for nodes that sit on the art (D15). Ship
in phases, one PR per phase. Each phase must pass the package gates it
touches (AGENTS.md cross-package checklist), re-stamp the baseline if
mechanics source changed, and pass `verify:visual` whenever a screen
changes (see §4 for the Windows recipe).

| Phase | Scope | Notes |
|---|---|---|
| **M0: confirm CI coverage** | No code expected. On the first M-phase PR, check the job log to confirm `verify --workspace axiomancer-mobile` actually ran (see `plan/lessons.md` Deploy #3: a green check is not evidence a step ran). | Only if it did not run, extend `ci-e2e-scope.mjs` in that PR. |
| **M1: ingest the art** | Upscale T's engraving to at least 5000px on the long side, and check the upscaler keeps the hatching (zoom in and compare). Crop the four quadrants along the natural seams, with overlap, not on the exact centre lines. Export webp. Add a `provenance.json` entry for each crop (tool, model, prompt, seed, post-process, `covers`, `used_by`) and make `plate-crop.test.ts` pass. | Deletion policy D6 applies to intermediates. Never commit the raw upscale if it is huge. Put one master and the crops in the repo, and name them in provenance. |
| **M2: per-map canvas (D15/D16)** | Each layout declares its own canvas (`width`, `height`, and the backdrop it uses), larger than the viewport on both axes. `MapCanvas` reads it in place of the global `SPREAD`. Backdrop selection moves from the region regex to an explicit per-layout field. Raise the plate opacity so the art reads. The initial camera centres on the entry node, not the bottom. | Rewrite the mobile pins that encode the old shape (`SPREAD` import, bottom-to-top spine). Keep the ones that still guard truth (on-sheet, distinct, parity). A test that pinned the ladder is a repealed law. A test that catches an off-sheet node is a guard. |
| **M3: re-author the maps (D2, D16)** | One map per PR. About 20 nodes, a 2-D web spreading up, down, left and right from the entry, placed on the landmarks in its quadrant art. Every node must be reachable at least once under frontier roaming. | The engine's forward column skeleton still governs progression (D16). Only the mobile `x, y` is freed. If a node count or id changes, migrate every node-keyed reference in the same PR (event pools, overrides, NPC staging, quests, reachability) and revise the engine shape pins that encode the old count or spine. Plate or halo the nodes in the dark underworld quadrant. Keep any node the story overview names. |
| **M4: the Labyrinth door (D5)** | A reachable, in-world entry to the Aporia, taking `enterLabyrinthAction`'s snapshot and return path, with a hermetic test for enter, return and resume. Put it on whichever node T picks in §2. | Its own PR. The act content and `plan/labyrinth/acts` are normative. Do not rewrite them. |
| **M5: docs** | Rewrite `docs/world.md` (the "Map Registry", "Movement … linear with completed-lock" and "Demo Content" sections are stale) and the "column-layering law" line in `skills/forge.md` to describe D16's shape. | Can ride with the last M3 PR. |

## 2. Ask T first (one `AskUserQuestion` batch, per `docs/asking-well.md`)

Recommend an option for each, put it first, and give each question a
defer path.

1. **Which maps are Act 1's four regions?** D16 says four regions of
   about 20 nodes, but seven maps ship. Options:
   - (a) Re-author the first four maps in play order onto the four
     quadrants: fishing-village as coast, northern-forest as forest,
     caverns as mountains, and one more as underworld, with the rest left
     for a later act.
   - (b) Four new Act 1 maps built from the engraving, with the existing
     seven re-slotted later.
   - (c) Something else T names.

   Say what each costs in node-id migration and story-table churn.
2. **The engraving file and the upscaler.** Where is the file, and which
   upscaler should you use? If the upscaler is an external service, T runs
   it and hands you the result. Never upload T's art to a service yourself.
3. **Act 1 order.** Coast → forest → mountains → underworld was suggested,
   not decided.
4. **The Labyrinth door.** Which map and node hosts it (the underworld
   quadrant is the natural fit), and does it open on arrival or behind a
   gate?

Record each answer as a D-number in the decisions file before building.

## 3. Out of scope

- The D4 stat hooks, the damage-scaling formula, and the card rework
  (strategy steps 3 and 4, plus D8 card upgrades and D20 die growth).
- Story content: no new events, NPCs, dialogue or region names beyond the
  overview. If a map needs something the overview doesn't carry, say so
  and file it. Content-growth routing stays with `/forge` and `adjust-*`.
- A procedural map generator (rejected in D2; never propose it).
- Rebuilding the retired tuning commands (the `/jot` row on main,
  `1fc33003`, says to do that after the mechanics settle).

## 4. Standing notes (learned the hard way)

- **Line endings:** never `sed -i` on this box, because Git Bash rewrites
  CRLF files wholesale. Edit with the Edit tool or Python using
  `newline=''`. Check `git diff --stat` for whole-file rewrites.
- **`verify:visual` on Windows:** it fails at its own `expo export` spawn.
  Run `npx expo export --platform web --output-dir .smoke-dist` in
  `axiomancer-mobile/`, then `SMOKE_REUSE_EXPORT=1 node
  scripts/smoke-screens.mjs`. Compare against the previous local run's
  percentages, not the container baselines, and only promote the baseline
  PNGs you changed on purpose.
- **Baseline regen:** `baseline:regen` refuses a dirty tree. Commit first,
  re-stamp, then commit the JSON. Map changes can move matrix numbers
  (stage profiles draw on map enemies), so cite before/after when they
  do.
- **The guard hook** lints the whole Bash string. Use plain `-m` commit
  messages with no trailers. Keep the 🤖 PR line out of any command that
  also runs `git commit` or `git push`; write the body to a file and use
  `--body-file`.
- **Merging:** the repo uses merge commits, and auto-merge is disabled.
  When PRs overlap, the pre-commit hook's telemetry shard conflicts on
  every branch. Resolve it by taking the union of rows, sorted by
  timestamp.
- **Worktrees:** a fresh worktree has no `node_modules`, so run `npm ci`
  first.
- **Parallel agents:** subagents in one worktree work well when each owns
  disjoint files and reports cross-file fallout instead of editing it.
- **Verify gate:** never run it in the background.

## 5. Definition of done for the kickoff session

- §2 answered and recorded as D-numbers.
- M0 confirmed and M1 merged. M2 merged, or at least in review with gates green.
- A follow-up hand-off prompt for M3 onward, written in this file's shape
  and listing which maps are left and what node-id migration each needs.
