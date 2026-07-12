# Phase 27 §3 — honest re-baseline re-derivations (2026-07-11)

**Commit:** `6ea123fce1646824fe13857e5541c4bbc17ddf66` (Turn Law, Phase 26 — these are
the FIRST Turn-Law-honest measurements). **Command:** `npm run combat-playtest --
--stage=all --policy=all --runs=60 --seed={1,2,3} --cards [--json]` — 144 cells/seed
(4 stages x 6 enemies x 8 policies x 60 runs, policy-pick decks).

Evidence files (this directory):
- `baseline-seed1.json` / `baseline-seed1.txt` / `baseline-seed2.json` / `baseline-seed3.json` — raw matrices
- `balance-bands.txt` — `npx vitest run combat-playtest.balance-bands` output (14/14 pass)
- `card-meta.json`, `dump-card-meta.ts`, `analyze-rebaseline.js`, `rederivation-analysis.json` — derivation pipeline
- Checked-in baseline regenerated: `docs/reports/baselines/deck-matrix-baseline.json`
  (seed-1 `--json`, meta-stamped at 6ea123fc; replaces the pre-Turn-Law provisional of f196d219)

**Accounting caveat (applies to every DoT/signature fraction below):** Phase 26
also landed the DoT-overkill attribution clamp (Gate 0 #2), so pre-law vs post-law
damage-mix fractions differ partly by accounting fix, not only by the Turn Law.

---

## 1. Stage curve vs the locked 80/50/25-35/0 doctrine (blind policy-pick)

| stage | doctrine | seed 1 | seed 2 | seed 3 | verdict |
|---|---|---|---|---|---|
| early | ~80% | 92.8% | 87.5% | 82.2% | slightly hot but in the doctrine's neighborhood |
| mid | ~50% | 5.3% | 3.0% | 28.0% | **badly under** (and high cross-seed variance) |
| late | 25-35% | 0.0% | 0.0% | 0.0% | **total collapse** |
| impossible | 0% | 0.0% | 0.0% | 0.0% | on target |

All-policy stage win rates (runs-weighted): seed 1 = 85.1/10.3/0.1/0.0,
seed 2 = 68.8/8.2/0.0/0.0, seed 3 = 66.4/13.0/0.0/0.0.

The pre-law reading (99/94/2/12 blind) was farm-inflated exactly as the audit
predicted: mid was never ~94%, and late's few pre-law wins were farm artifacts.
Under the law the curve is early-heavy and then falls off a cliff: **mid is ~3-28%
against a ~50% doctrine and late is flat 0% against 25-35%.** The curve doctrine is
now violated from mid onward — in the opposite direction from the farmed reading.

Win-path totals per 8,640 runs: victories 2,671/2,105/1,956 (seeds 1/2/3), CAPITULATE
30/73/268, mercy 0, concede 0, defeats 5,939/6,462/6,416. Alt-wins are near-absent;
the mercy path never fired in 25,920 runs.

## 2. Preset floors/ceiling vs calibration (balance-bands, 14/14 pass)

Calibration: early floor 0.20 (ratchet 0.40) · mid floor 0.00 (ratchet 0.25) ·
ceiling 1.00 (target 0.98). `[preset-spread]` readings (early/mid/late):

| preset | early | mid | late |
|---|---|---|---|
| erosion | 1.00 | 0.38 | 0.00 |
| oratory | 0.97 | 0.05 | 0.00 |
| foundry | 0.88 | 0.02 | 0.00 |
| penitent | 0.97 | 0.13 | 0.00 |
| standstill | 1.00 | 0.07 | 0.00 |
| augury | 1.00 | 0.03 | 0.00 |
| tithe | 0.97 | 0.20 | 0.00 |
| grace | 1.00 | 0.00 | 0.00 |
| bastion | 1.00 | 0.00 | 0.00 |
| refrain | 1.00 | 0.05 | 0.00 |

- **Early floor/ratchet: PASS everywhere** (min 0.88 foundry, well above the 0.40 ratchet).
- **Early ceiling: 6 of 10 presets sit at 1.00**, above the 0.98 target (at, not over,
  the hard 1.00 ceiling). Early is too safe.
- **Mid ratchet 0.25: only erosion (0.38) clears it**; tithe grazes at 0.20; grace and
  bastion are at literal 0.00. The mid floor (0.00) technically holds because it is zero.
- **Late: all ten presets at 0.00** — consistent with the §1 late collapse.
- `[curve]` shape check: all ten presets decay monotonically (move -0.88 to -1.00, all OK,
  no KNOWN_CURVE_VIOLATORS) — the *shape* is right, the *level* from mid onward is not.

## 3. statusEngagement by stage — did the collapse survive the law?

Pre-law (farmed, blind witness): 66% -> 34% -> 22% -> 16%.

| cut | early | mid | late | impossible |
|---|---|---|---|---|
| seed 1 blind | 35.8% | 20.2% | 13.1% | 15.7% |
| seed 2 blind | 33.8% | 20.9% | 11.9% | 13.7% |
| seed 3 blind | 31.8% | 20.5% | 10.4% | 11.0% |
| seed 1 all-policy | 27.9% | 16.8% | 12.2% | 13.0% |
| seed 2 all-policy | 25.6% | 16.6% | 13.6% | 14.7% |
| seed 3 all-policy | 23.6% | 16.1% | 12.3% | 13.0% |

**The collapse survived the law and the whole curve dropped.** The declining arc
(early >> mid > late ≈ impossible) is intact at roughly ~34% -> ~20% -> ~12% -> ~13%
(blind), i.e. the farmed early reading was ~2x inflated (66% -> ~34%) while mid/late
lost proportionally less. Status play never rises above ~36% of card plays at any
stage under honest turns — this remains the single loudest doctrine failure
("status effects are the MAIN fun"), now with honest magnitudes attached.

## 4. Signature damage share and dead-card rate

**Signature damage share** (proxy: `strikeFraction` = direct enemy-HP loss excl.
mechanic bursts; with card strikes schema-dead, this is signature-skill damage),
runs-weighted, all policies:

| seed | early | mid | late | impossible |
|---|---|---|---|---|
| 1 | 43.8% | 46.5% | 46.6% | 46.4% |
| 2 | 40.1% | 41.8% | 41.4% | 41.1% |
| 3 | 30.9% | 51.0% | 35.4% | 33.1% |

DoT fraction sits at 56-63% early falling to 33-50% late; mechanic bursts 0-34%
(seed-3 late/impossible spike to ~32-34%). The pre-law matrix read signatures at
only 4-16% by stage while farmed transcripts showed 90-95% — the honest number is
in between and big: **signatures deliver roughly 31-51% of ALL enemy HP loss at
every stage.** The Gate-0 §4 repricing question is still live (the 70-card library
splits the remaining ~half with a generic Conviction battery), but the monoculture
is nowhere near the 90-95% transcript reading. (Accounting caveat in the header applies.)

**Dead-card rate** (library = 70 cards):

| cut | seed 1 | seed 2 | seed 3 | pre-law |
|---|---|---|---|---|
| blind+greedy (tuned witnesses) | 68.6% (48) | 78.6% (55) | 75.7% (53) | 69% |
| all eight policies | 24.3% (17) | 34.3% (24) | 34.3% (24) | 24.3% |

**Unchanged to slightly worse.** ~7 in 10 library cards are never played by the
tuned witnesses; the Turn Law did not free up deck circulation (fewer dice-turns
per fight means fewer plays, if anything). Full never-played lists per seed:
`rederivation-analysis.json` -> `perSeed.<n>.deadCards_*`.

## 5. WS1 line-telemetry offender re-cut (LIBRARY list)

Rule: common/uncommon (40 cards; 0 tagged `intentionallyAsymmetric`), FREE
(`topPlays`) or PAID (`bottomPlays`) share of plays >0.85 or <0.15, >=20 plays in
each seed, flagged in **all three seeds**. Aggregated over the whole matrix per seed.

### The official Turn-Law-honest library offender list is EMPTY (0 offenders).

The pre-law list of 8 dissolves entirely — every one now reads mid-band
(freeShare = FREE-line share of plays; plays per seed in parens):

| pre-law offender | seed 1 | seed 2 | seed 3 |
|---|---|---|---|
| cassandras-burden | 0.56 (5,520) | 0.63 (3,463) | 0.35 (3,668) |
| common-ground | 0.43 (4,111) | 0.62 (4,191) | 0.62 (2,895) |
| disarming-smile | 0.60 (6,594) | 0.54 (3,345) | 0.53 (12,370) |
| glimpse | 0.63 (5,600) | 0.67 (8,337) | 0.57 (3,425) |
| half-step | 0.64 (24,140) | 0.67 (23,586) | 0.73 (20,056) |
| refrain | 0.56 (4,448) | 0.54 (7,302) | 0.51 (8,566) |
| sketch-of-a-thought | 0.52 (3,530) | 0.49 (13,058) | 0.37 (6,698) |
| slippery-slope | 0.57 (15,195) | 0.56 (14,969) | 0.56 (13,177) |

(Their sandbox conversion sets — `free-line-conversions` etc. — were NOT active in
these runs; the library lines themselves are healthy under honest turns.)

Single-seed transient flags (never repeated; watch list only, not offenders):
- seed 1: currys-conversion (free 0.85), winnowing (free 0.87)
- seed 2: arrow-paradox (free 0.99), brief-candle (free 0.98), nettle-cloak (free 0.89)
- seed 3: against-my-judgment (free 0.90), delphic-ambiguity (free 0.87)

The seed-to-seed swing (e.g. brief-candle 0.98 in seed 2 vs mid-band elsewhere)
says per-seed policy-pick deck composition drives line choice more than card text
does — a caveat for any future single-seed offender cut.

## 6. dominantCardShare violations (>0.70)

Cells over the 0.70 line: **seed 1: 5, seed 2: 15, seed 3: 28** (of 144 each).
Full detail in `rederivation-analysis.json` -> `dominantViolations`. Patterns:

- **cassandras-burden** — the seed-1 signal (all 5 cells, mid, turtle/mercy-seeker,
  up to 0.80) and seed-2 late/impossible turtle (0.80-0.92). Recurs in 2 of 3 seeds.
- **straw-mans-jab** — early turtle/control-lock cells, seeds 2-3, including
  **literal 1.00 shares** in every seed-3 control-lock early cell.
- **slippery-slope** — seed-3 mid/late aggro-brute (1.00) and turtle (0.71-1.00).
- **sig-disarming-plea** — seed-3 early mercy-seeker (0.80-0.96).

Nearly all violations sit in degenerate-policy cells (turtle, aggro-brute,
control-lock, mercy-seeker), mostly losing ones (wr 0.00-0.37) — a stalling policy
replaying its one legal card. The tuned witnesses (greedy/blind) never breach 0.70.
Library-level watch: cassandras-burden and straw-mans-jab are the only cards that
breach in more than one seed.

---

## Headline

1. Late-stage collapse: blind mid 3-28% (doctrine ~50), late 0% everywhere
   (doctrine 25-35) — the honest curve fails LOW from mid onward.
2. statusEngagement collapse survived the law at ~34->20->12->13% (blind);
   early was ~2x farm-inflated pre-law.
3. Signatures carry ~31-51% of all enemy HP loss at every stage (honest read of
   the pre-law "90-95%" transcript panic).
4. Dead-card rate unchanged: ~69-79% of the library never played by blind+greedy.
5. The WS1 library line-offender list is EMPTY — all 8 pre-law offenders dissolved.
6. Dominance violations are degenerate-policy artifacts except cassandras-burden
   and straw-mans-jab (multi-seed).
