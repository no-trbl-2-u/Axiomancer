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

## Open follow-ups

- Audit tick (D1 step 1, D3 scope) — DONE 2026-09-25; keep/cut list and
  sequencing in `plan/2026-09-25-trim-the-fat.spec.md`. **T1–T4 merged
  2026-09-25** (T1 #369, T2a #370 + fix `e073bb6e`, T2a baselines #371,
  T2a residue #372, T2b #373, T3 #374, T4 #375). **T5 is next**; pick-up
  prompt: `plan/2026-09-25-trim-t5-handoff.prompt.md`. §5 of the spec is
  fully answered (D4–D10).
- Map re-authoring brief (D2) — parameters set by D16 (4 regions, ~20
  nodes/map, spread in all directions). Graph first, backdrop second (D15).
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
- Scaling formula (D1 step 3) — D4 settles the direction (per-stat
  hooks); the exact stat-to-quantity mapping is designed with the hook.
- Trim spec §5.3 / §5.6 / §5.7 answered 2026-09-25 as D8 / D9 / D10.
  Nothing in §5 remains open.
