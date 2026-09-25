# Card-library metrics accumulation — full-matrix data drop (2026-07-18)

> Dated data report. Exercises the PR #119 metrics slate at full resolution and
> files the accumulated card-library dataset. MEASUREMENT + READING ONLY — no
> card, preset, or engine change ships here; follow-ups route to `/deck-tuning`
> and the D8 valve phase.
>
> **Stamp:** 2026-07-18 · tree `0f7f0500` (post-FLIP, post-metrics-slate) ·
> instrument `npm run combat-playtest -- --deck=preset:all --policy=all
> --stage=all --runs=60 --json` · four sweeps: {flag-OFF, flag-ON} × {seed 1,
> seed 101}, each 1,440 cells (10 presets × 8 policies × 18 stage-enemy cells)
> × 60 runs = 86,400 encounters per sweep, **345,600 encounters total** ·
> deck-matrix baseline re-stamped the same session (`baseline:regen --runs=60`,
> confidence **full**, commit 0f7f0500 — the 3-commit staleness alarm is
> reset).
>
> **Data files (committed):**
> `axiomancer-mechanics/docs/reports/preset-metrics/2026-07-18-{flagoff,flagon}-seed{1,101}.json`
> — compact per-sweep exports (stage summaries, preset rollups, card coverage,
> global + per-preset card aggregates, pooled per-cell dWR) — and
> `2026-07-18-analysis-tables.md` (the full seed-1 two-arm table dump). Raw
> 4 MB PlaytestReport JSONs are not committed; the sweeps are deterministic —
> the commands above regenerate them byte-identical on this tree.

Extends `axiomancer-mechanics/docs/reports/preset-sweep-2026-07-18.md` (the
first, blind-only runs=30 flag-OFF pass) with: all 8 policies, runs=60, the
flag-ON live-truth arm, seed replicates, per-preset card telemetry, and the
de-confounded dWR estimator.

---

## 1. The live game (flag-ON) sits below an already-failing curve

THE FLIP (`ae51ab3d`) means every app build now plays the Upgradeable-Dice
model, but the starter library was tuned flag-OFF. Same cells, side by side
(all-policy means):

| stage | flag-OFF win | flag-ON win | flag-OFF statusEng | flag-ON statusEng |
| --- | --- | --- | --- | --- |
| early | 78% | 67% | 23% | 18% |
| mid | 19% | 13% | 23% | 18% |
| late | 3% | 2% | 23% | 18% |
| impossible | 3% | 2% | 24% | 18% |

statusEngagement drops 5–9 points in EVERY preset×stage row — the D7 finding
reproduces at full resolution, now as the shipped experience. Biggest early-
stage win hits: standstill −24, penitent −21, augury −21, tithe −12, erosion
−11 (and erosion mid −22). Oratory, foundry, grace, bastion are barely moved.
**This is the D8 valve target list, with numbers.**

Blind-policy-only curve (the policy the doctrine bands are defined against;
`v` = under band, `^` = over band):

```
             flag-OFF                      flag-ON (live)
preset      early  mid   late  imp        early  mid   late  imp
erosion       89^   37v    3v    0          79    25v    0v    0
oratory       92^   64^   12v   27^         90^   64^   14v   12^
foundry       60v    0v    0v    0          59v    0v    0v    0
penitent      81    18v    0v    0          56v    7v    0v    0
standstill    76     0v    0v    0          50v    0v    0v    0
augury        68v    1v    0v    0          45v    0v    0v    0
tithe         86^   16v    0v    0          76     2v    0v    0
grace         69v    0v    0v    0          71v    1v    0v    0
bastion       83     7v    0v    0          76     3v    0v    0
refrain       89^   42v    6v    0          84    33v    4v    0
```

Flag-ON, only 4 presets remain in/near the early band and NONE reach the mid
band except oratory. The doctrine curve (early ~80 / mid ~50 / late 25–35 /
imp 0) currently describes at most 2 decks (oratory, refrain), and oratory
violates it from above.

## 2. Oratory dominates where losing is the design

Oratory at the impossible stage: **32% flag-OFF / 18% flag-ON** (band ~0), and
its win-path mix shows why — it is the only preset with CONCEDE wins (the
8-Premise Peroration), and Peroration beats The Incompleteness. Every other
preset posts 0–1% there. Above-band at early AND mid too: the strongest
dominance finding in the library, and it survives both arms and both seeds.

## 3. Foundry and grace never touch the status doctrine

Both post **0% statusEngagement at every stage in every arm**, and their wins
are ~100% CAPITULATE (SWAY): foundry early 1,783 of 1,784 wins capitulate
(flag-OFF), grace 2,002 of 2,018. Two of ten starter decks operate entirely
outside "status is the main fun". Part metric blind spot (SWAY/RAPPORT lands
player-side, and statusEngagement counts enemy-side lands — the known 2026-07-12
limitation), part real identity call: the residue from the metrics-slate
session already queues this as a needs-user-call.

## 4. Mid-game cliff, confirmed at full resolution

The first sweep's headline holds with 8 policies and 60 runs: mid is a cliff
(19% mean vs the 50% band), late is uniformly under band (3% mean vs 25–35),
and four presets (foundry, standstill, grace, augury) are at 0–3% from mid
onward in the live arm. The early→mid transition, not late-game polish, is the
library's structural debt.

## 5. Per-card telemetry — the accumulated card-level dataset

**Dead cards (stable across all 4 sweeps):** the same 10 of 70 never see play —
achilles-and-the-tortoise, ad-nauseam, captive-audience, entropy-tax,
fated-course, heart-of-the-matter, memento-mori, practiced-cadence,
straw-mans-jab, the-tithe. All are reward-pool-only post-5/5/5; the trim/
duplicate conversation starts (and could end) here.

**Fizz league (fizzles / attempts, flag-OFF → flag-ON):** ouroboros 20→26%,
the-overtake 20→21%, second-thoughts 13→16%, winnowing 8→13%,
the-gleaners-due 11→12%, circular-reasoning 7→11%, currys-conversion 8→7%,
delphic-ambiguity 9→6%. Fizz generally WORSENS flag-on (dice gating) — these
are the frustration cards of the live build.

**Paid-line orphans (paid share of plays, flag-OFF):** the-overtake 3%,
ouroboros 8%, hedgehogs-dilemma 13%, irresistible-grace 15%, the-oracles-eye
20%, the-gleaners-due 20%. Their PAID lines are nearly dead weight in sim —
either the price is wrong or the policies can't afford them.

**dWR (win-rate-when-drawn delta), de-confounded:** the naive global dWR in
the per-card table is length-confounded — fast wins end before the deck is
seen, so "not drawn" runs are enriched with quick victories and nearly every
card reads spuriously negative. The committed exports carry a pooled PER-CELL
estimator (drawn vs not-drawn inside one stage×policy×enemy×deck cell,
weighted by the scarcer side). By that measure (weight ≥ 100):

- flag-OFF drags: mirror-of-guilt −11%, crown-of-thorns −9%, anvil-of-form
  −7%, the-overtake −6%, ouroboros −4%.
- flag-ON drags: self-flagellant −13%, the-overtake −11%, stuck-in-their-head
  −10%, anvil-of-form −9%.
- Genuine positives: winnowing +6% (flag-OFF), venom-and-vein +5% (flag-ON).

**Opportunity rate is saturated:** every fielded card posts opp% ≥ 90% and
unpl% ≈ 0 — the scripted policies play what they draw, so opp% is not yet a
discriminating cut signal. It will become one when a policy learns to hold
cards; until then dWR and fizz% are the card-level witnesses.

## 6. Complexity vs skill-gap — complicated decks don't reward skill

Static complexity spread: penitent cx=30.9 (14 keywords, 12 orphans!) down to
oratory cx=16.0 (8/4). Dynamic skill-gap (best-minus-worst policy win rate) is
small everywhere — 3–11% flag-OFF, and it COMPRESSES flag-on (grace 1%,
standstill 2%, tithe 3%): the decks mostly play themselves, and the dice model
makes play quality matter less, not more. The high-cx decks are precisely the
ones with near-zero skill payoff (penitent cx 30.9 / gap 9%→4%): complicated-
but-shallow, the worst quadrant. mercy-seeker is the best policy in 6/10
presets (flag-OFF); aggro-brute or turtle is the worst almost everywhere —
the doctrine's expected ordering, still intact.

## 7. Instrument notes (for the next reader)

- **Seed stability:** seed 1 vs 101, mean |Δwin| 0.9% (flag-ON) / 1.2%
  (flag-OFF), max 6.1% over the 40 preset×stage rows. Findings above clear
  that noise floor by an order of magnitude.
- **roundsStdDev works:** it exposes the stall tails — tithe impossible
  15.6±6.6 rounds, grace impossible 14.1±6.0 (long scripted losses), vs
  erosion's tight 3.0±0.6 early clock.
- **Doctrine bands vs policy mix:** `doctrineDelta`/`curveDeviation` in the
  rollups measure the ALL-POLICY mean against bands defined for blind
  policy-pick; the blind-only slice (§1) is the honest doctrine witness. Worth
  a flag on the instrument (`--doctrine-policy=blind`?) before the next sweep.
- statusEngagement blind spots (enemy-side-only, volume/arc-blind) remain as
  documented 2026-07-12; grace/foundry §3 must be read through that lens.

## Follow-ups routed

- **D8 preset dice valves** (queued phase): target list + magnitudes in §1 —
  standstill/penitent/augury/erosion/tithe are the wounded five.
- **/deck-tuning:** oratory impossible-stage dominance (§2, CONCEDE pricing);
  fizz league + paid-line orphans (§5); dead-card trim list (§5).
- ~~**Needs-user-call (already filed in the metrics-slate residue):** foundry/
  grace identity vs the status doctrine (§3).~~ **RESOLVED via /oversight
  2026-08-08 — ruled a DOCTRINE FAILURE, not an identity.** Restore
  `entropy-tax` (foundry's only status engine) and `heart-of-the-matter`
  (grace's authored SWAY finisher, seat held by off-theme `ouroboros`) to
  their seats, inside build-plan **Phase 39**. The §3 metric blind spot
  (statusEngagement counts only enemy-side lands, so player-side
  SWAY/RAPPORT reads as zero by construction) is acknowledged but was
  explicitly NOT accepted as the explanation — the owner declined the
  "exempt both decks and fix the metric" option.
- **Instrument:** blind-only doctrine flag; a card-holding policy to make
  opp% discriminating.
