# Keyword atlas — the registry's scoreboard and prior-art cache

Owned by the `card-expert` agent (`.claude/agents/card-expert.md`).
One row per registry keyword (spec 32 §3 — exactly 30 while the
proving gate holds). Two jobs:

1. **Prior-art cache.** The `Dawncaster analogues` cell caches KB
   lookups so they aren't re-derived every session. Every analogue
   carries its `kb:` receipt — **no receipt, no entry**. The atlas is
   a cache, not a source: verify against `kb/` when a row smells stale.
2. **Proving-gate scoreboard.** The `gate` cell tracks the §4b criteria
   from `/deck-tuning`, in order **E**xercised / **P**riced honestly /
   not **D**ominant / **T**heme-honest (T applies to the 20 theme
   signatures; utility keywords carry `T:n/a`). Marks: `+` passing,
   `!` failing (forge target), `?` not yet assessed. When all 30 rows
   are `+` across a full sweep, the proving gate is satisfied and the
   owner decides whether to open the registry past 30.

Update discipline: `/deck-tuning` (via card-expert) updates affected
rows in the same PR as any card/keyword change. Semantics cells are
one-line summaries — spec 32 §3 stays authoritative.

## Utility (10)

| keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|
| DRAW N | draw N cards | — | `????` T:n/a | |
| FORGE | permanent floating die; cap 3, at cap converts to +1 Conviction | — | `????` T:n/a | |
| GUARD N | block next N damage; fades at round end | — | `????` T:n/a | |
| BARRIER N | as Guard, persists until consumed | — | `????` T:n/a | |
| TICK | one enemy DoT ticks now (duration unchanged) | — | `????` T:n/a | |
| MARK iN dM | +1 per stack to each DoT tick / payoff hit; counts as affliction | — | `????` T:n/a | |
| CLEANSE N | remove N of your own afflictions | — | `????` T:n/a | |
| HEAL N | restore N VITAE | — | `????` T:n/a | |
| RUPTURE | consume ALL enemy afflictions: 1.5x remaining DoT fuel + 3/non-DoT stack | — | `!???` T:n/a | round 2: 80-HP cap makes a full detonation irrelevant vs 1,000-1,500 HP late pools — bottleneck named by 4 decks (plan #2) |
| CONJURE | create one-use Thoughtform card in hand | — | `????` T:n/a | |

## Theme signatures (2 x 10)

| theme | keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|---|
| Affliction | POISON iN dM | ramping DoT, escalates per turn | — | `+??!` | round 2: Erosion mid 21→55 but late 0% — durationed DoTs decay before eroding 1,000+ HP bosses (plan #3 persistence-by-stack) |
| Affliction | BLEED iN dM | front-loaded DoT, decays 1 intensity per trigger | Bleeding — kb:dawncaster/keywords/bleeding.okf.md (src-001, community, medium): reactive ("when dealt damage, +1 per stack, then stacks −1") vs our proactive per-round tick; their stack economy transfers, their magnitudes do not | `+??!` | round 2: same late decay wall as POISON (plan #3) |
| Peroration | PREMISE | persistent tally (argument under construction) | — | `++!?` | round 2: Oratory 100/100/100 — flat 8-Premise CONCEDE ignores the stage curve (plan #1 scaled thresholds + boss Premise-shed) |
| Peroration | PERORATION | declared conclusion; fires FREE at printed Premise count | — | `++!?` | round 2: dominance carrier of the CONCEDE path (plan #1); NERF target, not buff |
| Forge | KINDLE | temporary die, this combat only | — | `!???` | round 2: Foundry mid/late 0% — pip engine has no uncapped spender (plan #2 cap, plan #5 boss-tech rare) |
| Forge | PIP | +1 pip to a held die; spendable by payoff verbs | — | `!???` | round 2: as KINDLE — banked pips cannot cash past the 80-HP cap (plan #2) |
| Akrasia | RECOIL N | pay N VITAE (unpreventable) as printed cost | — | `+?!?` | round 2 REGRESSION: Penitent mid 78→58, late 5→1 after rebalance — standing ! until plan #2 lands |
| Akrasia | FALLEN | state: >=2 self-afflictions; gates riders | — | `+?!?` | round 2: Fallen comes online but payoff bursts cap out vs boss HP (plan #2) |
| Control | STAGGER N | remove N rungs from telegraphed action; 0 rungs = denied | — | `++!?` | round 2: Standstill 100/100/100 — flat rung denial ignores the stage curve (plan #1: boss rung-regrowth) |
| Control | BACKFIRE iN dM | enemy takes N per rung its actions lose | — | `++!?` | round 2: rides the Standstill lock (plan #1); ~11-round late grinds but never lost |
| Oracle | FORETELL N | see/reorder top N of deck + glimpse next telegraph | — | `+???` | round 2: Augury early 69→91 once omens landed as described |
| Oracle | OMEN | declared prediction; rider fires free if true by next turn | — | `+??!` | round 2: mid only 8%, late 0% — prophecy payoffs do not out-scale boss HP (plan #2) |
| Harvest | SOUL | gain 1 Soul when an enemy affliction expires or is consumed | — | `+??!` | round 2: Tithe mid 15→23 with REAP cap lifted to 200 — full harvest needs more rebuild cycles than a fight lasts (plan #2, #3) |
| Harvest | REAP N | spend N Souls to fire printed effect | — | `!???` | round 2: the 200-cap exception PROVES the flat-cap model is wrong (plan #2 scaling formula; retire the exception) |
| Charm | SWAY N | enemy stacks, decay 1/turn; SWAY >= enemy HP at end of turn = CAPITULATE | — | `+??!` | round 2: Grace late 0% — matching a boss FULL HP bar is unreachable; needs the Charmed-style resolve threshold (plan #1) |
| Charm | RAPPORT iN dM | enemy deals N less damage while active | — | `+???` | round 2: fine where SWAY is live; inherits the threshold fix (plan #1) |
| Bulwark | THORNS iN dM | attacker takes N when it damages you | — | `+??!` | round 2: Bastion early 77→98, mid 14 — cannot kill non-attackers; boss 1.6x threat near-certain loss (plan #5 boss-tech) |
| Bulwark | RIPOSTE iN dM | full block by Guard/Barrier = enemy takes N | — | `+??!` | round 2: as THORNS — wall holds, kill-path missing late (plan #5) |
| Echo | ECHO | the printed line fires twice | — | `++??` | round 2 PROVEN: Ouroboros paid-face fix took Refrain late 3→37% — biggest real gain of the cohort (plan #6 lint guards the class) |
| Echo | REPRISE N | return N cards from discard to hand | — | `++??` | round 2 PROVEN: mid 90→99 with ECHO (Refrain) |
