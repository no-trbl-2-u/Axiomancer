> **Archived** 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1). Original path: `axiomancer-mechanics/scratch/price-experiment/report/FINDINGS-36b-seed5.md`.

# Phase 36b proof gate — seeds=5 re-run on post-33b main

**Status:** HISTORICAL — a dated price-experiment snapshot; keyword prose
below (capitulate/concede) reflects the registry as it read at capture time,
not the live phase-44b-renamed vocabulary (CHARGE/CONDEMN/PLEA/RELENT).

_Row-mandated proof gate: re-run the scratch ladder + 10-preset sweep +
fix-test ON TOP OF phase 33b's enemies at seeds ≥ 5 (the original
`FINDINGS.md` data was seeds=2 on a pre-33b branch), with the down-scaler
clamp fixed first. Harness `price-winrate.harness.ts`, policy `blind`,
runs=40, seeds=1..5. Outputs: `out/seed5-presets.json`,
`out/seed5-ladder-erosion.json`, `out/seed5-fix-test.json`._

## Headline: the tempo hypothesis HOLDS at higher confidence

Every claim `FINDINGS.md` used to justify Phase 36b reproduces on current
main (33b enemy counterplay live) at 2.5× the seeds. The one thing that
changed is the *right* thing: after the 36b `scoreCard` reprice, the ladder's
`avgSpell` drops (erosion x1 8.09 → 7.26) because the slow-ramp poison is no
longer overpaid.

## 1. The late wall is a survival/tempo wall, not a price wall (erosion ladder)

| tier | avgSpell | early | mid | late | impossible |
|---|---|---|---|---|---|
| x0.5 | 6.73 | 91% | 44% | 3% | 1% |
| x0.75 | 6.73 | 91% | 44% | 3% | 1% |
| x1 | 7.26 | 91% | 44% | 3% | 1% |
| x1.5 | 12.48 | 93% | 56% | 4% | 0% |
| x2 | 13.46 | 93% | 59% | 4% | 0% |
| x3 | 22.37 | 95% | 67% | 6% | 1% |
| x4 | 33.62 | 96% | 70% | 9% | 1% |

- **Late crawls 3% → 9% across ~5× price** — the wall holds. `avgRoundsAll`
  pins ~4.07 at EVERY tier (the death clock is set by enemy output, not the
  player's card budget). Mid converts cleanly (44% → 70%); early is a
  saturated ceiling (91% → 96%, cashing out as kill-speed).
- **Down-scaler clamp fix confirmed:** x0.5/x0.75 (6.73) now sit meaningfully
  BELOW x1 (7.26); pre-fix they were byte-identical to x1. They collapse
  together (integer-intensity coarseness) but the sub-1× tiers are no longer
  no-ops — and they show late win-rate is *identical* at half price, i.e.
  price is the wrong late lever in both directions.

## 2. The tempo-axis fix-cards convert price → wins (fix-test)

| stage | baseline erosion | tempo-wall fixes | Δ |
|---|---|---|---|
| early | 91% | 95% | +4 |
| mid | 44% | **55%** | **+11** |
| late | 3% | **7%** | **+4 (>2×)** |
| impossible | 1% | 2% | +1 |

`avgSpell` 8.09 → 8.63 (+0.54). Re-shaping erosion's 5 slowest cards into
front-load (RUPTURE burst), faster-payoff (BLEED + tick-forcing), and a
survival sliver (stacking BARRIER + STAGGER) converts +11 pts mid and >2×
late for almost no extra budget — exactly the axis 36b's `scoreCard` term now
rewards. Confirms `FINDINGS.md` §"fix-card proposal" at seeds=5.

## 3. Alt-win decks still price backwards (re-confirms Phase 36a's premise)

Cheap CAPITULATE decks match/beat pricier ones; the only deck alive late wins
by CONCEDE, invisible to the old price model:

| preset | avgSpell | early win | dominant late path |
|---|---|---|---|
| Grace (charm) | 5.62 | 73% (all CAPITULATE) | — (0% late) |
| Foundry (forge) | 7.52 | 62% (all CAPITULATE) | — (0% late) |
| Oratory (peroration) | 7.43 | 94% | **20% late via CONCEDE** (161 concedes) |

Grace (cheapest) ≈ Foundry (pricier) on the same win path — price ranks them
backwards. Oratory alone survives late, carried by the CONCEDE track that
priced at ~0 before 36a's capstone. (36a shipped the currency half; this run
re-validates the need.)

## Caveats (respected)

- The 36b `scoreCard` reprice is a **model-fidelity** change — it does NOT
  move any of these IN-PLAY win-rates (it re-prices the design budget, not
  card behavior). Its payoff is downstream: `/deck-tuning` now gets a budget
  that rewards the front-loaded shape this run proves converts.
- The late wall is unchanged and unclimbed by price — that is FINDINGS rec #4
  (enemies/survivability, not price) and remains out of 36b scope.
- p = 0.75 is `// PLAYTEST-CALIBRATION`; seeds=5 firms the big trends
  (erosion mid slope, the flat late wall, the fix-test conversion) but the
  exact horizon constant is `/deck-tuning`'s to confirm at higher seeds.
