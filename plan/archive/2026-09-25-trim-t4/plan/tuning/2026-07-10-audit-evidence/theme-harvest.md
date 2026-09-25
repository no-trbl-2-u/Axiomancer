# THEME AUDIT — HARVEST (preset: `tithe`) — SNOB lens, 2026-07-10

Auditor: mechanics-expert (harvest cell of the tuning-audit fan-out).
Method: 4 sim invocations on the current tree (`axiomancer-mechanics@0.37.0`):

- (t1) `npm run combat -- --auto --policy status --stage early --deck preset:tithe --seed 3 --max-turns 14` (default enemy Little Belle, 40 HP)
- (t2) `npm run combat -- --auto --policy status --stage mid --deck preset:tithe --seed 5 --max-turns 14 --enemy hasshaku-sama` (450 HP; `--enemy` passed explicitly per baseline harness caveat 1)
- (m1) `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:tithe --runs=30 --seed=1 --cards`
- (m2) `npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:tithe --runs=30 --seed=1 --cards`

Baseline caveat 2 confirmed: `--auto` emits only `hazardCombat:start`/`hazardCombat:end` —
no turn-by-turn narration exists for auto play, so per-fight claims below rest on the
outcome block + per-card attribution (which, per baseline caveat 3, counts ticks as
"phases" and does not clamp overkill; treated as ordinal).

---

## 1. The deck on paper (`cards.library.ts:924-1054`, preset `combat.deck-presets.ts:136-147`)

15 cards, recipe 4/4/2/2/1/1/1, focus `rush-execute`:

| card | slot | stance | PAID (bottom) | FREE (top) |
|---|---|---|---|---|
| brief-candle ×4 | C1 | body | BLEED i2 d1 (d2 with color match) | **souls: 1** |
| memento-mori ×4 | C2 | mind | MARK i2 d1 (d2 with match) | **souls: 2** |
| winnowing ×2 | U1 | body | consume 1 affliction → remaining fuel ticks NOW, +2 Souls | TICK |
| the-gleaners-due ×2 | U2 | mind | REAP 2 → kindle mind die (to Reserve, engine.ts:1559-1571) + draw 2 + 1 Soul back | draw 1, souls 1 |
| the-reaping ×1 | R-spell | body | REAP ALL: 4 dmg/Soul (cap `max(200, 25% maxHP)`, effects.ts:72-86) + SIPHON 40% heal | TICK |
| bone-orchard ×1 | R-enchant | mind | permanent: drain 1 HP per Soul gained (engine.ts:753-757) | same, 3 rounds |
| the-tithe ×1 | R-disenchant | mind | permanent: enemy afflictions expire 1 turn sooner (engine.ts:2511-2528) | same, 3 rounds |

Soul law: 1 Soul per enemy affliction instance that EXPIRES (engine.ts:2532-2535,
2709-2711); consume verbs grant their printed Souls at the verb (engine.ts:1529, 1545).

The intended fantasy (spec 32 §6): *plant short afflictions, harvest Souls as they
expire, swing the scythe when the bank is full.*

## 2. As played — the transcripts

### (t1) Early, seed 3, Little Belle 40 HP — **Victory in ONE phase**, player 81/90

```
DoT damage:      636        Direct damage:   10
The Reaping:        10 dmg (0 DoT)  over 1 phases
Brief Candle:        0 dmg (12 DoT) over 1 phases
Conviction Strike:   0 dmg (624 DoT) over 9 phases
```

Read that attribution twice. The theme's rare capstone — "every soul you gathered,
swung at once" — swung for **10 damage**. The generic Conviction-funded signature
(`sig-conviction-strike`, combat.signature.ts) delivered **624 of 636 DoT = 98%**.
The harvest deck is a bystander at its own harvest. A one-phase fight also means the
central loop — plant → expire → collect — physically cannot complete even once:
a d1 bleed's expiry Soul arrives at the between-phases step of a fight that is
already over.

### (t2) Mid, seed 5, Hasshaku-sama 450 HP — Victory in 3 phases, player **28/255**

```
DoT damage:      2135       Direct damage:   256
Winnowing:         105 dmg (0 DoT)  over 1 phases
Brief Candle:        0 dmg (231 DoT) over 6 phases
Memento Mori:        0 dmg (0 DoT)   over 4 phases
Conviction Strike:   0 dmg (1904 DoT) over 25 phases
```

Two things worth their weight. First, the good one: **Winnowing's 105-damage
consume is the only authored spike either transcript produced** — cutting a ripe
affliction down NOW (engine.ts:1532-1549) is the one harvest verb that felt like the
scythe. Second, the damning one: **The Reaping does not appear in the attribution at
all** — across a 3-phase, 2,391-damage fight, the capstone either never fired or fired
on an empty bank for 0. Conviction Strike: 1904/2391 = **80%** of everything. The
28/255 HP finish looks dramatic on paper, but the player had no defensive verb in the
entire preset to have made a decision about it — the deck contains zero GUARD, zero
CLEANSE, zero RAPPORT, nothing.

## 3. As played — the matrix (blind, 30 runs/cell)

| stage | win | doctrine | rounds | statusEng | dotFrac | strike | dom |
|---|---|---|---|---|---|---|---|
| early | **99%** | ~80% | **1.8** | 49% | **54%** | **34-44%** | brief-candle **71%** |
| mid | **51%** | ~50% | 3.5 | 51% | 60% | 34-39% | brief-candle 64% |

Per-cell mid: tri-eyes **100%**, mirac **13%**, hasshaku-sama 77%, jeweled-tree 67%,
rawhead-rex **0%** (0/30, all defeats at exactly 3.0 rounds). Win-path mix: vic=77,
def=73, **mercy=0, capitulate=0, concede=0**.

Readings:

1. **Early violates the decay doctrine** (99% vs ~80%) with 1.4-2.5-round fights — the
   shortest in the audited set. A "plant and wait for expiry" theme whose fights end
   before the first expiry is a category error, not a tuning miss.
2. **The mid 51% is a coin-flip average, not a curve.** 100/77/67/13/0 is matchup
   script, not player skill: against rawhead-rex every one of 30 seeds dies at 3.0
   rounds like a train timetable. The doctrine number is technically met by averaging
   two cliffs.
3. **`strike` at 34-44% in a strike-is-dead game.** REAP/consume bursts and
   bone-orchard drips are booked as direct damage (`directDamage +=` at
   engine.ts:1525/1541/1586/755), so tithe posts the highest "strike" fraction of any
   doctrine-legal deck. Doctrinally legal — the bursts ARE the sanctioned verbs — but
   the doctrine witness (`dotFrac` 54% vs the 95-99% of the baseline decks) shows this
   theme lives half outside the tick economy. Fine, if the burst half actually spiked.
   It does not (see t1: 10 damage).
4. **Per-card usage** (m2, 3,540 plays): memento-mori 1034 (917 bottom), brief-candle
   997 (907 bottom) — the two d1 seeds are 57% of ALL plays. the-gleaners-due is played
   **63% on its FREE top line** (291 top vs 169 bottom). the-reaping: 228 plays, and per
   t1/t2 those swings are near-zero. Utilization is 100% and entropy 0.88 — nothing is
   literally dead, which is the cruel part: every card gets played, and only one of
   them (winnowing) ever produces a moment.

## 4. Identity as played, and the nearest neighbor

**Identity as played: an affliction deck with a coin jar.** You bottom-line the same
two d1 seeds every turn, a counter labeled "Souls" goes up by ones and twos, and the
fight ends — by Conviction Strike ticks — before the jar means anything. The scythe
never swings for more than pocket change.

**Nearest neighbor: affliction (`erosion`), unambiguously.** Same seed verbs (BLEED,
MARK), same bottom-line-the-DoT turn shape, same RUPTURE-family finisher slot — except
erosion's poisons ramp and its detonation consumes real fuel, while tithe's seeds are
deliberately stunted (d1) so they'll die fast, and the compensation (the Soul bank)
never reaches a payoff threshold anyone can feel. Structurally it wants to be forge
(bank a resource → one overwhelming turn); experientially it is erosion with worse
DoTs. A theme whose distinguishing resource changes no line of play has no identity —
Dominion players would call the Soul counter a "victory point track that pays 3 coppers."

## 5. Where the player thinks, and where it's autopilot

**Genuine thought (present but starved):**
- *Winnowing timing* — cut a ripe affliction now (fuel ticks immediately, +2 Souls)
  vs let it ride for MARK amplification vs let it expire (1 Soul). This is a real
  sickle-vs-patience decision — the theme's one good verb — but with d1-d2 seeds the
  window is a single round wide, so "timing" degenerates to "on curve, always."
- *Gleaner's vs Reaping* — spend 2 Souls on economy (die + cards, net -1 Soul) or hoard
  for the capstone. The correct answer is currently "neither matters" because the bank
  peaks around 4-8 Souls and the Reaping pays a linear 4/Soul against a cap of 200 it
  will never see. The sim plays Gleaner's 63% FREE — even the bot declines the decision.

**Autopilot (dominant):**
- Bottom-line brief-candle/memento-mori every single turn: 1,824 of 3,540 mid plays
  before counting their top lines. There is no reason to sequence, hold, or pair them.
- The Reaping fired on trivial banks (t1: 10 dmg; t2: absent) — no policy, and under
  the current numbers no human, is rewarded for waiting.
- The Tithe bottomed 131/156 times to permanence... changing nothing (next section).
- The actual kill mechanism in both transcripts is `sig-conviction-strike` (80-98% of
  DoT) — the deck's turns are ritual around a Conviction button, and the handoff notes
  Conviction income roughly doubled under the new dice law.

**The setup→payoff arc:** exists on paper (seeds → expiries → bank → scythe), and is
severed in play at two joints: fights 1.4-3.9 rounds shorter than the arc, and Soul
income flat (1-2/play) so the bank grows arithmetically while the fight clock burns
geometrically (escalation ×1.22/round). There is no round where the player feels the
bank *ripen*.

## 6. Card-by-card verdicts

- **brief-candle (C1)** — functional seed; 71% dom share early (the >70% spam flag) is
  a deck-shape symptom, not a card sin. Its FREE `souls: 1` is the problem (see §8/H1).
- **memento-mori (C2)** — MARK i2 d1: a one-round amplifier in a deck whose only
  same-round tick is a decaying bleed. Its FREE `souls: 2` is *strictly faster Soul
  income than the theme's entire plant-expire loop* (2 now, dieless, vs 1 per seed,
   1-2 rounds later, die required). The coupon outbids the harvest.
- **winnowing (U1)** — the best card in the theme and the only one that produced a felt
  moment (t2: 105 dmg). Keep; deepen (H4).
- **the-gleaners-due (U2)** — the intended save-vs-spend pivot, played 63% as a FREE
  cantrip. Its PAID line is fine; the bank it feeds on is too shallow for the choice
  to register.
- **the-reaping (R)** — the capstone that never spikes. 4/Soul × a ~5-Soul realistic
  bank = ~20 damage vs a cap of 200: **the payoff underdelivers its own ceiling by an
  order of magnitude.** t1 measured it at 10.
- **bone-orchard (R-ench)** — coherent, honest, undertuned: ~10-15 HP/fight. It also
  double-dips the FREE coupons (gainSouls fires on 'granted', engine.ts:753), which
  further subsidizes coupon-spam over planting.
- **the-tithe (R-disench)** — **null in its own deck.** All tithe seeds are d1; with the
  near-unconditional color-match +1 duration (engine.ts:1356,
  `COLOR_MATCH_STATUS_DURATION_BONUS`) they become d2, and The Tithe's extra decrement
  (engine.ts:2516-2527) knocks them straight back to d1 — i.e. the rare disenchant's
  entire function is to *cancel a bonus you get for free*, trading the second bleed/MARK
  tick for a Soul one round earlier. It would be a fine card in erosion (long poisons),
  but presets are strictly self-contained, so it lives in the only deck where it does
  nothing. This is the theme's `tu-quoque`.

## 7. Prior art (KB cross-reference)

- **Dawncaster — Souls** (`kb/KnowledgeBase/DigitalCardGames/dawncaster/keywords/souls.okf.md`):
  "Use the lingering essence of slain foes to empower Actions. When you die with over
  100 souls collected, revive and lose all Souls." Two lessons tithe ignores: (1) the
  bank has a *threshold identity* — 100 is a number players chase; (2) hoarding is
  emotionally double-loaded because the bank is also life insurance. Twenty Dawncaster
  cards touch Souls (`Dark Harvest`, `Damnation`, `Soulbinder`…) and the good ones are
  *rate-changers or threshold payoffs*, not linear dumps.
- **Slay the Spire — Catalyst/Bane-style poison decks:** the archetype works because the
  payoff is *multiplicative on accumulated state* (Catalyst doubles/triples the stack).
  The Reaping is linear-additive on a resource that accrues linearly — the one shape
  that can never produce a "the turn" story.
- **Wildfrost / Monster Train escalation:** their signature engines *intensify* as the
  fight lengthens; tithe's engine needs length it is never given (1.8-round early
  fights) and gains nothing per round it does get.
- **Dominion calibration:** a resource whose optimal use never deviates from "spend on
  sight or ignore" is a texture, not an economy. Souls currently fail the Big Money
  test inside their own deck.

## 8. Proposals (respecting doctrine, the locked dice law, and the FREE/PAID signal)

**H1 — Burn the Soul coupons: FREE lines plant, they don't pay.** (kind: card, S)
Replace `free: { souls: 1 }` on brief-candle with a FREE micro-seed — MARK i1 d1 on
the enemy — and `free: { souls: 2 }` on memento-mori likewise (MARK i1 d1). The FREE
line becomes literal sowing: it expires next between-phases into 1 Soul *through the
expiry law*, feeds Bone Orchard, The Tithe, Winnowing and RUPTURE-counting, and gives
the PAID lines something standing to amplify or consume. This is the owner's FREE/PAID
directive executed exactly: the FREE line lays foundation for PAID payoffs instead of
dripping tokens — and the drip here was double-poisonous because a dieless coupon
outbid the theme's own core loop. Gleaner's FREE `souls: 1` gets the same treatment
(keep the draw 1). Cost delta ≈ neutral (a d1 MARK ≈ 1 delayed Soul + 1 round of +1
ticks); rebudget the pts comments at cards.library.ts:937/956/994.

**H2 — Make The Reaping convex: the bank must ripen.** (kind: tuning + ux, M)
Linear 4/Soul can never spike. Tier it: Souls 1-4 pay 3 each, 5-8 pay 5 each, 9+ pay
8 each (still under the `reapAllBurstCap`); print the tiers on the card. Surface
`projectReapAll` (engine.ts:3135-3147, already implemented) as a live number on the
card face so the player watches the swing grow — anticipation is the whole archetype.
Now hold-vs-swing is a genuine decision every turn the bank sits at 4 or 8, Gleaner's
Due becomes a real rival (spend the bank below a breakpoint), and the escalation clock
supplies authentic pressure against greed. This is Catalyst-shaped payoff on
Dawncaster-shaped thresholds.

**H3 — Rework The Tithe into a death-rattle, not a clock-skip.** (kind: card, M)
Current text is null against d1-d2 seeds and literally cancels the color-match duration
bonus. New text, same slot/rank: *"When an enemy affliction expires or is consumed, it
deals its final tick's damage again."* Souls still flow only through the expiry/consume
law (no revert of anything); churn itself becomes the theme's damage engine, which
directly attacks the real disease — Conviction Strike doing 80-98% of the killing —
by making the deck's own loop lethal. Implementation sits exactly where expiry is
already computed (engine.ts:2529-2535) and at the consume verbs (1529/1545).

**H4 — Winnowing: souls scale with what you sacrifice, and one seed worth ripening.**
(kind: mechanic, M) Change winnowing's grant from flat 2 Souls to *1 Soul per remaining
round of the consumed affliction (min 1)* — cutting green crops pays damage now but
starves the bank; letting them ripen pays Souls. To give that choice a canvas, upgrade
brief-candle's PAID line with a wild-die rider (dice-law-legal: WILD is universal):
*if powered by a WILD die, the bleed is i2 d3 instead.* One knob, no new keyword, and
suddenly the drafted-die decision (spend the wild here vs bank +2 Conviction unpicked)
touches the theme's core loop — the first time the locked dice law would produce a
harvest-specific thought.

**H5 — Reaper's insurance (optional, if mid bimodality survives H1-H4).** (kind: card, S)
Bone Orchard permanent gains: *"If you would be reduced below 1 HP while holding 4+
Souls, spend all Souls and prevent 3 damage per Soul (once per combat)."* Dawncaster's
revive-at-100 in miniature: the bank becomes life insurance, hoarding gets emotional
weight, and the 30/30 scripted 3.0-round deaths vs rawhead-rex become a resource
decision instead of a timetable. Strictly theme-scoped; touches no dice or doctrine.

Explicitly NOT proposed: longer global fights, reverting the color law, any raw-damage
line. H1+H2+H3 together give the theme what it measurably lacks — a loop that is its
own kill engine and a payoff worth watching grow — inside current rules.

## 9. Scores

- **Distinctiveness as played: 3/10.** Two seed spells shared in kind with erosion, a
  counter that changes no decision, a capstone measured at 10 damage, and a rare that
  cancels a free bonus. Winnowing's consume (t2: 105 dmg) is the lone distinct verb
  that fires — one card of seven.
- **Engagement: 3/10.** Early: one-phase autopilot (99% win, 1.8 rounds, signature does
  98%). Mid: a bimodal timetable (100/13/0 cells, defeats at exactly 3.0 rounds) with
  no defensive verb in the deck to reason about. The two authored decisions (winnowing
  timing, Gleaner's-vs-Reaping) exist and are both starved below the threshold of
  mattering — the sims decline them and win anyway.

The tragedy of tithe is that it is the *best-plumbed* theme in the file — expiry law,
consume verbs, per-Soul hooks, even a projection function for the UI, all built and
working — wrapped around numbers that guarantee none of it is ever felt. It is a
harvest festival where the crop comes up, the scythe is sharpened, and the fair closes
before lunch.
