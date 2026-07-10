# THEME AUDIT — FORGE (preset: `foundry`) — "Manufacture dice from nothing"

Auditor: mechanics-expert (SNOB lens), 2026-07-10. One theme, played, not spreadsheeted.
Sims: 5 invocations (2 auto transcripts early w/ state-log, 1 auto transcript mid w/ state-log,
2 playtest matrix cells with `--cards`). Dossier + baseline assumed read.

**Verdict up front:** Forge is the roster's most mechanically *original* theme and its most
experientially *hollow* one. The fantasy is Dice Forge by way of Aeon's End — manufacture your
own mana, temper it, spend it all in one overwhelming stride. What the transcripts show instead
is a Conviction battery: three of the theme's manufacturing paths overflow into `+1◆`, the
signatures do the actual killing, and the "one overwhelming turn" detonates for **18 damage on
turn 1** because nothing on the payoff card tells anyone — player or policy — what "charged"
means. Distinct on paper: 7/10. Distinct as played: it plays like a budget Harvest with the
souls renamed to pips and the scythe capped at a fraction of REAP's ceiling. Engagement: 3/10.
And it fails the owner's mid-curve doctrine catastrophically: **5% mid win rate against a ~50%
target** — the inverse failure of `refrain`/`standstill`, and not yet pinned in
`KNOWN_CURVE_VIOLATORS`.

---

## 1. What was played

- `npm run combat -- --auto --policy status --stage early --deck preset:foundry --seed 3
  --max-turns 14` (default enemy Little Belle 40 HP — victory, 2 phases) and the same with
  `--enemy the-butcher` (95 HP elite) plus `--state-log`, which yields a full per-event
  transcript (the baseline's "no auto transcript" gap is real for stdout, but `--state-log`'s
  final `log` array is a complete turn-by-turn record — 437 events for the Butcher fight).
- `npm run combat -- --auto --policy status --stage mid --deck preset:foundry --seed 5
  --max-turns 14 --enemy rawhead-rex` (570 HP) — **defeat, enemy at 512/570** after 3 phases.
- `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:foundry --runs=30
  --seed=1 --cards` and the same at `--stage=mid`.

**Harness caveat carried from baseline, now with a mechanism:** `autoPlayPhase`
(`src/CLI/combat.cli.ts:263-329`) loops player turns inside ONE threat phase up to
`maxTurns * 6` (= 84) iterations; the threat only resolves when the loop exits
(`combat.cli.ts:510-514`). The interactive loop resolves the threat after *every* player turn
(`combat.cli.ts:472-481`). So auto transcripts show the player taking **60+ free turns per enemy
action** — the Butcher fight log runs `ROLL turn 1` through `ROLL turn 62` before the first
`threat-fired`, during which the turn-1 Kindling Ember never ticked once (DoT ticks live in
`processBetweenPhases`, which is threat-gated). Auto-mode numbers are therefore grossly
player-favorable; the playtest matrix (its own sim loop) is the trustworthy quantitative
witness. **This is a tooling bug worth its own work item** — it makes every `npm run combat
--auto` reading a fantasy.

---

## 2. The seven cards as printed (`src/Cards/cards.library.ts:335-492`)

| card | rank | stance | FREE line | PAID line |
|---|---|---|---|---|
| sketch-of-a-thought | C1 | mind | draw 1 | KINDLE mind (→Reserve), ember i1 d3 (1/rnd DoT), dieBonus mind: +1 intensity |
| half-step | C2 | body | guard 2 | guard 5 + PIP ×2 (ripens Reserve dice) |
| bootstrap-loop | U1 | mind | **+1◆** | TRANSMUTE dead X → WILD floating die; threshold mind×2: +1 pip |
| ex-nihilo | U2 | mind | **+1◆** | FORGE wild floating die + bank own powering die; threshold mind×3: +1 pip |
| the-overtake | R | **body** | guard 2 | spend ALL pips (+1 guard each) + RUPTURE (3.5 fuel/pip, +50%) + refresh die |
| anvil-of-form | R-ench | mind | timed 3-rnd | permanent: every kindled/floating die arrives +1 pip |
| entropy-tax | R-disench | mind | timed 3-rnd | permanent: every kindled/floating die spent MARKs the enemy |

Engine facts that govern the arithmetic (verified):
- KINDLE goes to **Reserve, not the tray** (`combat.engine.ts:1746-1760`); Reserve cap 2, at cap
  the kindle *becomes +1◆*. FORGE at float cap 3 *becomes +1◆* (`engine.ts:1709-1711`).
  TRANSMUTE with no X or at cap *becomes +1◆* (`engine.ts:1730-1732`). Three manufacturing
  verbs, one shared failure mode: the universal currency.
- `RESERVE_PIP_CAP = 2` (`combat.dice.ts:106`), `RESERVE_MAX = 2`, `FLOATING_DICE_CAP = 3`;
  floats never ripen (only Reserve does, `engine.ts:2753`). `grant_pip` silently no-ops on an
  empty Reserve (`engine.ts:1763`) and at the pip cap.
- Therefore the **theoretical maximum pip bank ≈ 7** (2 Reserve × 2 pips + 3 anvil'd floats × 1),
  realistic ~3-4. The Overtake at 4 pips: 14 fuel × 1.5 = **21 damage** plus pending-DoT fuel —
  and it *consumes the deck's only DoT (the ember) to get it*. RUPTURE cap is max(80, 25% maxHP);
  Forge's own engine cannot come within half of its own cap. The cap was reached exactly once in
  my transcripts — fueled by 60 turns of *signature* poison/backfire stacks, not by anything the
  deck did.

---

## 3. As played: the transcript evidence

### Early, the Butcher (95 HP), seed 3 — "Victory," and an indictment

Turn 1 is genuinely nice — the self-reinforcing chain doing its doctrine job:

```
ROLL turn 1: x,wild,wild → DRAFT wild
PLAY sketch-of-a-thought [PAID die=t1-d1]  → FORGE forge-1-8 mind -> reserve
  → effect debuff_kindling_ember i1 → die refreshed t1-d1
PLAY entropy-tax [PAID die=t1-d1] → die SPENT
```

Turn 2-3: ex-nihilo and anvil-of-form dumped as FREE lines (drafted die was body, they are
mind — the color law strands the engine's enablers), half-step ripens forge-1-8 to 2 pips,
second half-step ripens **nothing** (pip cap already hit; `grant_pip` silently wasted).

Then the fight's true face — **turns 4 through 62 contain zero card plays.** Fifty-nine
consecutive turns of `DRAFT → +◆ → (every ~3rd turn) SIG Overwhelming Argument / Conviction
Strike`. The kill: at turn 63 the hand refills, a second sketch lands ember i2, and

```
PLAY the-overtake [PAID] → pips-cashed 3 → RUPTURE 80 (cap)
  consumed=[debuff_kindling_ember, debuff_backfire, debuff_poison]
```

Attribution: Conviction Strike 544 DoT, Overtake 80, sketch 15. **The deck contributed under
15% of the damage in its own showcase win.** (Auto-harness distortion inflates the signature
share, but the playtest matrix corroborates the direction: `dom=62% sketch-of-a-thought`, and
sketch is the only card in the deck that lands a status at all.)

### Mid, Rawhead Rex (570 HP), seed 5 — the engine detonates itself on turn 1

```
PLAY sketch-of-a-thought [PAID] → FORGE forge-1-9 mind -> reserve
PLAY sketch-of-a-thought [PAID] → FORGE forge-1-14 mind -> reserve
PLAY the-overtake [PAID] → RUPTURE 18 consumed=[debuff_kindling_ember]
```

The rank-5 Axiom finisher, played on turn 1 with **zero pips banked**, for 18 damage against
570 HP, eating the deck's only DoT to do it. No gate, no preview, no reason not to — the card is
*legal* at zero charge and nothing distinguishes an empty Overtake from a full one. Then phases
2 and 3, verbatim shape:

```
PLAY sketch-of-a-thought [FREE]   ← draw 1
PLAY entropy-tax [FREE]           ← 3-round timed instance
PLAY half-step [FREE]             ← guard 2
PLAY ex-nihilo [FREE]             ← +1 conviction
PLAY ex-nihilo [FREE]             ← +1 conviction
PLAY bootstrap-loop [FREE]        ← +1 conviction
PLAY anvil-of-form [FREE]         ← timed instance
SIG Overwhelming Argument ×20...
```

Every single play FREE (mind cards, wrong-color dice), every FREE line a token drip. The two
kindled dice ripened to 2 pips each after phase 1 — **and were never cashed**; the Overtake was
already in the discard. Player dealt 58 total damage in 3 phases and died. This is the owner's
FREE/PAID complaint in its purest specimen: when the color law starves a mono-mind deck
(P(no mind/wild in 3 dice) ≈ 30% per turn), the entire deck degrades to `draw 1 / guard 2 /
+1◆ / +1◆` — a hand of lint.

### The matrix (blind, 30 runs/cell, seed 1)

| stage | win | doctrine | statusEng | dotFrac | rounds | dom |
|---|---|---|---|---|---|---|
| early | **90%** (king-of-revenge cell: 40%) | ~80% | **26%** | 39% | 2.6 | sketch 62% |
| mid | **5%** (four 0% cells; tri-eyes 23%) | ~50% | **26%** | 51% | 4.0 | sketch 63% |

Per-card usage (mid): half-step 971 plays / **0 statusLands**; sketch 939 / 877; bootstrap 524 /
27; ex-nihilo 521 / 25; overtake 250 / 0; anvil 172; entropy-tax 161. All seven cards see play
(util 100%, H 0.90) — no dead cards by usage, but half-step is the most-played card in the deck
while contributing nothing the doctrine counts, and statusEngagement 26% is *a third* of the
early-stage policy-pick average (66%, baseline §1a). Under a doctrine whose first sentence is
"status effects are THE fun," Forge is the theme that structurally opts out: **one status card
in seven.**

Note also the coverage line in the playtest output ("2/18 eligible cards exercised") directly
contradicts its own usage table (7/7 played) — the metric counts the stage-eligible pool, not
the requested preset. Minor harness mislabel, worth a fix so future audits don't misread it.

---

## 4. Identity as played, and the nearest neighbor

**As flavored:** manufacture dice from nothing, temper the pips, one overwhelming stride.

**As played:** a Conviction battery with a firecracker. Kindle overflows to +1◆, forge-at-cap
overflows to +1◆, transmute-fallback is +1◆, two FREE lines are printed +1◆ — five separate
paths converge on the universal signature currency, and the fights are decided by Overwhelming
Argument and Conviction Strike (90%+ of damage in every transcript). The theme's verbs feed the
*generic* kit, not the theme's own payoff.

**Nearest neighbor: harvest (`tithe`).** Identical skeleton — accumulate a counter (Souls ≙
pips), spend it on a printed burst (REAP ≙ spend_all_pips→RUPTURE), with an enchant that
accelerates accrual (bone-orchard ≙ anvil-of-form). But Harvest's bank is fed by the doctrine
loop itself (afflictions expiring — every soul is a status that lived), its REAP cap is 200+,
and its counter is a visible number. Forge's bank is fed by *not playing the game* (holding
dice), caps at ~7, and lives in pips nobody can read. Forge is Harvest with the fun currency
swapped for an accounting currency.

**Setup→payoff arc:** exists on paper, does not land in play. The spike the fantasy promises
("every saved step spent in a single stride") arithmetically tops out at ~21-40 while the shared
RUPTURE cap sits at 80+ — the one time the transcripts hit the cap, signature statuses paid for
it. There is no felt spike; there is a poot.

---

## 5. Where the player thinks — and where it's autopilot

Genuine decisions, as designed (mostly invisible in practice):

1. **True-color vs wild on sketch** — the dieBonus (`onColor:'mind'`, engine.ts:1300-1308) only
   fires on a literal mind die, not wild (confirmed: turn-1 wild-powered sketch landed i1, no
   bonus). A real microdecision — worth +1 ember intensity, i.e. nearly nothing.
2. **The Reserve gamble** — bank a die, ripen it through telegraphs (engine.ts:2753 "Holding a
   die through a telegraph is the gamble"). This IS the theme's decision. Cap 2 pips means the
   gamble maxes out at +14 rupture fuel, and there is no bust condition — it's a riskless
   savings account with a 2-coin limit.
3. **When to Overtake** — the one question the theme should pose every turn ("cash now or one
   more phase?"). Illegible: no charge preview, no gate, playable at zero. The status policy
   detonated it turn 1 for 18; a human without a spreadsheet would do little better.
4. **Cross-color timing** — the finisher is BODY while the engine is mind; the cash-out turn
   needs a body/wild die (or an ex-nihilo wild float — which is clearly the *intended* line:
   forge your own guaranteed detonator). Genuinely clever design, never surfaced anywhere, and
   no sampled policy ever executed it.

Autopilot, cited:
- Butcher fight turns 4-62: 59 turns, zero card plays, draft→bank→signature. The deck spectates.
- Mid fight turn 1: finisher detonated empty (RUPTURE 18, consumed its own ember).
- Mid phases 2-3: seven consecutive FREE plays of token drips, then signature spam.
- half-step: 971 plays at mid, 0 statusLands, silently no-ops at pip cap / empty Reserve —
  the most-played card in the deck is filler that cannot even waste loudly.

---

## 6. What is missing (with prior art)

1. **A payoff worth anticipating.** Aeon's End's charge tokens work because the ability is
   *worth the wait* and the charge track is public (KB:
   `BoardGames/games/aeons-end/rules/actions.okf.md` — "Unique mage abilities use charge tokens,
   creating delayed payoff and role identity"). Forge's delayed payoff is smaller than one
   Conviction Strike. The keyword-atlas already flags "pip engine lacks an uncapped spender" as
   a late wall; it is in fact a mid wall — 5% mid is this, measured.
2. **Tension in the accumulation.** Quacks of Quedlinburg is the KB's model for making
   *accumulation itself* the thrill — press-your-luck with a public bust condition (KB:
   `the-quacks-of-quedlinburg/scout-report.okf.md`, reception praising "press-your-luck
   tension"). Forge's accumulation is passive interest with a cap. Nothing can go wrong,
   therefore nothing is exciting.
3. **Any relationship with the enemy.** Every other theme reads, staggers, sways, or reflects.
   Forge is pure solitaire — no card looks at the telegraph, the stance, or the enemy's board
   beyond "afflictions exist to be ruptured." Dawncaster's Attune (KB: `dawncaster/keywords.csv`
   — "attune to a random Element; Attunements empower Actions that share their type") shows a
   color-law economy where matching is an earned state, not a die-roll tax.
4. **FREE lines that build the engine** (the owner signal, biting hardest here). Five of seven
   FREE lines are `draw 1 / guard 2 / +1◆ / +1◆ / guard 2`. In the theme whose identity is
   *manufacturing*, the FREE lines manufacture nothing. Dawncaster's Momentum (KB:
   `dawncaster/keywords/momentum.okf.md` — small stacks that auto-convert at 5 into a draw)
   shows the shape: every small play feeds a visible counter that pays off by itself.
5. **A win-rate curve.** 90% early → 5% mid is not "decay," it is a cliff one stage early.
   Foundry needs to be *added* to the curve-violator watchlist and tuned upward at mid — the
   opposite direction from `refrain`/`standstill`.

---

## 7. Card-by-card verdicts

| card | verdict |
|---|---|
| sketch-of-a-thought | Carries the deck (62-63% dom) because it is the only status card. Ember i1 (1/rnd, mind-resisted DR10) is the entire DoT budget of the theme. Overworked, underpowered. |
| half-step | Most-played, least-meaningful. `grant_pip` no-ops silently at cap/empty-Reserve; the card cannot tell you it did nothing. Filler with a UI honesty problem. |
| bootstrap-loop | Best design in the deck (TRANSMUTE X→wild float = dead fate turned live) — and its FREE line is a printed +1◆ drip. Was on the baseline's never-played list under policy-pick; inside its own preset it earns its slot. |
| ex-nihilo | The intended detonator-enabler (wild float beats the color law on cash-out turns). No policy ever executed the line; FREE +1◆ drip. |
| the-overtake | The payoff, and the problem: legal at zero charge, no preview, capped below relevance, eats its own ember. 250 plays, 18-80 damage range, one felt spike in five sims. |
| anvil-of-form | Multiplies with everything and matters against nothing — +1 pip into a 2-pip cap and a 3.5/pip spender is +3.5 damage per die. Fine card, starved by the caps around it. |
| entropy-tax | The quiet glue (manufactured spends → MARK → amplifies ember + rupture-per-stack). With ~3-5 manufactured spends a fight it moves single digits. Right idea, wrong magnitude. |

No dead weight by usage — the preset is self-consistent. The weight is dead by *consequence*.

---

## 8. Proposals (decision texture first; all respect the locked dice law + doctrine)

### P1 — FREE lines forge; drips die (owner signal, direct hit) — **M**
Rewrite the FREE lines of the four engine cards to be small *engine verbs* instead of currency:
- sketch-of-a-thought FREE: **KINDLE mind** (no ember, no draw) — the free play IS a die.
- half-step FREE: **PIP 1** (and extend PIP to be spendable on floating dice, which currently
  never ripen — a float you've pipped is a charged detonator you chose to build).
- bootstrap-loop FREE: **TRANSMUTE** (the actual mechanic; +1◆ only as its printed fizzle).
- ex-nihilo FREE: **bank your next spent die this turn** (mini `bank_spent_die`).
The color-starved turn (30% of turns for this deck) becomes "which piece of the machine do I
build for free," not "which drip do I sigh through." Rationale: mid transcript phases 2-3 —
seven FREE plays, zero foundation laid. This is the exact fork the owner wants killed, solved
theme-locally without touching the dice law.

### P2 — OVERHEAT: uncap pips behind a bust condition (the Quacks move) — **M**
Theme-scoped keyword: Reserve dice may ripen past `RESERVE_PIP_CAP`; each pip beyond 2 makes
the die **volatile** — if an enemy threat resolves undenied/unblocked while you hold a volatile
die, the die bursts: lose it and take its pips as damage. Every phase now asks the theme's
defining question out loud: *cash the stride now, or hold the metal in the fire one more
round?* Pairs with half-step's guard line (guard = insurance for your overheating dice —
suddenly the defensive C2 is a strategic card). Uncaps the Overtake's fuel (6-8 pip strides →
~35-50 pre-DoT, approaching its own cap honestly) and gives the 5% mid rate a lever that
scales with player skill rather than with flat numbers. Prior art: Quacks' bust tension (KB
reception: press-your-luck is the praised core), Dicey-style volatile dice.

### P3 — The Overtake: charge gate + printed preview (UX) — **S**
Two changes: (a) the PAID line requires **2+ pips spent** or it fizzles (explicit event, card
stays in hand — protects players and policies from the turn-1 detonation-for-18); (b) the card
face shows live burst math: "would detonate for N" (pips × 3.5 + pending DoT, × 1.5, capped),
exactly as StS previews Grand Finale/Perfected Strike arithmetic. The theme's one real decision
becomes visible. Cheap, no rules change, transformative for legibility.

### P4 — Ember scales with the machine (doctrine repair) — **S**
Make manufactured-die spends the theme's DoT driver: **entropy-tax applies EMBER (kindling),
not MARK**, and sketch's ember gains +1 intensity per 2 pips spent this turn. Now operating the
engine *is* status play — statusEngagement stops being 26% by construction, the mid clock gets
a ramping DoT that survives the Overtake's consumption loop (you rebuild it by playing your
theme), and the doctrine's "fun per click" witness finally counts Forge clicks. Numbers to
taste in `/deck-tuning`; the structural point is that the theme's proprietary DoT should flow
from the theme's proprietary verb.

### P5 — Ex Nihilo chooses: flexibility or power — **S**
The forged float becomes a choice: **wild with 0 pips, or a declared color with 1 pip** (2
under Anvil). Wild remains the safe detonator for the body-stance Overtake; colored is the
greedy engine line (mind float → powers sketches/bootstraps AND fires their mind-thresholds).
Surfaces the deck's hidden mind/body tension at the moment of manufacture and makes the draft
("keep the body die for the stride, or the mind die for the engine?") interact with the theme
every single turn. Zero new rules — the choice parameter already exists in
`forge_floating_die`'s color field.

Explicitly NOT proposed: touching the 1-die rule, the color law, floats-never-bank, or the
Overtake's consume-your-own-board flavor (owner-authored, and it is good tension *once the
burst is worth it*).

---

## 9. Tooling findings (for the harness owner)

1. `autoPlayPhase` grants up to `maxTurns*6` player turns per threat phase
   (`src/CLI/combat.cli.ts:271`) while the interactive loop is 1:1 — all `npm run combat
   --auto` results are player-inflated fantasies (62 free turns vs the Butcher). Sim policies
   also cannot see pip state (`bestAutoCard` sorts by `bottomDamagePreview`, which is 0 for the
   Overtake), so no policy can ever play this theme's intended line — Forge's playtest numbers
   are a *floor*, though the human ceiling is capped by the same illegibility P3 fixes.
2. `--state-log`'s final `log` array IS the missing auto transcript (437 structured events for
   one fight) — the baseline's observability gap closes with a small formatter over it.
3. Playtest "Card coverage: 2/18" counts the stage pool, not the preset deck, contradicting its
   own per-card table (7/7 played) in the same output.
4. Foundry (90%→5%→untested) violates the starter curve at mid and is absent from
   `KNOWN_CURVE_VIOLATORS` (which only tracks *over*performers).
