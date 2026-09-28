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

**D26 — The Act 1 places are named by agent draft, T's pick.** (T,
2026-09-25, M3 ballot.) Before each map's M3 PR, the agent drafts three
name + description candidates in the house voice (spec 34 §2.5: terse,
cold, priced scenery). T picks or edits one. Nothing enters canon without
T's choice, and the pick is recorded in the story overview's map table in
the same PR. *Rejected:* T naming all four up front; placeholder names.
*Picks:* coast **The Breakwater** (2026-09-25); forest **The Charcoal
Wood**, mountains **The Beacon Crags**, underworld **The Lantern Deep**
(2026-09-26, all three at once so the loop could build them unattended).
The descriptions are in `plan/2026-09-25-map-revamp-m3.prompt.md` §1.

**D27 — A new game starts on the coast as soon as it ships.** (T,
2026-09-25.) `createStartingWorld()` moves from fishing-village to the
Act 1 coast map in M3a. Act 1 runs coast → forest → mountains → underworld
(D23). The underworld's exit door leads into the shipped chain at
fishing-village until the later re-slot. While a later Act 1 map is still
unbuilt, the last built one's exit door leads to fishing-village instead.
*Accepted cost:* M3a reworks what assumes a fishing-village start (the
opening narration's placement, new-game and save handling, the first-map
e2e tests). *Rejected:* reaching Act 1 through a door from the shipped
chain until all four ship.

**D28 — The Act 1 maps live in the existing continents.** (T, 2026-09-25.)
Coast and forest go under `coastal-continent`; mountains and underworld
under `northern-continent`. Each map still takes its own node-id prefix in
`nodeIdToMapName()`, distinct from every shipped prefix. *Rejected:* a new
continent key.

**D29 — Act 1 borrows the nearest shipped enemy and event pools.** (T,
2026-09-25.) Coast from fishing-village, forest from northern-forest,
mountains and underworld from caverns. No new enemies, NPCs or events in
the map PRs. A need the pools can't meet is filed to `adjust-enemies` /
`adjust-npcs`. New content waits for the story-dependent revamp (D1 step
4). *Rejected:* authoring new content per map; empty maps first.

The next six were T's answers on 2026-09-26 to the agent calls M3a and M3b
filed in `plan/AUDIT.md`. They shipped with M3c in #394.

**D30 — Act 1 has no bosses; each region has one elite fight, its last
before the door.** (T, 2026-09-26: "Not a boss, but an elite battle for each
region"; placement "last fight before door".) The elite is an `elite`-tier
foe from the map's borrowed roster, pinned to an Act 1 level like every other
fight (brief §3b). Where the map narrows to one node before the door it goes
there (the Breakwater's watchtower, `bw-17`, brine-hag); where the last fight
column is a ring it goes on the ring's centre lane (the Charcoal Wood's
wayside cross, `cw-17`, cursed-paladin; the Beacon Crags' stone gate,
`bc-15`, mabadi). Every other fight is `normal`/`simple` tier, so the Crags'
bone-totem and unpaid-delver were swapped out. Pinned by
`World/e2e/act1-elites.engine.test.ts`. *Rejected:* promoting a normal fight
to boss; an optional side-node elite; an elite on the door node.

**D31 — A new game opens on an arrival scene at the windmill.** (T,
2026-09-26.) `bw-1` is a cutscene, like every other Act 1 map's arrival,
not a camp rest. *Rejected:* keeping the rest start; an empty start.

**D32 — Combat shows a plain black scene for now.** (T, 2026-09-26: "an
all black background for all combat plates for now", every map.)
`ARENA_PLATES_SHOWN = false` in `axiomancer-mobile/assets/images/combat/
index.ts`; the pane paints the palette's darkest ink (`deepBg`) instead of
a plate. The plates, their descriptions and their tests stay, so turning the
art back on is one line. *Rejected:* reusing fishing-village's plate for
Act 1; commissioning Act 1 plates now; black only for unplated maps.

**D33 — The King of Revenge rises from the harbour wall, not "the
breakwater".** (T, 2026-09-26.) Keeps the Act 1 map's name, The Breakwater,
and rewords fishing-village's two lines (`fv-6`'s boss description and the
King's brutal-defeat line) so they don't point at the Act 1 map.
*Rejected:* renaming the map; leaving both.

**D34 — The Breakwater gets people of its own, authored in a story-spec
session.** (T, 2026-09-26.) Not a staging-only move of fishing-village's
NPCs. Names and characters need T's sign-off (hard rule 3; the story
overview's "What happens here" for the Breakwater is still open), so this is
an attended session, not a loop phase. Filed in `plan/AUDIT.md`.
*Rejected:* staging Old Marrow on the Breakwater; waiting for D1 step 4.

**D35 — Fishing-village is retuned after M3d, from measurement.** (T,
2026-09-26.) Once the Lantern Deep ships and all of Act 1 can be played,
`/combat-playtest` measures the run and fishing-village's pins
(`FV_BOSS_LEVEL`, its fights) are raised to follow Act 1. Until then, map
PRs don't touch fishing-village's difficulty. *Rejected:* raising it now;
keeping the dip as a breather.

The next three came from the same session. T asked what was left of the
strategy and said: *"I want to pause at the card phase."* Then, near-
verbatim: *"Once all the other parts of the revamp are over, I want to purge
all the cards and all the combat related keywords except for the grey strike
and grey guard cards and keyword. Then work can continue, but no card
generation unless it's a guided session with me."* The scope was settled by
ballot the same day.

**D36 — Purge every player card but the two grey starters, after step 3.**
(T, 2026-09-26.) Amends D1's "no purge". Keeps `grey-strike` (A Plain Blow)
and `grey-ward` (A Plain Ward) and their keywords, DEAL and GUARD. Purges
every other player card: the six archetype libraries, the apocrypha set, the
relic-granted cards and the 5 curses. Purges every other player-card keyword.
Enemy keywords, decks and the statuses enemies apply stay. Every run deals
the 10-card grey deck; the 10 presets and the 5/5/5 thirds go; card rewards
and cache card offers are gated off. It ships after S3 (step 3), as build-plan
row P1, brief `plan/2026-09-26-card-purge.prompt.md`. *Rejected:* purging
right after M5 (before the scaling hook); stripping enemy keywords too;
keeping presets rebuilt from grey cards.

**D37 — No card generation outside a guided session with T.** (T,
2026-09-26.) From now on, no steward, `/forge`, `/expand` or phase creates a
player card or a player keyword. `adjust-cards` and `adjust-keywords` are
paused (`skills/march.md` §3b skips them) until T re-arms them. Everything
else in the loop continues. *Rejected:* letting the stewards keep making
small passes until the purge.

**D38 — The loop pauses at the card phase: step 3 is attended.** (T,
2026-09-26.) After M5 the loop does not start D1 step 3 (the D4 per-stat
hooks and card damage scaling). It's build-plan row S3, marked blocked for
an attended session with T, because the stat-to-quantity mapping is still
T's call. P1 (the purge) requires S3. *Rejected:* stopping the whole loop
after M5.

The next four came from the stats conversation (T, attended, 2026-09-26/27).
T asked for prior art on stat-scaling deckbuilders, then for high-number RPG
formulas; each call below was a ballot with worked late-game numbers.
Research sources and the full model: `plan/2026-09-27-stat-scaling.prompt.md`.

**D39 — Remove alignment, philosophy and GRACE; keep card colour.** (T,
2026-09-27: "remove everything that has to do with alignment and philosophy.
That includes grace.") Removes the philosophical-alignment grid
(`Ledger/alignment.*`, `GameState.philosophicalAlignment`, the dialogue
gates and read-backs that use it) and the GRACE morale meter (the HUD, the
withdraw penalty). The card colour survives: `philosophicalAspect` is
renamed to a neutral name (e.g. `color`) with no behaviour change, because
the dice and the colour-match bonus read it. A loop phase, build-plan row
T6, before S3. *Rejected:* removing card colour too; doing it attended;
folding it into the purge.

**D40 — Stats scale keyword families, decided by where the effect lands.**
(T, 2026-09-27.) Body: immediate damage to the foe. Mind: anything on you
(GUARD, THORNS, self-buffs). Heart: anything on the foe (VULNERABLE, BURN,
BLEED, STUN). Grey: the rest, unscaled. Keyword text is coloured in its
family's dice colour, with a stat glyph; combat shows final numbers; a
card's colour is its main keyword's family. Gordian Quest is the model T
named. *Rejected:* card colour picks the stat (a grey deck would make
all-body strictly best); heart scales statuses only; per-keyword mapping
without families (T: confusing once there are dozens of keywords).

**D41 — The formula: `base × stat ÷ 5`, nothing capped.** (T, 2026-09-27.)
One-shot amounts and percentages scale `base × stat ÷ 5`, so 5 is neutral
and each point is +20% of the base. Repeating amounts (DoTs, THORNS, regen)
scale at half rate. On/off effects and every duration never scale. No
caps: `VULNERABLE_MAX_MULT` goes. VITAE is `50 + 12·body + 6·mind +
6·heart` (170 at 5/5/5, as today). Enemy VITAE stays linear,
`(30 + 18·level) × difficulty`. *Rejected:* `÷ 3` (steeper), `+10%` per
point (gentler, under the late ladder), geometric enemy health.

**D42 — A third grey card: VULNERABLE.** (T, 2026-09-27.) The grey office
gains a heart card that applies VULNERABLE (working draft: PAID
VULNERABLE +25%, a FREE line to be set in the guided session that builds
it, D37). After the purge the player's keywords are DEAL, GUARD and
VULNERABLE. *Rejected:* BLEED, WEAKEN.

**D43 — A Plain Word: VULNERABLE rebuilt.** (T, guided S3 session,
2026-09-27; ballot.) VULNERABLE was not a live player keyword (no card
applied it; `debuff_vulnerable` sat on the deprecated list; only the
`damageTakenMult` path survived), so S3 rebuilds it on that path. The
effect's intensity is percentage points (+25 = the foe takes +25% damage),
heart scales the percentage when it is applied, and it **lasts 2 turns**.
Re-applying it **adds up and refreshes** the duration (+25% and +25% =
+50%), uncapped. The card is **A Plain Word** (`grey-word`, heart, grey
office): PAID VULNERABLE +25% for 2 turns, **FREE VULNERABLE +10% for 1
turn** (also heart-scaled). *Rejected:* 1 turn and until-your-next-hit
durations; keep-the-higher stacking; FREE Deal 2 or GUARD 2; the names A
Plain Mark (collides with `debuff_mark`) and A Plain Flaw.

**D44 — After the purge, the grey cards ARE the reward pool.** (T,
2026-09-27, ballot; amends D36.) D36 gated card rewards and the cache's
card offer off, because the grey office was never offered. T instead keeps
the reward loop live: a won fight offers Blow, Ward and Word, and taking one
adds a copy. The machinery stays whole for the cards later guided sessions
add. *Rejected:* rewards off until new cards exist; a small non-grey pool.

**S3 residue (2026-09-27, PR #404).** Re-stamping the baseline after S3
moved mid 91% → 100%, late 77% → 100%, impossible 13% → 100% (early is
unchanged at 5/5/5). The cause is a double count: rank-scaled printed
numbers (a mid DEAL 25) times the stat multiplier (body 39 → ×7.8). The
brief's "hits-to-kill holds steady" holds for grey bases (5), so the purge
(P1) should largely undo it. Re-read the matrix after P1 before any tuning;
D41 ("no caps") stands. A separate card agent owns card, keyword, upgrade
and transformation design from here (T, 2026-09-27); S3 touched only the
files listed in #404.

**P1 and keyword-audit residue (2026-09-27, PRs #406 and #407).** The
purge undid most of S3's double count. The re-stamped baseline reads
early 60%, mid 83%, late 99% and impossible 67% (stamp `c6fd758c`). The
keyword audit (#407) removed every card-only keyword, gloss, glyph, editor
word and effect the purge left unused, plus the per-card engine hooks keyed
on purged ids. Enemy keywords were left alone. A live-mode playtest (the
real map encounter, sage preset, seeds 16 and 8) won four fights. Every
reward draft offered exactly Blow, Ward and Word, and TAKE CARD grew the
deck from 10 to 11. What the purge left behind is filed in `plan/AUDIT.md`
Pending under the "post-purge" rows. A Plain Word's staged face wraps
"+25%" (its "×10" FREE value was fixed in the residue PR). The King of Revenge is 0/40. WOUNDING has no payload. The colour
systems are dormant and the Momentum tutorial still teaches them. Card-side
fixes wait for the card agent (D37).

## Open follow-ups

**D1 status at a glance (2026-09-28, after #408).** Card and keyword
creation are excluded here: a separate card agent owns them (D37).

1. **Trim the fat — DONE.** T1–T6 merged (T6 = alignment, philosophy and
   GRACE, `67fd0106`). Left: four `plan/AUDIT.md` debt rows, all
   loop-drainable. They are the T2a finish list, the T2b dice-flag
   content, the T5 Tier 2 docs rewrite, and the trim spec naming
   `mechanics-expert` as a delete candidate.
2. **Map spread — DONE.** M0–M5 merged, and the per-map canvas (M2) took
   the backdrop-anchored renderer (D15) with it. Left: the Act 1
   follow-through in `plan/PHASE_CANDIDATES.md` (score 7.0). It covers the
   Act 1 shop, the kudan XP spike, fishing-village's breakwater lines and a
   default-start reachability test. Old Marrow's unreachable `thanks` also
   belongs here. The Act 1 people sessions are attended
   (`[needs-user-call]`).
3. **Damage scaling — DONE.** S3 (#404), then the purge P1 (#406), the
   keyword audit (#407) and the residue (#408). Left: the post-purge
   `plan/AUDIT.md` rows (the "+2/5%" wrap, the King of Revenge at 0/40,
   WOUNDING with no payload, the Momentum tutorial on dormant colour).
4. **Story-dependent revamp — NOT STARTED, blocked on the story.**
   `content/story/story-overview.md` is still "drafting". The prologue
   is ruled, but the journey after it and the open questions are
   T's, in attended sessions. The non-card parts waiting on it are: map
   progression past Act 1, enemy themes and rosters per map, narration
   and dialogue, and the rows `plan/AUDIT.md` already holds for it (the
   Drowned Parish opening, the legacy `boy-*` threads, the story systems the
   rulings require, and the Act 1 people). The unblocking step is an
   attended story session with T; nothing here is loop-shippable first.

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
  #383 and M2 #384 opened 2026-09-25 (stacked in that order). The M3
  ballot was answered the same day as D26–D29. M0–M2 merged 2026-09-26
  (#382–#384), and M3a (the Breakwater, the new start, start on any map)
  merged 2026-09-26 (#385). All four D26 names are picked. M3b merged
  2026-09-26 (#389), M3c the same day (#392). The agent calls M3a and M3b
  filed were answered as D30–D35 (#394). **Next:** M3b–M5 are rows
  in `plan/steps/01_build_plan.md` (brief
  `plan/2026-09-25-map-revamp-m3.prompt.md`).
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
  **2026-09-26:** attended with T (D38), build-plan row S3; the card purge
  (D36, row P1) follows it. **2026-09-27:** the model is decided (D40–D42),
  brief `plan/2026-09-27-stat-scaling.prompt.md`; T6 (D39) ships first.
- Trim spec §5.3 / §5.6 / §5.7 answered 2026-09-25 as D8 / D9 / D10.
  Nothing in §5 remains open.
