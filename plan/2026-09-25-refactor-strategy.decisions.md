# THE REFACTOR STRATEGY — record of decisions

> Attended session, 2026-09-25. T raised four concerns (map shape, the
> post-story revamp, card adjustments + stat scaling, trimming dead
> systems) and asked whether to restart the project, purge its content,
> or work the concerns one at a time. Evidence was read from the tree
> before answering; the answers below were given through
> `AskUserQuestion` and are policy. Do not re-ask.

## Evidence the verdict rests on

| Fact | Value (2026-09-25 tree) |
|---|---|
| Engine source / engine tests / mobile source | ~66k / ~49k / ~113k lines |
| Content T wants changed | 129 cards, 29 authored map nodes, narration strings |
| Map authoring shape | hand-placed `location: [x, y]`, x = column 0..7, y = lane -2..1 |
| Traversal | frontier roaming already shipped (W-01 amended by D1, 2026-09-21) |
| Derived-stat consumers outside `src/Character/` | 5–13 non-test files per stat; none provably dead without an audit |

Reading: the parts T dislikes are the thin content layer. The expensive
parts (deterministic engine, reducers, RNG, CI gates, tests, loop
harness) are not in question.

## Decisions

**D1 — No restart. No purge. Sequenced rework, trim first.**
*Rejected:* restart (discards ~230k lines with no evidence the engine
architecture is wrong); purge (tests and the narrative-reachability
guard couple to content, so a mass delete leaves CI red with nothing to
validate against and loses the pricing baselines that make card changes
measurable). *Order:*

1. **Trim the fat** — audit first, because its keep/cut list bounds every
   later item.
2. **Map spread** — engine-only; independent of story.
3. **Card damage scaling by level/stats** — engine-only formula hook;
   independent of which cards exist.
4. **Story-dependent revamp** — map progression, enemy themes, narration,
   card content. Ships after the story adjustments land, as one keyed-off-
   the-outline change.

**D2 — Map spread is hand-authored wide graphs, not a generator.**
Re-author node locations as a 2-D web per region (order of 5x5 to 6x6)
with a guaranteed path that lets the player reach every node at least
once under frontier roaming. Keeps the mobile layout-parity test model;
each map stays a deliberate design. The "linear" read is the
column-and-lane authoring shape, not the traversal rules. A procedural
generator was rejected as a new engine subsystem plus new mobile layout
work for a problem authoring can solve.

**D3 — The trim audit covers everything: engine systems and stats,
mobile screens and components, forward-looking docs, and `plan/`
memory.** Output is a keep/cut list with consumer counts per item. The
`plan/` portion overlaps `/consolidate`; run the audit's `plan/` pass
through that skill rather than a second curator.

**D4 — Stat model: real combat hooks per stat.** body/mind/heart each
drive a distinct combat quantity; the damage-scaling hook (D1 step 3)
plugs into this model. Rejected: merging into one VITAE point;
deferring to the card rework.

**D5 — Labyrinth / Aporia: wire an entry.** Not parked, not cut. A map
event or door reaches it from normal play. Scope lands with the map
re-authoring (D2). Its engine, CLI, mobile route, art and
`plan/labyrinth/acts` are excluded from every trim count.

**D6 — Deletion policy exception to hard rule 4.** Images, raw sim
output, vendored third-party scans and committed e2e output may be
deleted outright. Markdown still archives into `plan/archive/`. A delete
does not shrink git history; history is never rewritten.

**D7 — Collapse the Upgradeable-Dice flag.** The OFF path (stance
draft, hidden read, STAKE, momentum wheel) and its mobile UI are
deleted; tests and sims pinned to OFF are rewritten to the shipped
model.

**D8 — GLYPHS: cut. Card upgrades: defer.** The GLYPHS pilot (~250
engine LOC + 4 mobile files, zero library cards) is deleted in T5.
`card-upgrades.ts` stays until the card rework (D1 step 4) decides its
grant path.

**D9 — Resolved rows leave `## Pending`.** In AUDIT / CRITIQUE /
PHASE_CANDIDATES, rows already resolved move to Done or `plan/archive/`
in T4. This is the `/oversight` ruling `/consolidate` deferred on
2026-09-02.

**D10 — Retire all eight zero-invocation tuning/playtest commands.**
deck-tuning, hazard-tuning, world-tuning, combat-ux-tuning, critic-loop,
deep-playtest, hermes-playtest, dep-upgrades: commands and skill docs
are deleted in T5; the playtest matrix stays as npm scripts. A `/jot`
note records the intent to rebuild them once the game mechanics have a
firmer footing.

**D11 — Icon pool stays in-repo.** T1 deleted `Potential Assets/icons-BBR`
(a black-on-white duplicate). The usable pool is
`Potential Assets/icons-TBR` (game-icons.net, 4,181 icons, CC BY 3.0 /
CC0, licence in `icons-TBR/license.txt`). When a new icon is needed, pick
it there and run `node axiomancer-mobile/scripts/extract-game-icons.mjs`,
which reads that path. Never trim `icons-TBR` as "unreferenced": it is a
source pool, not a shipped asset. *Rejected:* a separate repo (extractor
rework, one more clone) and a sibling directory outside the repo (cloud
sessions clone only this repo and could not reach it).

**D12 — Tier-2 buffs lose their hidden d20.** The 5 % fizzle / 5 % double
roll in `Combat/resist.ts` is removed; buffs apply as printed (trim spec
Tier 0 item 5). *Rejected:* surfacing the roll in the UI.

**D13 — T2 ships as two PRs.** T2a: engine dead code + Tier 0 items 1-5.
T2b: the Upgradeable-Dice flag collapse (D7). T2b starts after T2a
merges.

**D14 — Cut the base-stat lines on relics and effects too.** The trim
spec's "relic stat lines" and "effect statModifiers" are read literally:
the +2 body/mind/heart lines on 8 signet relics and the body/mind/heart/
luck modifiers on `buff_all_stats_up`, `buff_phoenix_vigor` and
`debuff_curse` are deleted in T2a. Relics keep their granted signature
(and the two armor relics their +5 max VITAE). Step 3 (D4 stat hooks)
re-authors any stat bonus it wants. *Rejected:* keeping them as data for
the future hooks; keeping them but hiding them in the UI.

**D15 — Map backdrops: atmosphere now, the map itself later.** (T,
2026-09-25.) For the D2 re-authoring, the node graph is authored first and
the backdrop is made to fit it as atmosphere. The target state is the
reverse: nodes placed ON the backdrop's landmarks, with the art panning
and zooming under the same gestures as the nodes. *Deferred, not
rejected.* Most of the plumbing already exists: `MapCanvas` draws the
plate inside the same fixed 360×400 × `SPREAD` canvas that pans and
zooms with the nodes (so `cover` crops identically on every device), and
node positions are hand-placed `x, y` in that viewBox in the per-map
mobile layout, not derived from the engine's column/lane. What the later
phase adds: a per-map canvas size/aspect (today every map shares one
portrait canvas), a stronger plate (opacity 0.2 today), and authoring
the layout `x, y` against the image.

**D16 — D2 map parameters.** (T, 2026-09-25.) Four regions, ~20 nodes
per map. A map must not read as a climb: the layout spreads in every
direction from the entry, so reaching the whole map needs panning up,
down, left and right. The engine's forward skeleton (column order) still
governs progression; only the mobile layout's `x, y` is freed from the
bottom-to-top ladder. The per-map canvas must be larger than the viewport
on both axes (D15's per-map canvas size lands with or before this).

**D17 — A chronicle continued mid-fight restarts that fight.** (T,
2026-09-25.) The fight's dice, hand and HP live in the combat panel and do
not survive an app restart; only the engine's `currentEncounter` does.
Continue lands on the map, which reopens the saved foe as a fresh fight
(bosses keep WITHDRAW sealed). *Rejected:* reopening the prelude (FIGHT /
WITHDRAW) and resolving the save as a flee. Accepted cost: quitting a
losing fight resets it to pre-fight HP. Shipped in T3 (#374).

**D18 — The "Codex" aesthetic: cut.** (T, 2026-09-25, T5 ballot.) The
dev-toggle-only cold-codex mode (`aesthetic-mode`, `AestheticDevToggle`,
`ExplorationCodexHeader`, `exploration.codex.engine`) changed one header and
nothing else. *Rejected:* finishing it as a player-facing mode. Shipped in
T5 (#380).

**D19 — The Debug\* tools: keep all.** (T, 2026-09-25, T5 ballot.) The
manual-only Debug\* components stay beside the CI-driven ones: dev-only,
outside the player path, and T's daily local-play shortcuts. *Rejected:*
cutting everything no CI testID drives. Do not re-propose the cut in trim
or audit passes.

**D20 — Die growth and banked souls: keep; wire with the card rework.**
(T, 2026-09-25, T5 ballot.) `bonusTurnDice` / `dieUpgradeLevel` stay (the
engine reads them; only the stage-profile sim sets them today) and get a
real grant path in the card rework (D1 step 4), alongside card upgrades
(D8). `bankedSouls` stays: combat writes it and the memoir's soul line
reads it, so it was never dead. *Rejected:* cutting the die fields (it
would change the sim's late-stage numbers).

**D21 — Act 1 is four brand-new maps built from the plates.** (T,
2026-09-25, map-revamp kickoff ballot.) One map per plate: coast,
forest, mountain fastness, underworld. The seven shipped maps are not
re-authored onto the plates; they are re-slotted into a later act, and
stay playable until then. The art is four separate square plates, not
one engraving to crop (T generated one image per region). *Consequence:*
the story overview names none of the four places, so each new map's name
and description is a ruling T makes before its M3 PR. Nothing is
invented. *Rejected:* three shipped maps (fishing-village, northern-forest,
caverns) plus one new mountain map; four shipped maps with northern-city
re-themed as the mountains.

**D22 — Plates are ingested by plain resize, no AI upscaler.** (T,
2026-09-25.) Each plate is scaled 2× with a standard resampling filter.
No invented linework; softer when zoomed in. Reversible: an upscaled file
can replace a plate later, with a provenance edit and no code change.
*Rejected:* Upscayl run by T; Real-ESRGAN downloaded and run by the agent.

**D23 — Act 1 order: coast → forest → mountains → underworld.** (T,
2026-09-25.) The underworld is last. The plates' drawn seams (the forest's
cave mouths drop into the underworld, and the underworld's tunnel leads
into the mountains) are imagery and do not bind the travel doors.
*Rejected:* coast → forest → underworld → mountains, which followed the
seams.

**D24 — The Labyrinth door is the underworld's sealed vault door, open on
arrival.** (T, 2026-09-25.) One node on the underworld map, placed on the
plate's vault-door landmark, enters the Aporia through
`enterLabyrinthAction`'s snapshot and return path as soon as the player
reaches it. No gate. *Rejected:* a gate condition (it would need new
content); another host map.

**D25 — Every landmark on a plate gets a node.** (T, 2026-09-25: "place
the nodes at at least the landmarks.") An Act 1 map's M3 layout puts a
node on each landmark in `axiomancer-mobile/assets/images/maps/act1-landmarks.json`
(read off the shipped plates in M1: 17–20 per plate). A map may add nodes
between landmarks, but never leaves a landmark without one. This is the
floor under D16's "~20 nodes": a plate with 20 landmarks has at least 20
nodes.

## Open follow-ups

- Audit tick (D1 step 1, D3 scope) — DONE 2026-09-25; keep/cut list and
  sequencing in `plan/2026-09-25-trim-the-fat.spec.md`. **T1–T4 merged
  2026-09-25** (T1 #369, T2a #370 + fix `e073bb6e`, T2a baselines #371,
  T2a residue #372, T2b #373, T3 #374, T4 #375). **T5 merged 2026-09-25**:
  GLYPHS cut #376 (D8), eight commands retired #378 (D10; rebuild `/jot`
  row on main `1fc33003`), Tier 2 docs archive #377, platform icons #379,
  Codex cut #380 (D18). D19/D20 keep the Debug\* tools and die growth.
  **TRIM THE FAT is complete.** Leftover: the `.claude`-cited docs row at
  the top of `plan/AUDIT.md` Pending (profane-canon, specs 10/35).
- Map re-authoring brief (D2) — parameters set by D16 (4 regions, ~20
  nodes/map, spread in all directions). Graph first, backdrop second (D15).
  **Kickoff prompt:** `plan/2026-09-25-map-revamp-kickoff.prompt.md` (phases
  M0–M5; opens with a four-question owner ballot). **Ballot answered
  2026-09-25 as D21–D24.** M0's CI gap was already closed on 2026-08-22
  (`plan/AUDIT.md` contract row, RESOLVED): all of `src/World/**` runs the
  mobile gate. M0 only adds a pin for the mobile-owned side. M0 #382, M1
  #383 and M2 #384 opened 2026-09-25 (stacked in that order). **Next:**
  `plan/2026-09-25-map-revamp-m3.prompt.md` (the four new maps, the
  Labyrinth door and docs; opens with a four-question ballot on names, start
  map, engine home and enemy pools).
- Backdrop-anchored map renderer (D15) — nodes in image coordinates,
  art pans/zooms with the node layer. Its own phase, after D2 — or folded
  into D2, since D16's per-map canvas is the same change.
- Act 1 map art (2026-09-25) — T generated a square four-quadrant Doré-style
  engraving (coast/harbour, great-tree forest, mountain fastness, candlelit
  underworld) from the prompt in this session; judged a fit (no frame or
  text, web-shaped roads, ~20 landmarks per quadrant, crossings at the
  seams). Before use: upscale to ≥5000px (check the upscaler keeps the
  hatching), crop along the natural seams with overlap rather than the
  exact centre lines, plate/halo nodes in the dark underworld quadrant, and
  add a `provenance.json` entry (tool, model, prompt, seed). Suggested Act 1
  order (not decided): coast → forest → mountains → underworld.
  **Superseded 2026-09-25:** T regenerated the art as four separate plates
  (one per region, about 1125–1254px each, generated from per-region
  prompts with the mountains plate as the style reference). No crop is
  needed. Resize per D22, order per D23.
- Scaling formula (D1 step 3) — D4 settles the direction (per-stat
  hooks); the exact stat-to-quantity mapping is designed with the hook.
- Trim spec §5.3 / §5.6 / §5.7 answered 2026-09-25 as D8 / D9 / D10.
  Nothing in §5 remains open.
