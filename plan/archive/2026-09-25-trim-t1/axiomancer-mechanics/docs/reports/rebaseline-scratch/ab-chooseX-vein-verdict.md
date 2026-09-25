> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/docs/reports/rebaseline-scratch/ab-chooseX-vein-verdict.md`. Describes removed or never-built code; not a source of rules.

# A/B evidence — sandbox set `chooseX-vein` (The Open Vein, WS7.2)

Cut at HEAD e203fed9 (post Turn Law + cloud reconciliation). Matrix:
`--stage=all --policy=all --runs=60 --cards --sandbox=chooseX-vein`, seeds 1-3
(seed 3 JSON-only tiebreaker; baseline-seed3 existed). Baselines: the fresh
`baseline-seed{1,2}.txt` cut at the same HEAD. First Turn-Law-honest numbers
for this set.

Files: `ab-chooseX-vein-seed{1,2}.txt`, `ab-chooseX-vein-seed{1,2,3}.json`,
`ab-chooseX-vein-xdist.{json,txt}` (chosen-X probe), `chooseX-probe.ts`.

## Stage win-rate deltas (A/B − baseline)

| stage | seed1 base→ab | seed2 base→ab |
|---|---|---|
| early | 85% → 85% (0) | 69% → 69% (0) |
| mid | 11% → 12% (+1) | 8% → 12% (+4) |
| late | 0% → 0% (vic 2→4) | 0% → 0% (vic 1→2) |
| impossible | 0% → 0% (vic 0→1) | 0% → 0% (0) |

Per-cell |Δwin| ≥ 10pp: 7/144 cells (seed1), 10/144 (seed2), all mid-stage
(largest: mid|tri-eyes greedy/blind +53/+58pp, mercy-seeker −35/−38pp).
CONFOUND: at seed2 the vein was drafted into ZERO cells yet the same big mid
swings appear — the deltas are policy-pick draft-composition shuffle from
adding a 71st eligible card, not the vein's own play. Cell deltas here are
NOT attributable to the card.

## The Open Vein telemetry

- **seed1**: 1829 plays across **10/144 cells — all mid-stage, only `turtle`
  and `mercy-seeker`** (the two min-X temperaments). Lines: 1515 free (tickOne,
  83%) / 314 paid (RECOIL X, 17%); statusLands 314 (poison lands on every paid
  play); fizzles 7 (0.4%); unplayed-at-phase-end 0; HP attribution free 1,342 /
  paid 3,539 (≈4.9k total — a rounding error of stage totals; never the
  dominant card in any cell; dominant share ≪ 70%).
- **seed2**: drafted into **0/144 cells**, 0 plays (listed never-played).
- **seed3**: drafted into **0/144 cells**, 0 plays.
- Drafted-into-wins across all three seeds: **1 winning run** (seed1
  mid|tri-eyes|mercy-seeker, 1 victory / 60) out of 600 vein-deck runs and
  25,920 total runs.

## Chosen-X distribution

- **Probe** (`ab-chooseX-vein-xdist.txt`; policy chooseX + engine
  `recoilXRange` clamp over real encounter states, all stages × enemies ×
  seeds 1-20 × HP depths 100/60/30%): greedy/blind modal **30** (useful max =
  ceil(MAX_EFFECT_INTENSITY/poisonPerX)), turtle (and all no-chooseX policies)
  modal **3** (printed min), chaos modal **18**, uniform spread [3,611], 171
  distinct values. Greedy/turtle/chaos modes all differ.
- **Hermetic e2e** `src/Combat/e2e/recoil-x.engine.test.ts` (5 tests, incl.
  the WS7.2 modal-X gate) passes at HEAD.
- **Realized in-matrix**: DEGENERATE — the only policies that ever drafted the
  card are turtle and mercy-seeker, so **all 314 paid plays were X=3** (the
  printed minimum). Greedy/chaos never had it in deck; their modal X is
  unobservable in the matrix as drafted today.

## Gate verdicts (WS7.2)

1. **"The Open Vein sees play" — FAIL.** Drafted in 10/432 cells across three
   seeds (2 of 3 seeds: zero), only by the two most passive temperaments, and
   sat in a winning deck exactly once (1/600 vein-deck runs). It escapes the
   parent-plan dead-card kill condition ("never drafted into wins") by that
   single run — NOT named KILLED, but it is one run from dead. The failure is
   draft appeal (policy-pick scoring never selects it for greedy/blind/
   dot-weaver/control-lock/aggro-brute/chaos), not the mechanic.
2. **"Chosen-X distribution non-degenerate across policies (greedy/turtle/
   chaos modal X differ)" — PASS at the mechanism level** (probe: 30/3/18;
   e2e gate green at HEAD), **with an honest caveat**: the matrix itself
   cannot witness it — realized in-matrix X is 100% X=3 because only min-X
   policies draft the card. The picker works; the card never reaches the
   policies that would exercise it.

Overall: the RECOIL-X mechanic clears its non-degeneracy gate; the card
carrying it does not see meaningful play. Card-level follow-up (draft-weight /
pricing appeal, not a kill) belongs to /deck-tuning.
