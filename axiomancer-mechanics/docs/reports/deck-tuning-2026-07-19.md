# Deck Tuning — 2026-07-19 (erosion preset, scoped pass)

**Invocation:** `/deck-tuning --preset=erosion --runs=100 --cross-theme-swaps=false`
**Baseline stamp cited:** `docs/reports/baselines/deck-matrix-baseline.json` — `dc8bd79b`,
measured 2026-07-19, confidence: full, no mechanics-source commits since
(SessionStart hook + `npm run baseline:check`, ROOT).
**Cold suite gate:** all 5 witness suites pass before any work
(`combat-deck-draft.engine`, `cards-sandbox.engine`, `swap-pool.engine`,
`combat-playtest.balance-bands.sim`, `combat-playtest.card-coverage.sim` —
1045 tests, 0 failures).

**Runs-flag note:** this pass runs at `--runs=100` per the dispatch args, not
the stamped 60-runs/seed-1 baseline. All findings below are **directional**
per §2 of the skill; no change was applied this pass, so no 60-run
re-confirm was required (see §4).

**Cross-theme-swaps:** `false` (default) — every arm below is in-theme only
(erosion's own unseated library cards or its `swap-affliction` candidate
set). No cross-theme measurement arms were run.

## 1. Pool audit — erosion / affliction

Recipe (7 unique cards, 4/4/2/2/1/1/1, color law 5/5/5 body/heart/mind
confirmed):

- **Commons:** `slippery-slope` (body, poison ramp i1d4) x4;
  `opening-statement` (heart, borrowed from peroration — MARK d2 + poison
  i1d2 + 2 Premises) x4
- **Uncommons:** `festering-argument` (mind, PROLONG) x2; `currys-conversion`
  (mind, REARGUE) x2
- **Rare:** `resonance-detonation` (heart, RUPTURE ALL 50% / SIPHON 35% /
  RECALL 2)
- **Enchant:** `venom-and-vein` (body, +1 int / +1 dur all bleed/poison)
- **Disenchant:** `suppurating-curse` (mind, doubles round DoT damage)

D8 dice valve: `slippery-slope` only
(`PRESET_DICE_VALVES.erosion.replacesId`) — untouched by this pass.

`swap-affliction` (`src/Cards/swap-pool/affliction.swap-pool.ts`, 30 cards,
spell-type only) has no enchant/disenchant candidates, so `venom-and-vein`
and `suppurating-curse` are not swap-testable from this pool.

**Prior settled work (not reopened):** `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-19-swap-pool-measurement-residue.md`
and `docs/reports/deck-tuning-2026-07-18.md` §1 already measured all four
spell-slot arms with an obvious trial-first candidate:

| arm | verdict | note |
|---|---|---|
| e1 `slippery-slope→poisoned-well` | **PROMOTE-CANDIDATE** `[needs-user-call]` | mid 0.370→0.503; blocked on C1 |
| e2 `festering-argument→chronic-condition` | KEEP-INCUMBENT | PROLONG receipt, neutral |
| e3 `resonance-detonation→the-verdict-of-rot` | KEEP-INCUMBENT | trades away late burst |
| e4 `resonance-detonation→all-wounds-at-once` | KEEP-INCUMBENT | spam hypothesis refuted, share 0.31 |

That left two spell slots with zero prior swap-pool measurement —
`opening-statement` (heart x4) and `currys-conversion` (mind x2, the atlas's
explicitly-flagged "REARGUE remains unmeasured" gap) — plus the estimates
ledger's named dominance risk `aggravate-the-case` ("multiplicative with x4
seed density") and the pool's documented total absence of in-theme GUARD.
This pass's three hypotheses (H1-H3, §3) target exactly those open gaps.

## 2. Baseline matrix — erosion, `--runs=100 --seed=1`

```
npm run combat-playtest -- --stage=all --policy=all --deck=preset:erosion --runs=100 --seed=1 --cards
npm run combat-playtest -- --stage=all --policy=all --deck=preset:all --runs=100 --seed=1 --cards
```

### Doctrine spread (erosion only — this run is preset-scoped)

| stage | win | vs band | dev | statusEng | dotFrac | strikeFrac* | rounds±sd | util | H |
|---|---|---|---|---|---|---|---|---|---|
| early | 89% | 75-85 | +4% | 29% | 56% | 16-34% (policy-dependent) | 3.0±0.6 | 100% | 0.92 |
| mid | 41% | 45-55 | −4% | 31% | 50% | 16-35% | 4.3±0.5 | 100% | 0.91 |
| late | 4% | 25-35 (informational) | **−21%** | 30% | 40% | 16-23% | 4.1±0.4 | 100% | 0.91 |
| impossible | 1% | ~0% | 0% | 31% | 43% | 16-22% | 5.6±0.8 | 100% | 0.91 |

curve-dev = 7% (mean abs gap — mildest curve-dev failure of all 10 presets,
tied-best with `refrain` at 6-7%). skill-gap = 9% (mercy-seeker >
turtle). cx = 21.9 (kw=10, orph=8, heaviest carrier `opening-statement`, 6
keywords). Win-path mix: **100% victory/defeat at every cell** — zero
mercy/capitulate/concede anywhere. This is the theme's own fantasy (a pure
HP-kill DoT-and-detonate archetype), not an archetype-honesty problem.

`dominantCardShare = 100% (resonance-detonation)` at every stage — the
theme's single detonation finisher legitimately closes nearly every win;
flagging so it is not mistaken for a newly-discovered spam problem (this is
long-standing, carried from the 2026-07-18 pass).

Card coverage inside the 7-card recipe: **0 dead cards**, opp% 93-100% on
all seven. (The library-wide "90% dead-card rate" figure some runs surface
is a whole-library stat — 63/70 library cards simply aren't in this fixed
15-card recipe — not a within-deck finding.)

`*` strikeFraction here is `directHpDamage / totalEnemyHpLost`
(`combat.encounter.sim.ts`) — erosion carries no THORNS/RIPOSTE card, so the
nonzero reading is BACKFIRE-class engine drip tied to GUARD/block
interactions (higher under turtle/chaos, which block more), not a
raw-strike leak. Recorded so the number isn't misread as "the strike is
back" (spec 32 v3).

### Per-card table (control, all cells, runs=100)

| card | plays | free%/paid% | fizz% | opp% | hpP | dWR |
|---|---|---|---|---|---|---|
| opening-statement | 83,349 | 53/47 | 0% | 96% | 3,904,257 | −58% |
| slippery-slope | 76,179 | 40/60 | 0% | 94% | 2,754,950 | −58% |
| festering-argument | 41,899 | 70/30 | 0% | 96% | 132,418 | −58% |
| currys-conversion | 41,710 | 78/22 | 7% | 99% | 23,351 | −58% |
| resonance-detonation | 20,639 | 63/37 | 6% | 93% | 1,585,712 | −58% |
| venom-and-vein | 18,620 | 70/30 | 0% | 98% | 0 | −59% |
| suppurating-curse | 18,479 | 68/32 | 0% | 100% | 0 | −59% |

Line-balance: all seven cards sit within the 85/15 free%/paid% band — no
offenders this pass. `dWR` is uniformly ≈ −58/−59% across every card: an
artifact of the fixed 15-card preset (fast wins draw fewer cards, so
"drawn" samples skew toward longer, harder fights) — a metric-limitation
caveat, not a per-card finding.

### Drift finding

The checked-in `docs/reports/baselines/deck-matrix-baseline.json` was opened
to diff against — **its `report.presetSummaries` array is empty** (`meta.command`
is `--deck=policy-pick`, which drafts decks per sim-policy and never runs
`preset:erosion` / `preset:all`; the artifact literally carries no
per-preset data). This is a real process gap for any preset-scoped
`/deck-tuning` run (see §6). In its absence, diffed against the last
erosion-specific measurement on record, `docs/reports/deck-tuning-2026-07-18.md`
§1 (60 runs, seed 1, same commit lineage per the residue's stamp note):
mid/blind 37.0%→37.4%, late/blind 2.8%→2.5%, early aggregate 89.4%→89.0%.
**No drift** — within expected 60-vs-100-run sampling noise. This
corroborates the Step-0 baseline-freshness confirmation for the erosion
slice specifically.

## 3. A/B arms (`--sandbox=swap-affliction`, `--runs=100 --seed=1`, in-theme only)

Control for all three arms: the `preset:all` control pulled in §2 (erosion
cells).

### H1 — `opening-statement→the-veiled-sting`

Heart common x4, adds GUARD 8 — tests the pool's documented lack of
in-theme defend.

```
npm run combat-playtest -- --stage=all --policy=all --sandbox=swap-affliction "--deck=preset:erosion+swap:opening-statement/the-veiled-sting" --runs=100 --seed=1 --cards
```

| cell | control→treat | Δ |
|---|---|---|
| mid/blind | 37.4%→20.8% | −16.6 |
| mid/greedy | 38.2%→21.6% | −16.6 |
| late/blind | 2.5%→0.17% | −2.3 |
| late/greedy | 2.8%→0.33% | −2.5 |
| mid/ALL8 | 41.0%→19.5% | −21.4 |
| early/blind | 90.2%→88.2% | −2.0 |

statusEng mid 31%→29%. curve-dev 7%→13% (worse fit). Seat: 76,219
plays/run-set, 0 fizzles, opp% 97% — clean, not a dead card. `dom` stays
`resonance-detonation` (no new dominance).

**Verdict: KEEP-INCUMBENT.** A large, consistent regression across every
cell, not a wash. Confirms the estimates ledger's qualitative prediction
("defend commons pull the other way and are the honest brake") now
quantified: swapping GUARD onto the x4 heart seat measurably delays DoT
ramp in a tempo-sensitive deck — matches the standing slippery-slope
overpay lesson (DoT decks punish any turn not spent seeding). Directional
result (100 runs) but moot regardless since it's a clean negative — no
60-run re-confirm needed.

### H2 — `currys-conversion→reopen-the-question`

Mind uncommon x2 → body uncommon x2 (**mind→body color break**) — the
atlas's explicitly-unmeasured REARGUE gap.

```
npm run combat-playtest -- --stage=all --policy=all --sandbox=swap-affliction "--deck=preset:erosion+swap:currys-conversion/reopen-the-question" --runs=100 --seed=1 --cards
```

| cell | control→treat | Δ |
|---|---|---|
| mid/blind | 37.4%→40.0% | +2.6 |
| mid/greedy | 38.2%→40.6% | +2.4 |
| late/blind | 2.5%→3.0% | +0.5 |
| late/greedy | 2.8%→3.3% | +0.5 |
| mid/ALL8 | 41.0%→36.9% | −4.1 |

statusEng up at every stage (early 29%→32%, mid 31%→33%, late 30%→32%).
Seat: 36,989 plays, 6% fizz (REARGUE's bleed+poison-both-present
precondition occasionally unmet — expected for a conditional convert),
opp% 98%. `dom` unchanged.

**Verdict: first real REARGUE receipt** (atlas row updated, was "still
unmeasured" — now records this A/B). Modest mid/ALL8 win cost, real
engagement gain, exercised cleanly. **Not a promotion candidate as
measured**: breaks the 5/5/5 color law (mind 5→3, body 5→7) as a
single-variable swap, and is separately blocked on the pool→library
promotion gate (R1/C1). Filed as evidence-only.

### H3 — `festering-argument→aggravate-the-case`

Mind uncommon x2 → body uncommon x2 (**mind→body color break**) — the
estimates ledger's named dominance risk ("multiplicative with x4 seed
density").

```
npm run combat-playtest -- --stage=all --policy=all --sandbox=swap-affliction "--deck=preset:erosion+swap:festering-argument/aggravate-the-case" --runs=100 --seed=1 --cards
```

| cell | control→treat | Δ |
|---|---|---|
| mid/blind | 37.4%→49.8% | **+12.4** |
| mid/greedy | 38.2%→50.0% | **+11.8** |
| late/blind | 2.5%→4.2% | +1.7 |
| late/greedy | 2.8%→2.8% | 0.0 |
| mid/ALL8 | 41.0%→47.0% | +6.0 |
| early/blind | 90.2%→91.7% | +1.5 |

statusEng roughly flat (mid 31%→30%, early 29%→29%). Seat: 41,234 plays, 0
fizzles, opp% 97%; its FREE line (poison seed i1d2) is the first nonzero
FREE-hpP contributor in this recipe (1.80M hpP from FREE alone) — real
currency, not paper. `dom` stays `resonance-detonation` throughout — **the
ledger's dominance-risk hypothesis is REFUTED at this seat**, same pattern
as the residue's earlier refutation of `the-point-lands`.

**Verdict: the strongest single result of this pass.** Mid lands squarely
inside the 45-55% doctrine band (49.8%/50.0%), curve-dev unchanged (7%), no
engagement cost, no dominance. Comparable in strength to e1's
`poisoned-well` finding. Same double block as H2: color law (mind 5→3,
body 5→7) plus the pool→library promotion gate.

## 4. Applied / promoted

**Nothing applied this pass.**

1. Standing owner ruling R1 + open ballot item C1
   (`plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-19-swap-pool-measurement-residue.md`) blocks ALL
   swap-pool→library promotion pending explicit ratification — unchanged
   since 2026-07-18, still binding.
2. H2 and H3 (the only arms with positive signal) both break the 5/5/5
   color law as single-variable swaps; promoting either needs a
   compensating re-partition — a second, separate structural decision
   outside a sandbox A/B's scope.
3. H1 is a clean negative result — nothing to promote.

No files were edited beyond this report and the keyword-atlas REARGUE row
update. `npm run verify` was not run (no card/engine change to verify).

## 5. Considered but not applied

| arm | reason held |
|---|---|
| H3 `aggravate-the-case` | Strongest candidate this pass. Blocked on (a) unratified C1, (b) needs a color re-partition before it's a legal recipe edit. If C1 is ratified: re-confirm at 60 runs/seed 1 before shipping, same as `poisoned-well`. |
| H2 `reopen-the-question` | Kept as a REARGUE evidence receipt (atlas updated). Same color-law block, weaker upside than H3. |
| H1 `the-veiled-sting` | KEEP-INCUMBENT — genuinely worse, not a close call. |

## 6. Propose-only / structural findings

- **Baseline artifact gap:** `docs/reports/baselines/deck-matrix-baseline.json`
  is built via `--deck=policy-pick` and its `presetSummaries` array is
  empty — no future preset-scoped `/deck-tuning` run can diff against it
  directly. Proposing a second stamped artifact (e.g. via
  `--deck=preset:all`) as a baseline-regen convention fix. Not implemented
  here — process proposal only.
- Erosion's late-stage dev (−21%, band is informational/no floor per
  doctrine) is real but is the mildest curve-dev failure among all 10
  presets — a card-pool lever alone is unlikely to close a 21-point gap on
  its own; this belongs with the other stage-floor items already routed to
  manual engine-constant tuning in the residue's §D, not a fresh
  card-shaped ask.
- If C1 is ever ratified for `aggravate-the-case` and/or
  `reopen-the-question`, both need a body↔mind re-partition elsewhere in
  the recipe (neither swap is legal alone as measured) — flagging now so
  it isn't rediscovered from scratch.

## Open questions

- `[needs-user-call]` (extends C1, does not reopen it): if/when pool→library
  promotion is ratified, is `aggravate-the-case` (mid on-band, clean,
  refutes the dominance-risk hypothesis) or the already-queued
  `poisoned-well` (mid also on-band) the preferred first erosion
  promotion — and does either get bundled with the color-law re-partition
  it would need?
- No new owner-call items opened. Every hypothesis this pass either
  confirms/refutes an existing ledger prediction or banks a first receipt
  for an already-open atlas gap (REARGUE).

## Files changed in this PR

- `docs/reports/deck-tuning-2026-07-19.md` (new — this report)
- `docs/keyword-atlas.md` (REARGUE row updated with the H2 receipt)

No card, preset, draft-weight, or library changes — measurement-only pass.
