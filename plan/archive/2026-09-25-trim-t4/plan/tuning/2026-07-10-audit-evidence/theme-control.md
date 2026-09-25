# THEME AUDIT — CONTROL (`preset:standstill`) — "Strip the rungs; what cannot land, lands inward"

Auditor: mechanics-expert (SNOB lens), 2026-07-10. One theme, played, not spreadsheeted.
Baseline and rules per `tuning-audit/dossier.md` + `tuning-audit/baseline.md`; sims run
on `axiomancer-mechanics@0.37.0` (post dice-law rework).

**Sim log (6 invocations):**
1. `npm run combat -- --auto --policy status --stage early --deck preset:standstill --seed 3 --max-turns 14`
2. `npm run combat -- --auto --policy status --stage mid --deck preset:standstill --enemy rawhead-rex --seed 5 --max-turns 14`
3. `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:standstill --runs=30 --seed=1 --cards`
4. `npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:standstill --runs=30 --seed=1 --cards`
5. re-run of (1) with `--state-log` (per-phase state capture — the workaround for the
   auto-transcript gap the baseline documented)
6. re-run of (2) with `--state-log`

---

## Verdict in one paragraph

Standstill is the deck whose *engine hooks* are the most elegant in the game and whose
*played experience* is the most fraudulent. The rung/deny/backfire machinery
(`combat.engine.ts:2230-2308`) is genuinely good design — STAGGER removes rungs, full
removal denies the turn, BACKFIRE converts every lost rung to enemy HP, and a fully
denied action pays out on *every* rung (`rungsForBackfire = hindered ? rungsTotal :
rungsLost`, engine.ts:2303). But as played, the deck cannot kill anything by itself
(dom = **100% sig-conviction-strike** in all 11 matrix cells), never has a reason to do
anything but "play everything, every turn" (flat 2-rung telegraphs + enough stagger
income to deny them all), and wins 100%/99% at early/mid against a doctrine target of
80%/50% — a confirmed `KNOWN_CURVE_VIOLATORS` entry wearing a mask of competence that
actually belongs to the Conviction signature kit. The theme sells "the exhilarating
denial of the enemy's plan" and delivers "stack two debuffs, press the poison button,
watch numbers you are never shown."

Scores (5 = competent but forgettable): **distinctiveness 4, engagement 3.**

---

## 1. The ten cards as printed

Preset `standstill` (`src/Combat/combat.deck-presets.ts:112-123`), 15 cards / 7 uniques,
all defined at `src/Cards/cards.library.ts:635-779`:

| card | slot | stance | FREE line | PAID line |
|---|---|---|---|---|
| zenos-half-step ×4 | C1 | body | guard 2 | STAGGER 1 |
| red-herring ×4 | C2 | mind | draw 1 | BACKFIRE i2 d2 (+1 dur on mind die — vestigial) |
| undistributed-middle ×2 | U1 | mind | guard 2 | BACKFIRE i2 d3 + STAGGER 1; threshold mind×3 → +1 stagger +1 intensity |
| arrow-paradox ×2 | U2 | body | guard 2 | lock_stance + STAGGER 1 + BACKFIRE i1 d2 |
| paralysis-of-analysis ×1 | R spell | mind | draw 1 | STAGGER 2 + `debuff_backfire_acute` i3 d3 (own stack, 3/rung — `src/Effects/debuffs.library.json:944-963`) |
| achilles-and-the-tortoise ×1 | R enchant | mind | timed 3-round instance | permanent: draw 1 per denied enemy turn (engine.ts:2442-2443) |
| quagmire-of-doubt ×1 | R disenchant | mind | timed 3-round instance | permanent: telegraphs enter play 1 rung lower (engine.ts:2244) |

Two structural facts leap off the page before a single die is rolled:

1. **The deck contains zero DoT, zero RUPTURE, zero REAP, zero reflect.** Its only
   HP-relevant verb is BACKFIRE, which is hard-capped per phase at
   `(Σ backfirePerRung × intensity) × rungsTotal` — with flat `THREAT_RUNGS = 2`
   (`src/Combat/effects.ts:127`), that is a drip with a ceiling, not a kill path.
   Every other theme's preset has a converter (erosion→RUPTURE, tithe→REAP,
   foundry→the-overtake, oratory→PERORATION). Control has a faucet and no bucket.
2. **Every FREE line is an off-theme chip**: guard 2, guard 2, guard 2, draw 1, draw 1.
   The owner's design signal ("the FREE line should lay foundation for PAID payoffs,
   not be a token drip") bites this deck harder than any other — none of its five
   spell FREE lines touches rungs, telegraphs, or backfire. The comment block at
   cards.library.ts:685-690 even records the tell: undistributed-middle's FREE line was
   *swapped from debuff_mark to guard* because MARK "is INERT in a mono-control deck."
   Correct diagnosis, wrong cure — they replaced an inert chip with a generic one.

---

## 2. Played: what the sims actually show

### 2.1 Early matrix (blind, 30 runs × 6 enemies)

```
stage summary: win=100%  statusEng=56%  dotFrac=22%  rounds=2.0  H=0.93  dom=100%(sig-conviction-strike)
win-path: vic=180 mer=0 cap=0 con=0 def=0
```

- **100% win vs a doctrine target of ~80%** — the flat-curve violation the balance
  bands already pin (`KNOWN_CURVE_VIOLATORS = ['refrain','standstill']`).
- **dotFrac 17–33%** per cell — in the game whose doctrine witness says enemy HP falls
  to DoT, this deck's fights are ~¾ non-DoT... and the DoT that *does* land is the
  signature's poison, not a deck card.
- **dom = 100% sig-conviction-strike, in every single cell.** Not 70% (the printed
  "spam" threshold) — one hundred. The deck's cards are attributed **zero** HP damage
  because BACKFIRE's drip is an engine event (`kind: 'backfired'`, engine.ts:2308)
  credited to no card.

### 2.2 Mid matrix (blind, 30 runs × 5 enemies)

```
stage summary: win=99%  statusEng=54%  dotFrac=46%  rounds=4.6  dom=100%(sig-conviction-strike)
rawhead-rex: 97% (29/1) — the only blemish across 330 fights
```

99% at a stage whose doctrine target is ~50%. The curve is not "flat", it is a
ceiling-hugging line drawn by a different pen: the signature kit wins these fights, and
it would win them holding any of the ten presets.

### 2.3 Early transcript, seed 3 (Little Belle, 40 HP) — state-log

Phase 1 before → after (`scratchpad/standstill-early-s3.jsonl`):

```
before: turn 1,  conviction 0, enemy 40/40, effects []
after:  turn 60, conviction 6, enemy 40/40, effects [debuff_backfire i10, debuff_poison i10]
resolveThreat: enemy 0/40. Player 90/90. Fight over.
```

Read that again: the engine's turn counter advanced **1 → 60 inside a single
phase-play window**. The status-refresh chain (a new status refreshes the applied die)
plus discard-for-◆ lets the auto policy take *dozens* of actions per phase — dump the
hand, scrap the rest for Conviction, cast Overwhelming Argument (backfire i5 in one
press — more than red-herring ×2 and arrow-paradox combined) and Conviction Strike
(poison i3+, "cannot fizzle", `combat.signature.ts:50-53`), and pin **both debuffs at
the i10 intensity cap before the enemy takes its first action**. The enemy never
acted. Nothing was denied, because there was nothing yet to deny. The control deck won
its exemplar early fight *without ever using control*.

### 2.4 Mid transcript, seed 5 (Rawhead Rex, 570 HP) — the one interesting fight

Per-phase enemy/player HP from the state-log (`standstill-mid-s5.jsonl`):

| phase | enemy HP after resolve | player HP | enemy effects after play |
|---|---|---|---|
| 1 | 570→501 | 255 | backfire_acute i3, backfire i10, poison i6 |
| 2 | 501→405 | 255 | (poison pushed to i10) |
| 3 | 405→356 | **255→103** (+debuff_mark i4 on player) | acute expired before this phase |
| 4 | 356→176 | 103 | acute re-stacked to i5, enemy gains buff_all_stats_up |
| 5 | 176→0 | 103 | acute i10 |

This is the theme's honest silhouette, and it is *almost* good: two untouchable phases,
then — the moment `debuff_backfire_acute` (d3) expired without being refreshed — a
**152-damage slam (60% of the player's HP) in a single phase**, then two clean
avalanche phases at the intensity cap. There *is* a felt rhythm here: deny, deny,
crack, avalanche. The problem: **no decision produced it.** The policy did not choose
to eat phase 3; the acute stack timed out and the phase resolved. And the postmortem
tells the player none of it: `Red Herring: 0 dmg`, `Paralysis of Analysis: 0 dmg`,
`Conviction Strike: 2224 DoT`, direct (= the entire backfire output of the fight)
`542` — credited to nobody. The deck's one dramatic swing is invisible in its own
after-action report.

### 2.5 Per-card usage (mid, 150 fights)

```
red-herring              1264 plays  (1031 bottom / 233 top)   1031 status lands
zenos-half-step          1151 plays  ( 939 bottom / 212 top)      0 status lands
arrow-paradox             642 plays                              517 lands
undistributed-middle      627 plays                              532 lands
paralysis-of-analysis     318 plays                              285 lands
achilles-and-the-tortoise 205 plays
quagmire-of-doubt         187 plays
discards: 0 across the board — the policy plays literally everything it draws
```

util=100%, H=0.89 — no dead cards *within* the preset, and that is the damning part:
perfect utilization with zero discrimination is the signature of a deck with no
decisions. Everything is always worth playing, so nothing is ever *chosen*.

---

## 3. Identity as played, and the nearest neighbor

**As flavored:** "the puzzle deck — read the telegraph, strip exactly the right rungs,
punish what you deny."

**As played:** an *affliction deck with an unusual tick condition*. BACKFIRE is
functionally a DoT whose tick trigger is "a phase resolved while we had stagger out" —
and since stagger is always available and always worth playing (flat 2 rungs, income
≈ 2-3 rungs/turn), the condition is always true, so it just ticks. Stack intensity,
wait, top up when a duration lapses. That is erosion's loop with worse numbers and no
detonation. **Nearest neighbor: affliction (`erosion`)** — right down to both decks
ending every fight on the same `sig-conviction-strike` poison. The deny layer, which
should be the differentiator, produces zero measurable decisions: the baseline's
greedy-vs-blind gap is 0pp at every stage, and this deck's one information card
(arrow-paradox `lock_stance`) leans entirely on a read mechanic the data says is worth
nothing.

**Where the player genuinely thinks** (all of it in the signature layer, none in the
deck): budgeting Conviction between Overwhelming Argument (8◆, backfire i5) and
Conviction Strike (7◆, the actual win condition), and — weakly — holding
paralysis-of-analysis for a boss phase. That's it.

**Autopilot everywhere else:** play every card drawn (0 discards in 150 fights),
stagger regardless of what the telegraph shows (zenos: 939 bottom plays, 0 status
lands, no damage contribution), re-apply red-herring on every mind die (1031 casts),
never choose *which* phase to deny because you can deny essentially all of them.

**The setup→payoff arc:** absent. The mid transcript shows the deck stumbling into a
deny→crack→avalanche rhythm, but there is no spike the player *causes* — no RUPTURE
moment, no REAP, no Peroration. Backfire at full stack is a bigger drip, and a drip
crescendo is still a drip.

---

## 4. What is missing

1. **A kill path that belongs to the deck.** dom=100% signature in 11/11 cells. The
   in-deck ceiling is (10×1 + 10×3) × 2-3 rungs ≈ 80-120/phase *at full double-cap*,
   which takes 4+ phases to assemble — vs 570 HP mid enemies and 1,000+ late. The deck
   is a damage *chassis* for the poison signature.
2. **A reason to choose which blow to deny.** Telegraphs carry a flat
   `THREAT_RUNGS = 2` (boss 3, effects.ts:127-128). Every phase is the same size, so
   denial is never triage, only throughput. Compare Slay the Spire, where the entire
   control decision is "this intent is 8×2, that one is a buff — block *this* one";
   or Spirit Island, whose invader stages make the *shape* of the incoming turn the
   whole read.
3. **A cost to denying.** Full denial is strictly dominant: it maximizes backfire
   (full-rung payout on hindered, engine.ts:2303) AND zeroes incoming damage AND
   feeds achilles draw. Offense and defense point the same direction, so there is no
   tension axis at all. (`bossRungGrowth`, engine.ts:2447-2454, taxes fight-long
   denial — but invisibly, and a tax is not a choice.)
4. **Eyes.** The dossier's own theme table lists FORETELL as a control family utility;
   the preset contains **zero** scouting effects. The deck whose fantasy is "counter
   the telegraphed blow" cannot see telegraph magnitude and must buy stance reveals
   from the 1◆ signature like everyone else.
5. **Legibility of its own output.** BACKFIRE damage (542 in the rawhead fight) is
   attributed to no card; `sig-overwhelming-argument`'s description claims the enemy
   "turns to stone and loses its turns" when the effect is a per-rung drip
   (combat.signature.ts:46-49) — flatly false copy on the theme's own capstone;
   quagmire's standing -1 rung and the wasted-overstack rule (staggerRungs consumed
   each phase, engine.ts:2466) happen entirely off-screen.

---

## 5. Card-level findings

| card | finding |
|---|---|
| zenos-half-step | The ×4 common is a null card: 0 status lands in 939+ bottom plays, no damage path, and a FREE guard 2 against mid slams of 152. It exists to convert dice into stagger the player never has to think about. |
| red-herring | The workhorse (functional), but its `dieBonus: { onColor: 'mind' }` is vestigial — the card IS mind, so under the color law every legal die matches (dossier §4 "near-vestigial"; same disease as the whitelisted tu-quoque). |
| arrow-paradox | `lock_stance` monetizes the hidden-stance read, which the baseline measured at exactly 0pp of win rate (greedy=blind). A card whose text is "gain information" in a game where information is currently worthless. i1 backfire rider is a rounding error. |
| paralysis-of-analysis | Tagged `'payoff'` (cards.library.ts:744) but it is a *bigger faucet*, not a payoff — nothing is consumed, nothing spikes. Its acute stack expiring unrefreshed is what let rawhead's 152-damage phase through; the card creates the deck's only tension *by accident of duration bookkeeping*. |
| achilles-and-the-tortoise | Draw-per-denied-turn compounds the deck's real problem (hand-dump autopilot) rather than rewarding a scarce achievement — in 2-5 round fights it is a minor top-up on a hand that already plays everything. |
| quagmire-of-doubt | Mechanically the strongest card in the deck (permanent -1 rung ≈ a free stagger every phase) and completely illegible in play — no event narration distinguishes its rung from your staggers. |
| sig-overwhelming-argument | (Signature, control-kind) i5 backfire in one press outmuscles the deck's entire common/uncommon suite; description text is wrong about what it does. |

---

## 6. Prior art (KB cross-reference)

- **Dawncaster — Stagger** (`kb/KnowledgeBase/DigitalCardGames/dawncaster/keywords/stagger.okf.md`):
  "At the start of your turn, take damage equal to half of your Stagger, then reduce
  your Stagger by an equal amount." A self-*emptying* punishment pool: it pays out and
  drains, creating a visible pulse. Axiomancer's BACKFIRE is a static multiplier that
  sits at i10 forever — no pulse, no drain, no moment. 17 Dawncaster cards build around
  that draining pool (`cards.csv`, e.g. Aftershock, Battle Brawler).
- **Dawncaster — Dazed → Stunned ladder** (`keywords/dazed.okf.md`, `stunned.okf.md`):
  a countdown affliction that *converts* into hard denial at zero, with an escape valve
  ("Reliable cards can still be played"). Prior art for making rung-stripping a visible
  ladder with a threshold state, and for denial with counterplay.
- **Spirit Island — Fear/Terror** (`kb/KnowledgeBase/BoardGames/games/spirit-island/rules/scoring-endgame.okf.md`):
  "Fear cards create intermediate rewards and expose Terror Level dividers" — the
  canonical control-as-progress-track: every point of denial *banks toward something*.
  Also its recorded friction — "when the outcome is already decided, final turns can
  feel procedural" — is precisely standstill's late-fight texture.
- **Slay the Spire intents** (`kb/KnowledgeBase/BoardGames/games/slay-the-spire-the-board-game/`):
  variable, legible incoming-attack sizes are what make "block this turn or not" a
  decision at all. Flat 2-rung telegraphs are an intent system with the numbers filed off.

---

## 7. Proposals (decision texture, doctrine-safe, dice-law-safe)

### P1 — Variable-rung telegraphs (mechanic, L) — `ctrl-p1`
Author per-phase rung counts (1–4) into `combat.threat-sequences.ts` instead of the
flat `THREAT_RUNGS = 2` (effects.ts:127): jabs at 1 rung, haymakers at 3–4, rung count
scaling the damage weight and *displayed on the telegraph*. Stagger income stays where
it is — which means the player can no longer deny everything and must triage: eat the
jab behind FREE guard (finally giving those guard-2 lines a job), spend the round's
stagger breaking the haymaker. This is the single highest-leverage change for the
theme: it converts denial from throughput into choice, gives the read/scout layer
something to actually read (magnitude, not just color), and it sharpens every other
theme's threat phase for free. Prior art: StS intents, Spirit Island invader stages.

### P2 — TURNABOUT: a consuming finisher on paralysis-of-analysis (keyword, M) — `ctrl-p2`
The theme's missing RUPTURE-analogue. Track `rungsDeniedTotal` on encounter state
(the events already exist: `staggered`/`backfired`/deny marks in `resolveThreatPhase`).
Rework paralysis-of-analysis's PAID line: *consume all BACKFIRE stacks; deal
(per-rung total) × (rungs denied this combat), capped like RUPTURE
(max(80, 25% maxHP))*. Now denial is a bank, backfire stacks are fuel instead of
furniture, the player must choose *when* to cash (cashing strips your drip — real
tension), and the deck finally owns a kill that isn't `sig-conviction-strike`.
Dawncaster's self-draining Stagger and Spirit Island's fear track are the pedigree.

### P3 — Zeno's FREE line lays notches (card, S) — `ctrl-p3`
Kill the deck's worst weak-chip fork on its ×4 common. zenos-half-step FREE becomes:
*Notch 1 (a half-rung; two notches remove 1 rung at the next threat resolve)*; PAID
becomes STAGGER 1 + guard 2. Two FREE plays now assemble one real rung of denial —
dieless plays that *lay foundation for* the PAID plan, exactly the owner's stated
target for the FREE/PAID rework, and flavor-perfect Zeno (you never arrive, you halve).
Directly reduces the "guard 2 vs a 152-damage slam" absurdity by giving the card a
theme verb instead of a token shield.

### P4 — Give the deck its eyes: red-herring FREE = expose the telegraph (card, S) — `ctrl-p4`
Replace red-herring's FREE `draw 1` with *reveal the current telegraph's stance and
rung count* (the dossier already lists FORETELL as control family utility; the preset
ships none). Blind players currently stagger by rote; with P1's variable rungs this
FREE line becomes the setup half of the theme's core loop — look, then decide what to
deny — and it costs no die, so the fork is "free information that feeds the paid
answer," not a chip.

### P5 — Attribute the drip; stop the capstone lying (ux, S) — `ctrl-p5`
(a) Attribute `backfired` damage proportionally to the cards whose stacks fed it
(`recordAttribution` already exists; the event carries amount + rungs, engine.ts:2308)
so a control player's postmortem stops reading "Red Herring: 0 dmg". (b) Fix
`sig-overwhelming-argument`'s description ("turns to stone and loses its turns" → what
it does: heavy BACKFIRE). (c) Surface the existing deny forecast (`getDisruptStatus`,
engine.ts:3093-3106 computes `willDeny`) and quagmire's standing rung on the telegraph
UI, plus a "wasted stagger" cue when staggerRungs exceed rungsTotal (they're consumed
each phase, engine.ts:2466). The theme's entire output is currently invisible; you do
not get anticipation for a payoff nobody can see.

(Tuning note rather than proposal: whatever else happens, standstill's 100/99 early/mid
is a signature-kit finding, not a deck finding — Conviction Strike will hold any
preset's hand to the same numbers, and the doubled ◆ income under the new dice law is
accelerating it. That fix belongs to the signature/economy auditor, but no control
rework can be judged until the poison button stops winning the fight first.)

---

## Appendix — raw outputs

Early matrix (sim 3): 6/6 cells 100% win, rounds 1.6–2.8, statusEng 54–58%,
dotFrac 17–33%, dom 100% sig-conviction-strike, vic=180 def=0.
Mid matrix (sim 4): 100/100/100/100/97, rounds 4.2–5.1, statusEng 52–55%,
dotFrac 32–56%, dom 100% sig-conviction-strike, vic=149 def=1.
State-logs: `scratchpad/standstill-early-s3.jsonl`, `scratchpad/standstill-mid-s5.jsonl`
(4 and 12 records respectively; per-phase extracts quoted in §2).
Coverage-metric caveat: `--cards` "eligible cards" counts the stage pool (18/61), not
the fixed preset, so its "dead-card rate 89%/90%" headline is a harness artifact here;
within-preset utilization was 100%.
