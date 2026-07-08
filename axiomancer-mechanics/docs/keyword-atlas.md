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
| RUPTURE | consume ALL enemy afflictions: 1.5x remaining DoT fuel + 3/non-DoT stack | — | `????` T:n/a | |
| CONJURE | create one-use Thoughtform card in hand | — | `????` T:n/a | |

## Theme signatures (2 x 10)

| theme | keyword | semantics | Dawncaster analogues (receipts) | gate (E/P/D/T) | notes |
|---|---|---|---|---|---|
| Affliction | POISON iN dM | ramping DoT, escalates per turn | — | `????` | |
| Affliction | BLEED iN dM | front-loaded DoT, decays 1 intensity per trigger | Bleeding — kb:dawncaster/keywords/bleeding.okf.md (src-001, community, medium): reactive ("when dealt damage, +1 per stack, then stacks −1") vs our proactive per-round tick; their stack economy transfers, their magnitudes do not | `????` | |
| Peroration | PREMISE | persistent tally (argument under construction) | — | `????` | |
| Peroration | PERORATION | declared conclusion; fires FREE at printed Premise count | — | `????` | |
| Forge | KINDLE | temporary die, this combat only | — | `????` | |
| Forge | PIP | +1 pip to a held die; spendable by payoff verbs | — | `????` | |
| Akrasia | RECOIL N | pay N VITAE (unpreventable) as printed cost | — | `????` | |
| Akrasia | FALLEN | state: >=2 self-afflictions; gates riders | — | `????` | |
| Control | STAGGER N | remove N rungs from telegraphed action; 0 rungs = denied | — | `????` | |
| Control | BACKFIRE iN dM | enemy takes N per rung its actions lose | — | `????` | |
| Oracle | FORETELL N | see/reorder top N of deck + glimpse next telegraph | — | `????` | |
| Oracle | OMEN | declared prediction; rider fires free if true by next turn | — | `????` | |
| Harvest | SOUL | gain 1 Soul when an enemy affliction expires or is consumed | — | `????` | |
| Harvest | REAP N | spend N Souls to fire printed effect | — | `????` | |
| Charm | SWAY N | enemy stacks, decay 1/turn; SWAY >= enemy HP at end of turn = CAPITULATE | — | `????` | |
| Charm | RAPPORT iN dM | enemy deals N less damage while active | — | `????` | |
| Bulwark | THORNS iN dM | attacker takes N when it damages you | — | `????` | |
| Bulwark | RIPOSTE iN dM | full block by Guard/Barrier = enemy takes N | — | `????` | |
| Echo | ECHO | the printed line fires twice | — | `????` | |
| Echo | REPRISE N | return N cards from discard to hand | — | `????` | |
