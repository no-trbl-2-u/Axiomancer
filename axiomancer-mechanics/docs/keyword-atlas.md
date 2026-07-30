# Keyword atlas — the registry's scoreboard and prior-art cache

Owned by the `card-expert` agent (`.claude/agents/card-expert.md`).
One row per registry keyword (spec 32 §3 — 30, amended by phase 29,
2026-07-11 — see `plan/phases/phase_29_keyword_registry.md`). Two jobs:

1. **Prior-art cache.** The `Dawncaster analogues` cell caches KB
   lookups so they aren't re-derived every session. Every analogue
   carries its `kb:` receipt — **no receipt, no entry**. The atlas is
   a cache, not a source: verify against `kb/` when a row smells stale.
2. **Proving-gate scoreboard.** The `gate` cell tracks the §4b criteria
   from `/deck-tuning`, in order **E**xercised / **P**riced honestly /
   not **D**ominant / **T**heme-honest (T applies to the 19 theme
   hallmarks; utility keywords carry `T:n/a`). Marks: `+` passing,
   `!` failing (forge target), `?` not yet assessed. When all rows
   are `+` across a full sweep, the proving gate is satisfied and the
   owner decides whether to open the registry past its current count.

Update discipline: `/deck-tuning` (via card-expert) updates affected
rows in the same PR as any card/keyword change. Semantics cells are
one-line summaries — spec 32 §3 stays authoritative.

## Row policy (2026-07-11, WS10.2)

- **One-card mechanics stay card-local.** Per the 2026-07-10
  card-keyword doctrine (FESTER and TRANSMUTE are the precedents),
  a mechanic that lives on a single card reads as a face keyword —
  KEYWORD·value + gloss on the card face, with the guard test
  (`axiomancer-mobile/state/presenters/__tests__/card-face-honesty.guard.test.ts`)
  blocking the ambiguous fallback — and gets NO atlas row.
- **A term earns a row at ~3+ cards.** Only vocabulary the library
  actually repeats belongs in the registry.
- **Drill target.** As the library grows, keep the median at ~4-6
  cards per keyword — keywords get drilled, not orphaned.
- **BARRIER/GUARD merge** landed in Phase 29 (BARRIER folded into
  GUARD's semantics — see the row below).
- **Row-count gate (restated per the detailed plan §0.1 C-5).** Row
  count changes ONLY via ratified add/retire. TICK was owner-ratified
  killed 2026-07-10 (spec 32 amendment #2, rides Phase 30): when that
  retirement lands the count drops again unless the owner ratifies a
  replacement row — the "exactly 30" framing above yields to earned
  support.

**Phase 29 changes (2026-07-11):** BARRIER row removed (merged into
GUARD — see its semantics); CONJURE row removed (retired, zero library
cards); PERORATION row removed (demoted — its gate history folds into
PREMISE below); REPRISE renamed to RECALL (same gate history); PROLONG,
REARGUE, and SIPHON rows added (renamed/promoted from unglossed mobile
additions, never previously atlas-tracked). Eight prior-art receipts
backfilled from citations already surfaced in
`plan/tuning/2026-07-10-audit-evidence/cross-prior-art.md` (KW-8) — the
remaining ungreceipted rows keep `—` rather than an invented analogue;
a full Dawncaster pass per keyword is a follow-up, not fabricated here.

**CONJURE gate credit (2026-07-11, banked for the row's return):** the
row stays retired (its carriers — foundry-sprite, corollary, the
tf-* Thoughtforms — are sandbox-only; the row-count gate holds), but
the WS2.1 evidence pass EXERCISED it clean: all 3 clauses PASS
(tf-cinder 411/411 and 304/304 bottom-line conversions, token fizzle
0–2%, no dominance in 288 cells). Receipt:
`plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §2 WS2.1.
If promotion ever restores the row, it starts at `+???`, not `????`.

## Utility (10)

| keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|
| DRAW N | draw N cards | — | `????` T:n/a | |
| FORGE | permanent floating die; cap 3, at cap converts to +1 Conviction | — | `????` T:n/a | |
| GUARD N | block next N damage; fades at round end — unless the card prints "persists" (the merged BARRIER sense, which fades only when consumed) | — | `????` T:n/a | phase 29: absorbs the former BARRIER row (one carrier, the-adamant-wall; no gate data was recorded against it) |
| TICK | one enemy DoT ticks now (duration unchanged) | — | `????` T:n/a | retirement rides phase 30's FREE-line rework (KW-4, owner-ratified 2026-07-10) |
| MARK iN dM | +1 per stack to each DoT tick / payoff hit; counts as affliction; BATTLE-LONG (WS3.3 `calendarExpiry: false` — bounded by payoff consumption, not a calendar) | — | `????` T:n/a | WS3.3 (2026-07-11): printed durations on MARK applications are nominal; absorbed half of the foretold_wound fold (KW-1). 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): three more seated MARK depositors ride the promotions (pebble-in-the-boot paid line; the-burden-of-repetition and half-spoken-prophecy FREE/rider lines) |
| CLEANSE N | remove N of your own afflictions | — | `????` T:n/a | |
| HEAL N | restore N VITAE | — | `????` T:n/a | |
| RUPTURE N | consume up to N enemy afflictions (ALL on a finisher); burst damage = 1.5x their remaining DoT damage + 3 per non-DoT stack | — | `!???` T:n/a | WS7.1 (2026-07-11): cap is now a pure fraction — round(0.60x enemy maxHP), flat floor retired (`RUPTURE_CAP_FRACTION`; supersedes plan #2's max(80, 0.25x)); erosion late 0.03->0.08 — decay wall (plan #3) is the remaining brake. phase 29: now also absorbs `consume_affliction` (was presented as a Soul-flavored verb; the Soul gain stays a printed rider). 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): half-spoken-prophecy seats a no-Soul consume_affliction (souls: 0) in the augury recipe — the first preset-seated single-affliction RUPTURE since delphic left penitent's borrow pool unchanged |
| SIPHON N% | heal for N% of the HP this play deals to the enemy | — | `????` T:n/a | phase 29: promoted from raw unglossed card text (resonance-detonation, the-reaping) |
| MILL N | send the top N cards of your deck to your discard pile | — | `????` T:n/a | promoted 2026-07-12 in the mobile registry (card-wording audit — 3 echo carriers clear the ~3-card bar); atlas row backfilled 2026-07-13 to end the registry drift |

## Theme hallmarks (19 — Peroration keeps one, not two)

| theme | keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|---|
| Affliction | POISON iN dM | ramping DoT on the CARD-PLAYED clock (WS3.3: ticks per player card play, ~2 expected/round; per-round ramp held) | Poison — kb:dawncaster/keywords/poison.okf.md: cited alongside BLEED in the status-centric receipt list (`cross-prior-art.md` §2 Axis B); direct analogue, magnitudes not verified | `+??!` | WS3.3 sweep (2026-07-11): lifetime pricing walks the clock (2 ticks/round → i1 d4 = 20 HP); absorbed the argument_wound + echo_sting folds and half of foretold_wound (KW-1); WS3.6 matrix re-read pending. 2026-07-19 promotions (docs/reports/deck-tuning-2026-07-19-promotions.md): two new seated carriers — poisoned-well (erosion x4; front-loaded i2d2, mid blind 0.370→0.503 in the A/B) and videtur-quod (oratory x4; d3 fuse, the run's cleanest commons sE gain) |
| Affliction | BLEED iN dM | front-loaded DoT on the DAMAGE-INSTANCE clock (WS3.3: ticks per enemy damage instance), decays 1 intensity per trigger | Bleeding — kb:dawncaster/keywords/bleeding.okf.md (src-001, community, medium): reactive ("when dealt damage, +1 per stack, then stacks −1") — WS3.3 moved ours onto that reactive shape, so their stack ECONOMY now transfers directly; their magnitudes still do not | `+??!` | WS3.3: decay-limited lifetime is clock-invariant (i2 d2 = 9 HP on any clock) — the clock changes tempo, not total; WS3.6 matrix re-read pending |
| Peroration | PREMISE | persistent tally (argument under construction); the declared conclusion fires FREE at the printed Premise count (formerly its own PERORATION row — see below) | — | `++!?` | round 2: Oratory 100/100/100 — flat 8-Premise CONCEDE ignores the stage curve (plan #1 scaled thresholds + boss Premise-shed). phase 29: PERORATION's own gate history folds in here — it was "the dominance carrier of the CONCEDE path (plan #1); NERF target, not buff", now read as a property of the-closing-word's Premise payoff rather than a separate keyword. Phase 32 part 4b: milestone drip — every 3rd Premise EVER gained this combat (a new lifetime `premiseMilestoneTotal` counter, tracked separately from the spendable tally above so a Peroration payoff/CONCEDE resetting the tally does not un-cross a milestone already paid) grants 1 STAGGER rung, engine-side and universal across every Premise source (own-card or borrowed FREE rider) — "the build pays small dividends DURING construction." No new keyword row (one-card/engine-wide-drip mechanics stay card-local per row policy); rides Control's STAGGER pool as a cross-theme note only. 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): quod-erat-demonstrandum promoted into oratory's rare seat — declares at 5 / CONCEDEs at 8; A/B took late INTO band (0.12→0.28) with CONCEDE ≈71% of late wins, owner-accepted; concede-centrality stays a watch item (hold confirmatio per the atlas instruction) |
| Forge | KINDLE | temporary die, this combat only | — | `!???` | round 2: Foundry mid/late 0% — pip engine has no uncapped spender (plan #2 cap, plan #5 boss-tech rare) |
| Forge | PIP | +1 pip to a held die; spendable by payoff verbs | — | `!???` | round 2: as KINDLE — banked pips cannot cash past the 80-HP cap (plan #2). Phase 32 part 4c: OVERHEAT (`half-step`'s new third `specialMechanics` entry, `{ kind: 'overheat'; pips: number }`) — a die already at the safe `RESERVE_PIP_CAP` can be pushed further, up to `OVERHEAT_PIP_CEILING`, at a per-pip `OVERHEAT_BUST_CHANCE` (35%) risk; a bust HALVES (floors) the die's pips rather than zeroing them. The press-your-luck knob 2026-07-10-theme-identity.md §2 asked for. Prior art (non-Dawncaster — board-game corpus): kb:boardgames/the-quacks-of-quedlinburg/rules/overview.okf.md (src-003, secondary, high) — white chips accumulate toward a bust threshold (sum > 7) and exploding costs a real but PARTIAL penalty ("choose points or coins, not both," never a total wipe); OVERHEAT's halve-not-zero bust mirrors that partial-loss shape, not Dawncaster vocabulary. Display badge "PIP N past the cap" on the card face — no new keyword row (one-card mechanic rides this existing row, TURNABOUT/BACKFIRE precedent). 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): tempered-edge promoted (foundry x4 body seat) — a FREE-pip depositor carrying foundry's first in-theme enemy-facing DoT (kindling ember); early landed ON band (0.60→0.80) in the A/B, mid/late remain the structural breach |
| Akrasia | RECOIL N | pay N VITAE (unpreventable) as printed cost | Blood — kb:dawncaster/keywords/blood.okf.md: cited as a Dawncaster HP-as-cost resource (`cross-prior-art.md` §2 Axis A); frame transfers ("your own HP is a spendable currency"), no magnitude comparison done | `+?!?` | plan #2 LANDED (8d853dcb): scaling caps erased the regression — penitent mid 0.92, late 0.40 (spread telemetry, seed 1) |
| Akrasia | FALLEN | state: >=2 self-afflictions; gates riders | Corrupted — kb:dawncaster/keywords/corruption.okf.md: cited as the direct threshold-state analogue (`cross-prior-art.md` differentiation matrix, akrasia row) | `+?!?` | plan #2 landed: bursts scale to 0.25x boss maxHP — penitent late 0.02->0.40 |
| Control | STAGGER N | remove N rungs from telegraphed action; 0 rungs = denied | Stagger — kb:dawncaster/keywords/stagger.okf.md: cited alongside POISON/BLEED in the status-centric receipt list (`cross-prior-art.md` §2 Axis B); name match, mechanical comparison not done | `++!?` | round 2: Standstill 100/100/100 — flat rung denial ignores the stage curve (plan #1: boss rung-regrowth). Phase 32 part 4b: Oratory's PREMISE milestone drip (see that row) also feeds this same `staggerRungs` pool as a small cross-theme dividend — a borrowed-preset synergy, not a new STAGGER source authored on any Control card |
| Control | BACKFIRE iN dM | enemy takes N per rung its actions lose | Momentum — kb:dawncaster/keywords/momentum.okf.md (src-001, community, medium): "whenever you have 5+ Momentum, remove all stacks and draw a card" — the closest banked-counter-cashes-at-a-point analogue to TURNABOUT's `rungsDeniedTotal` ledger, though theirs auto-fires at a threshold and pays a card-draw dividend (not a player-spent HP burst); the "a passive tally becomes a real payoff" shape transfers, magnitudes do not | `++!?` | round 2: rides the Standstill lock (plan #1); ~11-round late grinds but never lost. Phase 32 part 4a: `turnabout` (control's rank-6 rare spell, replacing paralysis-of-analysis's old slot) is a NEW one-card mechanic (`kind: 'turnabout'`) that CONSUMES the whole `rungsDeniedTotal` ledger — every rung STAGGER/BACKFIRE have denied this combat, banked separately from BACKFIRE's own per-phase drip — for a `burstPerRung`-per-rung burst, then zeroes it. Badged "BACKFIRE ALL" on the card face (REAP ALL / RUPTURE ALL precedent) — row-policy "one-card mechanics stay card-local" applies, so this does NOT earn its own atlas row; it rides BACKFIRE's here as a finisher note only |
| Oracle | FORETELL N | see/reorder top N of deck + glimpse next telegraph | — | `+???` | round 2: Augury early 69→91 once omens landed as described |
| Oracle | OMEN | player-STAKED stance + window claim (phase 32 part 4d — OMEN v2): rider fires free at 1/window scale if the claimed stance lands within the claimed window; the Conviction ante is paid up front and forfeited (never refunded) on a miss | Foretell — kb:dawncaster/keywords/foretell.okf.md (community, medium): "look at the top X cards of your deck, put 1 on top, the rest to the bottom" — a pure LOOKUP, no player-chosen stakes/range at all; confirms the genre's closest analogue does not already solve "a bet, not a lookup," so OMEN v2's stakes shape has no Dawncaster template to borrow magnitudes from. The actual structural template is domestic: `placeStake`/`settleStake` (phase 31 EA-7, "THE STAKE") — a pre-play Conviction wager on a phase's hidden stance, bigger stakes (2/4/6◆) pay bigger (colored/colored-pip/wild floating die), a loss burns the wager — OMEN v2 generalizes that SAME shape from "bet on the CURRENT phase" to "bet on a claimed WINDOW of upcoming phases," reusing its cost/payoff-scales-with-stake idiom rather than inventing a new one | `+??!` | round 2 (pre-v2): mid only 8%, late 0% — prophecy payoffs do not out-scale boss HP (plan #2). Phase 32 part 4d: the prediction is now a genuine CAST-TIME CHOICE (`play.omenClaim: { stance, window }`) instead of silently derived from the powering die's color (the "always predicts HEART" complaint, 2026-07-10-theme-identity.md §"Oracle / augury") — `pendingOmens` is now a countdown (`windowRemaining`, `claimScale`) re-checked at EVERY phase boundary while a wider claim stays alive, not a one-shot absolute-phase-index check. Absent `omenClaim` (no mobile picker yet — deferred, see Follow-ups) falls back to `window: 1` and the pre-v2 die-derived stance, so every existing caller/test is byte-compatible by default. `signs-and-portents`/`cassandras-burden` `// pts:` comments carry the new anteConviction credit arithmetic. Augury (seed 1, `greedy`, `preset:augury`): early win 69%→68%, mid/late unchanged at 1%/0% — the sim never exercises `omenClaim` (scope cut, see the phase 32 part 4d brief), so the only drift is the new ante's small EV tax at the pre-v2 default claim. 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): half-spoken-prophecy promoted (augury body u-seat, recolored mind→body) — a second live OMEN carrier (ante 1, foretell-2 rider); its consume_affliction precondition fizzled 344×/mid in the A/B (known caveat, owner-ratified anyway) |
| Harvest | SOUL | gain 1 Soul when an enemy affliction expires or is consumed | Souls — kb:dawncaster/keywords/souls.okf.md: cited as a Dawncaster unique-resource-with-bank-rules analogue (`cross-prior-art.md` §2 Axis A); bank-rule frame transfers, resurrection-clause specifics do not | `+??!` | round 2: Tithe mid 15→23 with REAP cap lifted to 200 — full harvest needs more rebuild cycles than a fight lasts (plan #2, #3) |
| Harvest | REAP N | spend N Souls to fire printed effect | Reaping — kb:dawncaster/keywords/reaping.okf.md: cited as the direct payoff-verb analogue (`cross-prior-art.md` §4.1); Dawncaster's Reaping keys off Souls the same way | `!???` | WS7.1 (2026-07-11): the REAP-ALL cap was removed entirely — ALL-spenders are uncapped (`themed-decks.engine.test.ts` pins the 240-damage uncapped burst; supersedes plan #2's max(200, 0.25x maxHP)); tithe late still 0 — rebuild-cycle wall (plan #3) |
| Charm | SWAY N | enemy stacks, decays 1/turn; reaching resolve (35% of max HP, never below 10, or current HP if lower) opens an explicit ACCEPT / CONTINUE capitulation choice | Charmed — kb:dawncaster/keywords/charmed.okf.md: cited as the direct analogue (`cross-prior-art.md` §2 Axis B, "equal amount of Charmed"); their built-in decay/hold tension matches ours | `+??!` | round 2: Grace late 0% — matching a boss FULL HP bar is unreachable; needed the Charmed-style resolve threshold, landed 2026-07-08 (this atlas row's semantics corrected by phase 29 to match — it had drifted stale). Phase 32 part 4e ("Resolve milestones," 2026-07-10-theme-identity.md §"Charm / grace" — "the track gets rungs and a face"): every `gainSway` call (the theme's single insertion point, `soft-word`'s FREE/PAID sway, `mirror-of-longing`'s damage-prevented conversion, all of it) now also checks SWAY against two named fractional waypoints of the LIVE `capitulateThreshold` — Wavering (45% of resolve) lands one RAPPORT stack on the enemy (see that row), Faltering (80% of resolve) grants a small +2 bonus SWAY, unscaled by `buff_grace_momentum`. Each fires AT MOST ONCE per combat (`swayMilestoneWaveringFired`/`swayMilestoneFalteringFired`) and never un-fires if the live resolve later shrinks — an un-authored ledger dividend riding every SWAY source, same "no VERB_POINTS entry" precedent as part 4b's PREMISE milestone drip. 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): grace-under-fire promoted (grace body u-seat) — drew-blood composure→SWAY conversion, early 0.689→0.811 (ON band) in the A/B |
| Charm | RAPPORT iN dM | enemy deals N less damage while active | — | `+???` | round 2: fine where SWAY is live; inherits the threshold fix (plan #1). Phase 32 part 4e: the Wavering resolve-milestone (see SWAY's row) lands 1 extra RAPPORT stack, engine-side, the first time SWAY crosses 45% of the live resolve — a small cross-verb dividend, not a new authored card |
| Bulwark | THORNS iN dM | attacker takes N when it damages you | — | `+??!` | round 2: Bastion early 77→98, mid 14 — cannot kill non-attackers; boss 1.6x threat near-certain loss (plan #5 boss-tech). 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): pebble-in-the-boot (x4) + the-anvil-speaks (rare) promoted — bastion's answer to never-swings enemies now rides the nettle-sting DoT beside the reflect pair (A/B mid 0.070→0.133) |
| Bulwark | RIPOSTE iN dM | armed one threat phase: the printed parry blunts the first hit by that much; an attack fully blocked = enemy takes N | — | `+??!` | round 2: as THORNS — wall holds, kill-path missing late (plan #5). 2026-07-13 card-clarity audit: semantics cell now defines the parry half ("parry 2" printed on measured-answer / the-adamant-wall had no definition anywhere in the atlas) |
| Echo | ECHO | the printed line fires twice | Rebound — kb:dawncaster/keywords/rebound.okf.md: cited as the "fires again a number of times" analogue (`cross-prior-art.md` §4.2); their counter-based repeat vs our flat double, mechanism differs | `++??` | round 2 PROVEN: Ouroboros paid-face fix took Refrain late 3→37% — biggest real gain of the cohort (plan #6 lint guards the class). 2026-07-19 (docs/reports/deck-tuning-2026-07-19-promotions.md): the-burden-of-repetition promoted (refrain body u-seat, recolored heart→body) — the measurement run's strongest arm (mid blind 0.420→0.583, sE +0.068); winnowing dominance-share watch item carried in the promotion report |
| Echo | RECALL N | return N cards from discard to hand | — | `++??` | round 2 PROVEN: mid 90→99 with ECHO (Refrain). phase 29: renamed from REPRISE — same gate history, no mechanic change |

## Affliction glue (2 — beyond the hallmark pair)

| keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|
| PROLONG N | add N turns of duration to ALL your DoTs on the enemy | — | `????` T:n/a | phase 29: renamed from FESTER (name collided with "an infected wound" — read as another DoT species, not a duration extender); sole carrier festering-argument, orphan-tier support (1 card). 2026-07-18 swap-pool measurement pass: deposit-matched single-variable A/B (chronic-condition at the festering-argument x2 seat, `docs/reports/deck-tuning-2026-07-18.md` §1 e2) — exercised clean (3.2 plays/run mid, 5 fizzles/~2,070 plays), priced neutral (mid Δwin +0.007/+0.010 blind/greedy, sE +0.003/+0.005): playable but not differentiating at this seat |
| REARGUE iN | convert the enemy's Bleed↔Poison, +N intensity as it flips | — | `????` T:n/a | phase 29: renamed from TRANSMUTE (the word was double-booked with the unrelated X→WILD die-conversion sense, which stays inside FORGE's gloss); sole carrier currys-conversion, orphan-tier support (1 card). 2026-07-19 swap-pool measurement pass: first receipt banked — `currys-conversion→reopen-the-question` A/B (`docs/reports/deck-tuning-2026-07-19.md` §3 H2, 100 runs/seed 1): exercised at the mind uncommon x2 seat, 6% fizz (bleed+poison-both-present precondition occasionally unmet), opp% 98%, mid win +2.4/+2.6pts blind/greedy, statusEngagement up at every stage — real engagement gain, small mid/ALL8 cost (−4.1pts); not seat-legal as measured (mind→body color break, needs a re-partition) and blocked on the pool→library promotion gate (R1/C1) regardless |

## Die gear (spec 33 §6 — 3, registered D4 2026-07-17)

The Upgradeable-Dice progression vocabulary: the die-face payload and the
two blacksmith upgrade verbs. Registered ahead of their carriers — the die
gear + blacksmith surfaces land in D5, so all three are UNEXERCISED today
(gate `????`; the mobile guard test pins their glosses so the first gear
card face never falls through). Payload CHANGES are gear swaps, not
keyworded services (owner-lock D1). Prior art: the corpus still lacks the
five dice-builder games (Dice Forge / Dice Throne / etc. — wishes filed
2026-07-17, D1 §9.5); face-upgrade analogues remain remembered-and-labeled
`(memory)` until synced.

| keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|
| SPECIAL | a die's special face powers a card of its color AND grants Conviction; the equipped gear sets how much (default 2◆) | — (dice-builder resource faces — `(memory)`, wish-filed) | `????` T:n/a | spec 33 §1/§6. Owner-ratified at D7: fires on USE, not on roll. "SPECIAL" is the most generic name in the registry — rename opportunity noted D1, deferred. FORGE special-amplifier enchants (`dice-valves-33` sandbox) increase the fired payload, they do NOT change what a special does |
| HONE | blacksmith upgrade: add a mana face to a die's gear | Quacks upgrade economy — kb:boardgames/the-quacks-of-quedlinburg/rules/overview.okf.md (src-003, secondary, high): buying better chips to improve your randomizer over runs is the closest "upgrade the bag/pool, not the play" analogue; face-swap specifics are dice-builder territory `(memory)` | `????` T:n/a | spec 33 §6. Cap unchanged: ≥1 miss per colored die — whiff is never HONE-able away |
| TEMPER | blacksmith upgrade: turn a mana face into a special face | Quacks upgrade economy — same receipt as HONE (the "spend to strengthen the randomizer" frame); the special-face target has no Dawncaster template | `????` T:n/a | spec 33 §6. Caps: ≤2 special / ≥1 miss per colored die; Gold ≤1 special |

## Spec 33 reinterpretations (D4 2026-07-17 — no new rows)

- **FORGE / KINDLE** semantics ported but reframed: the FLOATING grant is now
  a TEMPORARY GOLD die (surge-class, combat-only — spec 33 §6), so the die
  verbs dropped the cross-combat `forgePersistence` credit (`cards.pricing.ts`);
  the utility FORGE row's gloss re-word (floating→temp gold) is a D6 render task.
- **revealStance** (the read rider on the oracle FREE lines) is REINTERPRETED,
  not retired: the hidden `enemyStance` read is gone (§2), so it now reveals the
  next phase's stance CHECK + reactive branch early. Same 1.5-pt info value —
  no reprice, no card re-author.
