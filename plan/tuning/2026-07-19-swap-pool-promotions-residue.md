# Swap-pool promotions — residue + follow-up queue (2026-07-19, evening)

> Promotion session, filed as residue. The owner ratified a pool-to-library
> path by ballot (superseding the R1 "not-player-facing" gate for these
> cards): the measurement report's queue-of-8 PLUS half-spoken-prophecy,
> with color-law breaks resolved by RECOLORING THE CARD (not re-partitioning
> the recipe). All nine shipped and MERGED as PR #138
> (`fc98fb7a` on `balance/deck-promotions-2026-07-19`, off post-D9 main).
> Record of record:
> `axiomancer-mechanics/docs/reports/deck-tuning-2026-07-19-promotions.md`.
> Precedes: `2026-07-19-swap-pool-measurement-residue.md` (same day). The
> Swap-Pool Atlas artifact was updated in place with the promotion table.
>
> **Ballot rulings absorbed (never re-ask):** (1) promotion path RATIFIED
> for measured winners — the pool is a farm system now, not a sealed lab;
> (2) color-law resolution = recolor the card, recipe partitions stay;
> (3) QED's concede-centrality accepted. STILL OPEN from the morning
> ballot: grace HP-purity direction (white-flag-woven stays benched on the
> disenchant-slot break), turtle/mercy-seeker roster health.

---

## A. What shipped

Nine promotions into `cards.library.ts` + preset seats (evicted incumbents
stay as unseated reward cards): poisoned-well (erosion, D8 valve re-seated
onto it, flag-on RATIFIED: win +0.050/+0.083/+0.011 by stage), videtur-quod
+ quod-erat-demonstrandum (oratory), tempered-edge (foundry), grace-under-fire
(grace), pebble-in-the-boot + the-anvil-speaks (bastion), half-spoken-prophecy
(augury, RECOLORED mind→body — the one ratified needs-more-data promotion),
the-burden-of-repetition (refrain, RECOLORED heart→body).

Combined-matrix verification: 6 of 9 reproduced their single-arm A/Bs
exactly; two were SUPER-additive (oratory pair: late 0.119→0.331; bastion
pair: mid 0.070→0.177); one PARTIAL (burden — see C3). Gates all green:
balance-band e2e (curve-violator set stays empty), mechanics verify (4,019
tests), mobile verify (2,658), card-editor type-check. Baseline re-stamped
at the post-promotion tree. Pins: library 70→79, unseated pool 10→18, swap
pool 300→291 (PROMOTED_OUT residual-quota map), 3 valve re-seats (all
same-aspect), PRESET_COLOR_BORROWS shrinks (augury/grace/refrain
un-borrows), keyword-atlas rows updated (POISON, PREMISE, OMEN, RUPTURE,
SWAY, THORNS, ECHO, PIP, MARK).

## B. TOP follow-up — oratory breaks the impossible-stage doctrine

**`preset:oratory` beats the impossible stage at 0.52 blind flag-off /
0.40 flag-on** (pre-promotion control 0.27; doctrine: starter presets ≈ 0,
"losing is the design"). The band e2e does not pin preset-vs-impossible,
so the gate stayed green — that is a WITNESS GAP as well as a balance
breach. Late blind 0.331 also sits at the very top of the 0.25–0.35 band.

- Preferred fix (already ruled, morning session R3): enemy-side brake —
  premiseShed on The Incompleteness phase 3 (+ optional unique-tier
  concede floor 12→14). Enemy-content edit, OUTSIDE /deck-tuning's card
  surface; queue as its own small item and RE-MEASURE oratory impossible
  after it lands.
- Alternative documented in the report: single-seat QED revert
  (the-closing-word back at the rare seat).
- Witness follow-up: consider pinning impossible-stage ceilings per PRESET
  (not just policy-pick) in the balance-band e2e so this class of breach
  fails loudly next time.

## C. Other follow-ups (no owner input needed)

1. **Winnowing downtune probe (refrain):** behind burden, winnowing is the
   dominant card in every mid/late cell, mean dominantCardShare 0.84 mid /
   0.93 late (control 0.80/0.80; its own line share 0.074/0.154). Run the
   burden+winnowing-downtune A/B as its own arm before any further refrain
   seating.
2. **CONCEDE telemetry watch:** 44% of oratory mid wins / 87% of late wins
   route through CONCEDE post-promotion (owner accepted the direction; the
   87% exceeds the 71% single-arm figure quoted at ratification — keep the
   win-path decomposition in every future oratory sweep).
3. **Burden negative shading:** its win lift did NOT reproduce at post-D9
   HEAD (mid blind +0.030, ALL8 −0.019) though the sE lift fully did
   (+0.066 ALL8, still the largest engagement gain measured). If refrain
   drifts, this seat is the first re-audit.
4. **Half-spoken-prophecy fizzle watch:** 628–721 fizzles/stage
   (precondition-gated RUPTURE) — if a future pass adds an augury seed
   line, re-measure; augury's mid ~0.00 stays structural (engine handoff).
5. **Pool hygiene after promotion:** swap-pool quotas now uneven per theme
   (291 cards, PROMOTED_OUT map). Next authoring pass should decide whether
   to backfill promoted-out seats to restore 30/theme or let the pool
   drain by design.

## D. Morning-ballot residue — RESOLVED via /oversight 2026-07-20

- **Grace HP-purity direction → g1 (grace stays HP-pure).** white-flag-woven
  ratified; g3 mark-pair rejected for shipping (off-doctrine HP kill line).
  Rider: white-flag-woven still needs a disenchant recipe-slot ruling
  (mechanics, `/deck-tuning`). See the measurement-residue §C for the full
  drain.
- **turtle / mercy-seeker early collapse → regression, investigate.** Flagged
  as a roster regression (not accepted-by-design); `/deck-tuning` follow-up to
  check whether the Press Fate loadout starves defensive policies (PR #125).

## E. Precedent

This is the first pool→library promotion under the swap-pool program:
measured A/B (≥2 stages, ≥2 policies, identical seeds) → owner ballot →
recolor-not-repartition → combined-matrix re-verification → pins updated in
the same PR. Treat this file + the promotions report as the template for
future promotion passes.
