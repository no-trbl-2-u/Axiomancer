# Card price — what to compare it to — 2026-07-17

## Surface question

"What should we be comparing card price to in order to increase engagement,
card usage, and keep the avg rounds until win/lose from getting too high?"
(pointing at `scratch/price-experiment/`, the kb References corpus, and the
deckbuilder-comparison findings)

## Better question surfaced

The price-experiment already proved `scoreCard` price is not a win-rate dial
(three-regime result: ceiling early, linear mid, walled late; alt-win decks
ranked backwards). So the real question is not "what does price predict" but
**"what is the unit a die-spend buys, and which courts judge it?"** The
binding resources are dice-per-round (fixed at 1/PAID) and rounds-survived
(the death clock) — so price denominated in HP-magnitude is denominated in
the wrong currency. Price should be denominated in **rounds** and judged by
**usage × win-conversion × engagement** within a stage's fight window.

Measurement context: baseline bf0d3712 (measured 2026-07-17, reduced-nightly
confidence) is STALE by one mechanics commit (8ceb86e5 enemy archetypes +
variable-rung telegraphs) — the experiment's fight-length distributions
predate the new enemy archetypes; re-run before trusting fine-grained cells.

## Prior art consulted

- **Slay the Spire — pick rate × win-correlation (kb:References/deckbuilding/balance-methodology.okf.md, src-001):**
  Mega Crit's two core balance metrics were how often a card is taken when
  offered and how often it appears in winning decks; cards with very low
  pick rates were treated as non-functional and redesigned
  (kb:References/deckbuilding/deck-economy-thinning-and-bloat.okf.md,
  src-004). This is the usage court the experiment lacks.
- **MTG — mana curve / goldfish clock:** a card's value depends on the turn
  it lands relative to the format's clock; testers "goldfish" decks against
  a non-interactive opponent to measure rounds-to-kill. The Millstone /
  Hourglass temp enemies in `proposed/temp-enemies.ts` are exactly
  goldfish-clock positive/negative controls. (Memory read, not KB; no clean
  reception citation — wish filed.)
- **Hearthstone — vanilla test:** baseline stat-per-mana yardstick used to
  cost new cards ordinally before playtest. Analogous to VERB_POINTS as a
  lint, not a predictor. (Memory read; wish filed.)
- **Dominion — Big Money baseline:** every card is judged against the
  tempo of the simplest possible deck; "does it beat Big Money's clock" is
  the acceptance test. Round-budget thinking, not magnitude thinking.
  (Memory read; wish filed.)
- **Doctrine cross-check:** status engagement is the primary fun metric
  (CLAUDE.md 2026-06), but FINDINGS shows Bastion has the highest
  engagement (0.44–0.47) and near-worst mid win-rate — engagement and
  conversion must be banded jointly, neither alone.

## Design directions on the table

### Option A — Present-value pricing (discount by the death clock)

*(inspired by MTG mana curve + the experiment's own gap mechanism)*

Keep VERB_POINTS magnitudes, but multiply every line's contribution by
P(fight still live at round r) taken from the per-stage baseline
fight-length distribution. A DoT that delivers rounds 5–8 prices near-zero
for late (fights end ~4.06) and full for mid. Price becomes stage-banded:
one card, three present values. The pricing lint compares rank bands against
the stage the card is aimed at.

**Trade-off:** pricing now depends on measured distributions → circular
coupling with tuning (retune enemies, all prices move); needs the baseline
to be trustworthy and fresh.
**Telltale failure mode:** pricing lint oscillates between runs because the
discount curve is noise (seeds=2-class problem) — prices must pin to the
committed baseline stamp, not ad-hoc sims.

### Option B — The die-spend court (usage-first, price as lint only)

*(inspired by Slay the Spire's pick-rate axis)*

Demote `scoreCard` to an authoring lint (ordinal, within-theme). Promote
three empirical per-card axes into BALANCE_LEDGER: (1) **die-spend share** —
how often the PAID line is bought with a die when the card is in hand at
equal opportunity; (2) **win-correlation** — presence in winning runs per
stage; (3) **engagement contribution** — status ticks/payoffs traceable to
the card. The comparison the user asked for is *price vs die-spend share*:
at equal price, equal opportunity should buy roughly equal spend; the
divergence list (high price + unspent PAID line = trap; cheap + always spent
= gem/undercosted) is the tuning queue. Requires fixing the draft scorer
that starves new/sandbox cards (CRITIQUE.md finding).

**Trade-off:** heavy harness instrumentation; the blind policy's spend
choices ≠ human choices, so policy artifacts can masquerade as dead lines.
**Telltale failure mode:** a card the policy never casts flagged "dead" that
playtesters love (policy-validity gap) — needs the qualitative
`/combat-playtest` agents as a cross-check.

### Option C — Round-budget pricing (one currency: fraction-of-a-win per die)

*(inspired by Dominion Big Money clock; fixes alt-win blindness structurally)*

Ratify a per-stage round budget (e.g. early resolves ≤3, mid ~5, late ~6 ±1
— exact numbers to be ratified as doctrine). Reprice every line in the same
unit: **expected fraction of a win delivered inside the budget, per die**.
HP lines = expected HP inside window ÷ enemy HP. SWAY lines = SWAY inside
window ÷ capitulate threshold. Premises ÷ 8 for concede. Survivability =
rounds added to the death clock × the marginal win probability per round.
Grace/Foundry/Oratory engines stop pricing at ~0 because capitulate/concede
progress is now the same currency as damage.

**Trade-off:** a real rework of `cards.pricing.ts`; needs per-win-path
conversion models and stage-dependent enemy HP/resolve norms; the "1 pt ≈
3 HP" mnemonic dies.
**Telltale failure mode:** alt-win conversion factors miscalibrated so
Grace swings from invisible to dominant in the lint while sims disagree.

Composability note: C is the destination, A is its discounting mechanism,
B is the court that keeps any model honest. B can ship first (it changes no
game code), then A/C recalibrate against B's evidence.

## Decision / leaning

Still open. Session's framing answer: **compare price to the clock, not the
magnitude** — the denominator is rounds (stage fight window), and the courts
are die-spend share × win-correlation × engagement contribution. Win rate
alone is only a within-deck, within-stage check (the experiment's own
verdict).

## Open questions

- What is the pricing model *for* — authoring lint or balance predictor?
  (Decide before re-engineering; the experiment only killed "predictor.")
- Is the late wall an enemy problem (death clock) rather than a card
  problem? Millstone/Hourglass probes are the designed controls — run them
  before repricing anything.
- Are alt-wins first-class in the price currency, and is SWAY "status" for
  doctrine-engagement purposes (Grace posts statusEngagement 0.00)?
- What round band per stage is *doctrine* — is a ~4-round late fight lethal
  pressure (feature) or engine suffocation (bug)? If engines need 5–6
  rounds to be fun, either enemy output or engine maturity must move.
- Noise floor: minimum seeds/runs so a ±5 pt win-rate delta is signal
  (seeds=2 flagged repeatedly in FINDINGS).
- Policy validity: would a theme-aware policy (plays engines properly)
  change the three-regime story, especially penitent's non-monotone wobble?
- Baseline staleness: re-run the ladders post-8ceb86e5 (enemy archetypes)
  before ratifying any of A/B/C.

## Raw notes

- The experiment's fix-card test is the proof-of-concept for A/C: +0.5
  avgSpell aimed at the tempo axis bought +12 pts mid and >2x late — price
  converts when it buys the axis that wins fights.
- Deckbuilder-comparison tie-in: the deck-economy envelope (deck size,
  dilution, removal) changes cycle rate and therefore every present-value
  calculation — Phase B (ratify the envelope) is upstream of final pricing
  constants; don't calibrate C's conversion factors on a 15-card assumption
  the building layer will break.
- kb wish filed: costing benchmarks (mana curve/goldfish, vanilla test, Big
  Money) with reception evidence.

## Addendum (same day) — spec 33 Upgradeable Dice impact

Read after `4adf7266` (D1 review landed) and `1927b15e` (phase 36b shipped
Option A's mechanism: DOT_TEMPO_SURVIVAL^(r-1) = 0.75 discounting calibrated
to the OLD dice model's ~4.06-round death clock).

What survives: price ≠ dial; alt-win blindness; the three courts;
price-per-die as unit (strengthened — the only invariant once face quality
varies per player).

What changes:
1. All price-experiment numbers are historical — throughput ~1 → ~1.83 paid
   plays/round + 8.3% whiff; fight-length distributions shift; 0.75 must be
   re-derived at D3/D4 (spec §7/§8 already sequence this). Re-run the
   experiment BEHIND D2/D3, never before.
2. New unpriced axis: stance steering (punishes ×1.5 / yields ×0.5 +1◆).
   Cards carry survivability value via printed color — the death clock is
   now purchasable through play. Decide: priced like text, or positional
   like MTG color (leaning positional; courts then need a color-fit column
   to de-confound win-correlation).
3. Momentum chain makes card value sequence-dependent (surge = temp gold
   die); static price blind by design; usage metrics gain sequencing
   artifacts; engagement gains an axis statusEngagement can't see.
4. Die-spend court opportunity redefinition: condition on color-matched or
   gold usable die present (~67% access); OVERHEAT + whiffs are confounds.
5. Second economy: HONE/TEMPER face upgrades → win-curve doctrine and price
   calibration conditional on assumed face-upgrade state per stage; courts
   need stock vs upgraded cohorts. Phase-B envelope question expands to a
   dice-face envelope.
6. Policy validity upgrades to a BLOCKING gate: the bot must steer stances,
   sequence momentum, judge OVERHEAT before post-D3 measurements are
   trustable.
7. Millstone/Hourglass probes need stance-check fields (incl. a no-check
   control) or they test the retired model; leaner ◆ economy (≈1.33/round,
   Press Fate 1◆ sink) forces re-audit of the sig-conviction-strike
   dominance finding.

Question-list deltas: #1 unchanged/more urgent (36b committed to calibrated
lint → recalibration debt per substrate change); #2 gains "player-steering
problem" as a third answer; #3 re-opens under 2x throughput; #6/#7 become
gates; #8 becomes twin envelopes (deck + dice faces).
