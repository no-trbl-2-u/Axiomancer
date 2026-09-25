# BASELINE — deck combat, quantitative + qualitative (2026-07-10)

Auditor: mechanics-expert (SNOB lens). All numbers from seed-1 deterministic sims on the
current working tree (`axiomancer-mechanics@0.37.0`, post dice-law rework of 2026-07-09).
Commands used (6 sim invocations total):

- (a) `npm run combat-playtest -- --stage=all --policy=blind --runs=30 --seed=1`
- (b) `npm run combat-playtest -- --stage=all --policy=greedy --runs=30 --seed=1`
- (c) `npm run combat-playtest -- --stage=mid --policy=all --runs=20 --seed=1`
- (d) `npm run combat -- --auto --policy status --stage early --seed 3 --max-turns 14`
      and the same at `--stage mid --seed 5` (plus `--json-events` captures of both)

Metric definitions (verified in source): `statusEngagement` = status-applying plays /
total card plays (`src/Combat/combat.encounter.sim.ts:570`); `dotHpFraction` = enemy HP
lost to DoT ticks / total enemy HP lost (`combat.encounter.sim.ts:572`). `dom` =
dominant card's share of enemy HP damage. Decks are `policy-pick` (each policy drafts
its own preferred deck from the stage pool).

---

## 1. Raw tables

### (a) blind, all stages, 30 runs/cell

| stage | enemy | win | V/M/D/R | rounds | statusEng | dotFrac | strike | H | dom |
|---|---|---|---|---|---|---|---|---|---|
| early | grave-larva | 100% | 30/0/0/0 | 2.0 | 65% | 95% | 5% | 0.99 | 31% |
| early | foot-stealer | 100% | 30/0/0/0 | 2.2 | 66% | 95% | 5% | 1.00 | 32% |
| early | little-belle | 100% | 30/0/0/0 | 2.2 | 65% | 94% | 6% | 1.00 | 30% |
| early | water-holger | 100% | 30/0/0/0 | 2.2 | 65% | 93% | 7% | 1.00 | 31% |
| early | the-butcher | 100% | 30/0/0/0 | 3.0 | 65% | 97% | 3% | 1.00 | 33% |
| early | king-of-revenge | 97% | 29/0/1/0 | 3.4 | 66% | 97% | 3% | 1.00 | 32% |
| mid | tri-eyes | 100% | 28/2/0/0 | 4.1 | 36% | 99% | 1% | 0.96 | 48% |
| mid | mirac | 97% | 22/7/1/0 | 4.1 | 34% | 99% | 1% | 0.97 | 49% |
| mid | hasshaku-sama | 100% | 25/5/0/0 | 4.2 | 35% | 99% | 1% | 0.97 | 39% |
| mid | jeweled-tree | 100% | 24/6/0/0 | 4.4 | 35% | 99% | 1% | 0.97 | 43% |
| mid | rawhead-rex | 73% | 18/4/8/0 | 4.2 | 32% | 99% | 1% | 0.97 | 52% |
| late | fire-giant | 0% | 0/0/30/0 | 4.0 | 27% | 98% | 2% | 0.95 | 46% |
| late | rangda | 0% | 0/0/30/0 | 3.0 | 25% | 98% | 2% | 0.97 | 42% |
| late | tezcatlipoca | 10% | 3/0/27/0 | 3.0 | 16% | 99% | 1% | 0.94 | 34% |
| late | arch-demon | 0% | 0/0/30/0 | 3.0 | 25% | 98% | 2% | 0.97 | 40% |
| late | death | 10% | 3/0/27/0 | 3.0 | 15% | 99% | 1% | 0.94 | 34% |
| late | the-abortive | 0% | 0/0/30/0 | 3.0 | 25% | 96% | 4% | 0.97 | 43% |
| impossible | the-incompleteness | 17% | 5/0/25/0 | 4.9 | 16% | 99% | 1% | 0.93 | 45% |

Stage summaries (blind, runs-weighted):

| stage | win | doctrine target | statusEng | dotFrac | rounds | dom card |
|---|---|---|---|---|---|---|
| early | **99%** | ~80% | 66% | 95% | 2.5 | straw-mans-jab 33% |
| mid | **94%** | ~50% | 34% | 99% | 4.2 | slippery-slope 52% |
| late | **3%** | 25–35% | 22% | 98% | 3.2 | brief-candle 46% |
| impossible | **17%** | 0% | 16% | 99% | 4.9 | brief-candle 45% |

Win-path mix (blind, totals): early vic=179 def=1; mid vic=117 **cap=24** def=9;
late vic=6 def=174; impossible vic=5 def=25. **mercy=0, concede=0 everywhere.**

Card coverage (a): **22/70 eligible cards exercised — 69% dead-card rate.**

### (b) greedy, all stages, 30 runs/cell — the greedy-vs-blind gap

Cell-by-cell greedy is IDENTICAL to blind at every stage: early 100/100/100/100/100/97,
mid 100/97/100/100/73, late 0/0/10/0/10/0, impossible 17. Stage summaries differ by at
most 1 point of statusEng (65 vs 66 early, 35 vs 34 mid). Same dead-card list, same
win-path mix (early vic=179 def=1; mid vic=117 cap=24 def=9; late vic=6 def=174).

**Greedy-vs-blind win gap per stage: 0pp / 0pp / 0pp / 0pp.**

The greedy policy peeks at the enemy's hidden stance; blind cannot. That peek is worth
*nothing*. For calibration: in Slay the Spire the gap between an informed line and a
blind heuristic line is the whole game — an A20 expert sits near 45–50% where a naive
bot sits in low single digits. Here the entire hidden-information layer (the stance
read, the telegraph, the whole "read your opponent" fantasy the UI sells) has zero
decision value in the current rules. The puzzle, as measured, is flat.

### (c) mid stage, all 8 policies, 20 runs/cell

Win% by policy × enemy:

| policy | tri-eyes | mirac | hasshaku | jeweled-tree | rawhead-rex | avg |
|---|---|---|---|---|---|---|
| **chaos** (random) | 100% | 100% | 100% | 100% | **100%** | **100%** |
| greedy | 100% | 95% | 100% | 100% | 75% | 94% |
| blind | 100% | 95% | 100% | 100% | 75% | 94% |
| mercy-seeker | 100% | 100% | 95% | 100% | 55% | 90% |
| dot-weaver | 100% | 50% | 85% | 85% | 0% | 64% |
| control-lock | 100% | 20% | 55% | 65% | 5% | 49% |
| aggro-brute | 65% | 0% | 0% | 0% | 0% | 13% |
| turtle | 65% | 0% | 0% | 0% | 0% | 13% |

Notable cell detail: chaos beats greedy outright on rawhead-rex (100% vs 75%) and mirac
(100% vs 95%), losing nothing anywhere. dot-weaver — the policy that most resembles the
game's own doctrine ("weave DoTs deliberately") — goes 0/20 into rawhead-rex while
random play goes 20/20. mercy-seeker's wins are `vic=20 mer=0` — even the policy built
to seek mercy wins by kill. Card coverage (c): 32/61 exercised (48% dead).

### (d) single-fight transcripts

**Early, status policy, seed 3 (Little Belle, 40 HP):** Victory in 2 phases, player
85/90. Total DoT attributed 740 vs a 40 HP enemy; `sig-conviction-strike` alone
attributed **704 DoT (95%)** "over 10 phases" — in a 2-phase fight. Library cards'
contributions: opening-statement 6, brief-candle 18, nettle-cloak 12. Direct damage 12.

**Mid, status policy, seed 5:** `--stage mid` built a 255 HP mid player but the enemy
defaulted to Little Belle (40 HP) — `npm run combat`'s `--stage` scales the PLAYER only;
the default enemy is hardcoded (`src/CLI/combat.cli.ts:164`, `enemySlug: 'little-belle'`).
Victory in **1 phase**, 426 DoT attributed (10.6× overkill), `sig-conviction-strike`
384/426 = **90%**.

Transcript observability gap: in `--auto` mode the CLI emits only `hazardCombat:start`
and `hazardCombat:end` even with `--json-events` — the per-phase `autoPhase` events
never reach stdout, and the readable `── Phase N ──` narration exists only in the
interactive loop (`src/CLI/combat.cli.ts:397-481`). **There is currently no way to get a
turn-by-turn transcript of an auto-played fight.** Auditors cannot see autopilot
directly; they can only infer it. That is itself a baseline finding.

---

## 2. Reading (SNOB commentary)

### The difficulty curve is not a curve; it is a step function with a spike

Doctrine demands 80 → 50 → 25-35 → 0. Measured: **99 → 94 → 3 → 17**. Early and mid are
formalities (179/180 and 141/150 non-defeats), late is a wall (6 wins in 180), and
"impossible" — the stage whose entire identity is 0% — is the *second most winnable
tier in the game* at 17%. The curve is non-monotonic: the-incompleteness is easier than
four of the six late bosses. Nothing about the current tuning produces the Aeon's End /
StS act-boss rhythm of "harder, but I can see the line." You are either coasting or dead.

### Late-game defeats are scripted, not dramatic

Four of six late enemies kill in exactly 3.0 rounds, with zero variance across 30 seeded
runs each. That is not a difficult fight; that is a cutscene. Inscryption at least has
the decency to make its foregone conclusions part of the script. Rounds overall are far
too short for a DoT-doctrine game: early fights end in 2.0–2.2 rounds. Poison ramps,
Rupture setups, enchant payoffs — the entire status toolbox needs runway, and a 2-round
fight is a runway the length of a doormat. Compare Monster Train / StS median fight
length (6–10 meaningful decisions); this game's early fights contain roughly two.

### Skill expression, as currently measurable, is zero — and random play is optimal

Two independent witnesses agree. First, greedy = blind to the run, at every stage: the
hidden-stance peek — the one lever of hidden information the sim can express — changes
no outcome in 1,020 fights. Second, and worse: at mid, **chaos (uniform random card
choice) is the strictly best policy in the game** — 100% flat, above greedy's 94%. The
Dominion community uses Big Money as the floor a strategy must beat to be interesting;
Axiomancer's floor is currently its ceiling. When random play weakly dominates informed
play, card choice is not a puzzle — it is a texture. The owner wants "an exhilarating,
intuitive puzzle"; the baseline measures a slot machine where every pull wins (early/mid)
or every pull loses (late).

Why chaos wins where greedy stumbles (rawhead-rex 100% vs 75%) deserves a dedicated
investigation by the systems auditor — the likely shape is that greedy's value function
optimizes a quantity (immediate DoT EV) that is anti-correlated with survival against
burst enemies, while chaos accidentally diversifies into guard/control plays. Either
way: the "correct" heuristics the game teaches are not the winning ones.

### The doctrine witnesses: DoT delivers, status engagement collapses

`dotFrac` 95–99% everywhere — strike-is-dead is real and enforced; essentially all enemy
HP falls to ticks. Good. But `statusEngagement` — the fraction of plays that actually
apply a status, i.e. the doctrine's "fun per click" — **decays 66% → 34% → 22% → 16%**
across stages. Exactly when fights get hard, two-thirds to five-sixths of the player's
plays stop being status plays. If status effects are THE fun, the late game is
measurably one-sixth fun. A Wildfrost or Monster Train late fight *escalates* its
signature mechanic; this one abandons it.

### One card carries every stage; the signature carries every fight

`dom` (dominant card HP share): slippery-slope alone deals ~52% of all mid-stage enemy
HP loss; brief-candle 45–46% at late/impossible; cassandras-burden hits 58% in the (c)
matrix. And beneath the deck entirely: in both transcripts the Conviction-funded
signature `sig-conviction-strike` (7◆, guaranteed boosted poison,
`src/Combat/combat.signature.ts:50-53`) delivered **90–95% of all damage**. The 70-card
library is set dressing around one signature button — and the 2026-07-09 handoff notes
Conviction income roughly *doubled* under the new dice law, so signature cadence will
only accelerate. Dead-card rate: **48/70 (69%) never played** across the full blind+greedy
stage matrix; still 29/61 (48%) with all eight policies sampling. Cards no sampled policy
ever touches include bootstrap-loop, crown-of-thorns, irresistible-grace, mirror-of-longing,
the-oracles-eye, zenos-half-step — i.e. much of the enchant/curse layer the card audit
(HANDOFF-2026-07-09) just spent effort wording.

### Alt-win paths: one lives, two are dead content

CAPITULATE fires (24/150 blind mid wins) — respectable. Befriend/mercy and CONCEDE
(Peroration): **zero occurrences in ~1,290 simulated fights**, including from the
mercy-seeker policy purpose-built to want them (its 90% win rate is all kills). Either
the thresholds are unreachable, the policies can't route to them, or the payoff timing
loses to "just let the poison tick." Griftlands made surrender-paths compete by pricing
them into the reward structure; here they don't compete even when a bot is ordered to
prefer them.

### Sim-harness caveats the other auditors must carry

1. `npm run combat --stage X` does NOT select a stage-appropriate enemy — pass `--enemy`
   explicitly or you get a 255 HP mid player curb-stomping a 40 HP Little Belle in one
   phase (as happened in transcript (d2); documented, not discarded).
2. Auto-mode has no turn-by-turn transcript (events swallowed; see above). Any
   "autopilot smell" claims below the summary level are currently unverifiable by tooling.
3. Per-card attribution double-counts or fails to clamp overkill: 740 DoT attributed
   against a 40 max-HP enemy, and "phases" counts (Conviction Strike "10 phases" in a
   2-phase fight) appear to count ticks, not phases. Treat attribution tables as ordinal,
   not cardinal, until `combat.encounter.types.ts` accounting is audited.
4. These are `policy-pick` decks, not the starter presets — preset-curve conformance
   (the 80/50/25-35/0 doctrine) is measured elsewhere (`combat-playtest.balance-bands`
   currently pins `KNOWN_CURVE_VIOLATORS = ['refrain','standstill']`).

---

## 3. Baseline verdict

Between "less-than-mediocre" and this data there is no daylight. The system passes its
letter-of-the-law doctrine checks (dotFrac ~98%, strikes ~0%) while failing every
spirit-of-the-law engagement check: zero measurable skill expression (greedy=blind),
random play optimal (chaos ≥ greedy), status engagement collapsing with stakes, 69% of
the library inert, one signature dealing 9/10ths of all damage, fights too short to let
the status doctrine breathe, a difficulty function that jumps from 94% to 3%, and two of
three alt-win paths that have literally never fired. The exhilaration the owner wants
lives in the gap between a blind guess and an informed read — and that gap is currently
zero points wide.
