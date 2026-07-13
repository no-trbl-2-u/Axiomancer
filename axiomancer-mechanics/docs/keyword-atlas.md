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
| MARK iN dM | +1 per stack to each DoT tick / payoff hit; counts as affliction; BATTLE-LONG (WS3.3 `calendarExpiry: false` — bounded by payoff consumption, not a calendar) | — | `????` T:n/a | WS3.3 (2026-07-11): printed durations on MARK applications are nominal; absorbed half of the foretold_wound fold (KW-1) |
| CLEANSE N | remove N of your own afflictions | — | `????` T:n/a | |
| HEAL N | restore N VITAE | — | `????` T:n/a | |
| RUPTURE N | consume up to N enemy afflictions (ALL on a finisher); burst damage = 1.5x their remaining DoT damage + 3 per non-DoT stack | — | `!???` T:n/a | WS7.1 (2026-07-11): cap is now a pure fraction — round(0.60x enemy maxHP), flat floor retired (`RUPTURE_CAP_FRACTION`; supersedes plan #2's max(80, 0.25x)); erosion late 0.03->0.08 — decay wall (plan #3) is the remaining brake. phase 29: now also absorbs `consume_affliction` (was presented as a Soul-flavored verb; the Soul gain stays a printed rider) |
| SIPHON N% | heal for N% of the HP this play deals to the enemy | — | `????` T:n/a | phase 29: promoted from raw unglossed card text (resonance-detonation, the-reaping) |
| MILL N | send the top N cards of your deck to your discard pile | — | `????` T:n/a | promoted 2026-07-12 in the mobile registry (card-wording audit — 3 echo carriers clear the ~3-card bar); atlas row backfilled 2026-07-13 to end the registry drift |

## Theme hallmarks (19 — Peroration keeps one, not two)

| theme | keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|---|
| Affliction | POISON iN dM | ramping DoT on the CARD-PLAYED clock (WS3.3: ticks per player card play, ~2 expected/round; per-round ramp held) | Poison — kb:dawncaster/keywords/poison.okf.md: cited alongside BLEED in the status-centric receipt list (`cross-prior-art.md` §2 Axis B); direct analogue, magnitudes not verified | `+??!` | WS3.3 sweep (2026-07-11): lifetime pricing walks the clock (2 ticks/round → i1 d4 = 20 HP); absorbed the argument_wound + echo_sting folds and half of foretold_wound (KW-1); WS3.6 matrix re-read pending |
| Affliction | BLEED iN dM | front-loaded DoT on the DAMAGE-INSTANCE clock (WS3.3: ticks per enemy damage instance), decays 1 intensity per trigger | Bleeding — kb:dawncaster/keywords/bleeding.okf.md (src-001, community, medium): reactive ("when dealt damage, +1 per stack, then stacks −1") — WS3.3 moved ours onto that reactive shape, so their stack ECONOMY now transfers directly; their magnitudes still do not | `+??!` | WS3.3: decay-limited lifetime is clock-invariant (i2 d2 = 9 HP on any clock) — the clock changes tempo, not total; WS3.6 matrix re-read pending |
| Peroration | PREMISE | persistent tally (argument under construction); the declared conclusion fires FREE at the printed Premise count (formerly its own PERORATION row — see below) | — | `++!?` | round 2: Oratory 100/100/100 — flat 8-Premise CONCEDE ignores the stage curve (plan #1 scaled thresholds + boss Premise-shed). phase 29: PERORATION's own gate history folds in here — it was "the dominance carrier of the CONCEDE path (plan #1); NERF target, not buff", now read as a property of the-closing-word's Premise payoff rather than a separate keyword |
| Forge | KINDLE | temporary die, this combat only | — | `!???` | round 2: Foundry mid/late 0% — pip engine has no uncapped spender (plan #2 cap, plan #5 boss-tech rare) |
| Forge | PIP | +1 pip to a held die; spendable by payoff verbs | — | `!???` | round 2: as KINDLE — banked pips cannot cash past the 80-HP cap (plan #2) |
| Akrasia | RECOIL N | pay N VITAE (unpreventable) as printed cost | Blood — kb:dawncaster/keywords/blood.okf.md: cited as a Dawncaster HP-as-cost resource (`cross-prior-art.md` §2 Axis A); frame transfers ("your own HP is a spendable currency"), no magnitude comparison done | `+?!?` | plan #2 LANDED (8d853dcb): scaling caps erased the regression — penitent mid 0.92, late 0.40 (spread telemetry, seed 1) |
| Akrasia | FALLEN | state: >=2 self-afflictions; gates riders | Corrupted — kb:dawncaster/keywords/corruption.okf.md: cited as the direct threshold-state analogue (`cross-prior-art.md` differentiation matrix, akrasia row) | `+?!?` | plan #2 landed: bursts scale to 0.25x boss maxHP — penitent late 0.02->0.40 |
| Control | STAGGER N | remove N rungs from telegraphed action; 0 rungs = denied | Stagger — kb:dawncaster/keywords/stagger.okf.md: cited alongside POISON/BLEED in the status-centric receipt list (`cross-prior-art.md` §2 Axis B); name match, mechanical comparison not done | `++!?` | round 2: Standstill 100/100/100 — flat rung denial ignores the stage curve (plan #1: boss rung-regrowth) |
| Control | BACKFIRE iN dM | enemy takes N per rung its actions lose | — | `++!?` | round 2: rides the Standstill lock (plan #1); ~11-round late grinds but never lost |
| Oracle | FORETELL N | see/reorder top N of deck + glimpse next telegraph | — | `+???` | round 2: Augury early 69→91 once omens landed as described |
| Oracle | OMEN | declared prediction; rider fires free if true by next turn | — | `+??!` | round 2: mid only 8%, late 0% — prophecy payoffs do not out-scale boss HP (plan #2) |
| Harvest | SOUL | gain 1 Soul when an enemy affliction expires or is consumed | Souls — kb:dawncaster/keywords/souls.okf.md: cited as a Dawncaster unique-resource-with-bank-rules analogue (`cross-prior-art.md` §2 Axis A); bank-rule frame transfers, resurrection-clause specifics do not | `+??!` | round 2: Tithe mid 15→23 with REAP cap lifted to 200 — full harvest needs more rebuild cycles than a fight lasts (plan #2, #3) |
| Harvest | REAP N | spend N Souls to fire printed effect | Reaping — kb:dawncaster/keywords/reaping.okf.md: cited as the direct payoff-verb analogue (`cross-prior-art.md` §4.1); Dawncaster's Reaping keys off Souls the same way | `!???` | WS7.1 (2026-07-11): the REAP-ALL cap was removed entirely — ALL-spenders are uncapped (`themed-decks.engine.test.ts` pins the 240-damage uncapped burst; supersedes plan #2's max(200, 0.25x maxHP)); tithe late still 0 — rebuild-cycle wall (plan #3) |
| Charm | SWAY N | enemy stacks, decays 1/turn; CAPITULATE fires the moment SWAY reaches the enemy's resolve (35% of max HP, never below 10, or current HP if lower) | Charmed — kb:dawncaster/keywords/charmed.okf.md: cited as the direct analogue (`cross-prior-art.md` §2 Axis B, "equal amount of Charmed"); their built-in decay/hold tension matches ours | `+??!` | round 2: Grace late 0% — matching a boss FULL HP bar is unreachable; needed the Charmed-style resolve threshold, landed 2026-07-08 (this atlas row's semantics corrected by phase 29 to match — it had drifted stale) |
| Charm | RAPPORT iN dM | enemy deals N less damage while active | — | `+???` | round 2: fine where SWAY is live; inherits the threshold fix (plan #1) |
| Bulwark | THORNS iN dM | attacker takes N when it damages you | — | `+??!` | round 2: Bastion early 77→98, mid 14 — cannot kill non-attackers; boss 1.6x threat near-certain loss (plan #5 boss-tech) |
| Bulwark | RIPOSTE iN dM | armed one threat phase: the printed parry blunts the first hit by that much; an attack fully blocked = enemy takes N | — | `+??!` | round 2: as THORNS — wall holds, kill-path missing late (plan #5). 2026-07-13 card-clarity audit: semantics cell now defines the parry half ("parry 2" printed on measured-answer / the-adamant-wall had no definition anywhere in the atlas) |
| Echo | ECHO | the printed line fires twice | Rebound — kb:dawncaster/keywords/rebound.okf.md: cited as the "fires again a number of times" analogue (`cross-prior-art.md` §4.2); their counter-based repeat vs our flat double, mechanism differs | `++??` | round 2 PROVEN: Ouroboros paid-face fix took Refrain late 3→37% — biggest real gain of the cohort (plan #6 lint guards the class) |
| Echo | RECALL N | return N cards from discard to hand | — | `++??` | round 2 PROVEN: mid 90→99 with ECHO (Refrain). phase 29: renamed from REPRISE — same gate history, no mechanic change |

## Affliction glue (2 — beyond the hallmark pair)

| keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|
| PROLONG N | add N turns of duration to ALL your DoTs on the enemy | — | `????` T:n/a | phase 29: renamed from FESTER (name collided with "an infected wound" — read as another DoT species, not a duration extender); sole carrier festering-argument, orphan-tier support (1 card) |
| REARGUE iN | convert the enemy's Bleed↔Poison, +N intensity as it flips | — | `????` T:n/a | phase 29: renamed from TRANSMUTE (the word was double-booked with the unrelated X→WILD die-conversion sense, which stays inside FORGE's gloss); sole carrier currys-conversion, orphan-tier support (1 card) |
