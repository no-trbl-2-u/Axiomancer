# Spec 35 — Objective function v2: the Combat Quality Index

> **Status:** HISTORICAL — superseded by THE BIG NUMBERS REWRITE (2026-09-02,
> `plan/2026-09-02-big-numbers-overhaul.prompt.md`), which repealed the whole
> idea of a governing objective function. There is no CQI, no win-rate curve
> and no rank band grading combat any more; the sims keep bug detectors and a
> wide sanity envelope instead. Read this as a period record.

> Formerly: **IMPLEMENTED** (build-plan **Phase 43**, 2026-08-08). Replaces the
> parked "metric v2" design session in `plan/AUDIT.md`.
>
> **Provenance:** THE UNSHACKLING (T direct, `/oversight` 2026-08-08 — see
> `plan/bearings.md` § "THE UNSHACKLING") voided the status-dominance doctrine
> for combat. `statusEngagement` was the objective function for `/deck-tuning`
> and `/combat-playtest` *because* status play was the doctrine, so it now
> measures adherence to a rule the game no longer has. This spec defines its
> successor.
>
> **Binding constraint:** the LOCKED MECHANICS carve-out (T direct, same
> session). Conviction, the Surge meter and the Dice system are permanent. A
> metric that rewards decks ignoring them, or that would let a later balance
> pass tune them into irrelevance, is a failed metric.
>
> **Canonical numbers live in code**, not here:
> `src/Combat/combat.objective.ts` (the score, the weights, the calibration,
> the guard) and `src/Combat/combat.objective.telemetry.ts` (the counters).
> This file is the decision and its justification; the code is the contract.

---

## 1. The decision — what "good combat" means now

> A fight is GOOD when the deck's own engine runs: its loop **assembles across
> turns** instead of firing at once (ARC), the player has **more than one live
> line** at each powering die (WIDTH), a **lead card carries the kill without
> becoming the whole deck** (IDENTITY), and all of it flows through the three
> permanent systems — **Conviction, the Surge meter, the Dice** (SPINE).

One named score: **`combatQualityIndex`** (`cqi`, 0–1), four weighted
components, each reported individually alongside the readings behind it.

### What was rejected, and why

The phase row listed four candidates and said *decide, don't collect all of
them*. Arc and width are IN (they are the parked AUDIT row's own diagnosis:
`statusEngagement` is "enemy-side-only, volume-based, and arc-blind"). The
other two are OUT as standalone components:

| Candidate | Verdict |
|---|---|
| **Comeback frequency** | Out. Needs a lead/trail model the HP-only win condition does not provide, and the sim policies are deterministic instruments — a measured "comeback" would grade the driver's guard counters, not the design. |
| **Win-path diversity** | Out. Already first-class as `winPathCounts`, and it is a property of the LIBRARY, not of a fight's quality: rot should not be penalised for never reaching CAPITULATE. |

### Win rate is deliberately NOT a term

The starter-preset doctrine curve (early ~80% / mid ~50% / late 25-35% /
impossible 0%) already grades **whether** a deck should win at a stage. CQI
grades **how the fight played**. Folding win rate in would make a good fight on
the `impossible` stage unscoreable and would recreate the old metric's failure
mode — one number pretending to be both the target and the diagnosis. A
`win-rate 0%` cell scoring well is correct behaviour, and is pinned by
`combat-objective.sim.test.ts`.

---

## 2. The components and their weights

| Component | Weight | What it reads |
|---|---|---|
| **SPINE** (locked) | **0.40** | Conviction, Surge, Dice — each 1/3, each a geometric mean of "is it fed" × "is it used" |
| **ARC** | 0.25 | Normalized time-centroid of the enemy's HP loss |
| **WIDTH** | 0.20 | Mean legal card options at each powering die |
| **IDENTITY** | 0.15 | Dominant card's share of attributed enemy-HP damage |

**SPINE 0.40 — the largest by design.** After the unshackling, everything else
the metric could anchor on (cards, keywords, theme, the damage model) is
explicitly mutable; the three locked systems are the only structure T declared
permanent. Anchoring the objective function on the only fixed points in the
game is the one choice that cannot rot. At 0.40 the other three sum to 0.60, so
a spine-blind deck **cannot** buy a passing score by excelling everywhere else
— that ceiling is asserted directly (`1 − spine weight`).

**ARC 0.25 — second-largest.** "Volume-based and arc-blind" was the parked
AUDIT row's diagnosis of `statusEngagement`. All six shipped archetypes
(`docs/profane-canon.md` §2) are setup→payoff engines: rot plants then
RUPTUREs, debt borrows then bills, grave fills then REQUIEMs, vigil banks quiet
rounds, trial stacks PREMISE toward CONCEDE, choir hoards SOUL then REAPs. A
flat damage profile means the archetype is not being played as designed, and no
other term sees that.

**WIDTH 0.20.** The other named blind spot — a metric that rewards more
applications without more *decisions* is a failed metric
(`plan/archive/2026-09-25-trim-t4/plan/ideas/COMBAT_SYSTEM_FOUNDATIONAL_REDESIGN_PLAN.md`, "status metric
law"). Ranked below arc because it measures the *opportunity* for a decision:
the sim policies are instruments, so width bounds what a human could have
chosen among and cannot prove they chose well.

**IDENTITY 0.15 — smallest.** The most confounded by enemy mix and deck size.
It exists to keep two measured failure modes visible: single-card spam
(`dominantCardShare` > 0.70, the `/deck-tuning` §4 flag) and its mirror, a
fight the generic engine won while the deck watched.

The four sum to 1.0 so the index reads as a fraction.

---

## 3. The locked-mechanics guard

Three mechanisms, all greppable via `LOCKED_MECHANIC_TERMS`:

1. **SPINE is the heaviest component** (0.40), asserted in test.
2. **Each locked system is its own sub-term with a positive sub-weight**, and
   each is a *geometric* mean of feed × use — so ignoring a system scores that
   system **0**, not "average". Earned-but-never-spent Conviction scores 0; a
   momentum chain that only ever breaks scores 0; a tray that is rolled but
   never spent, or spent without ever touching the die economy, scores 0.
3. **`assertLockedMechanicsFirstClass` runs on every score call.** Dropping a
   locked term, zero-weighting it, negative-weighting it, smuggling in a fourth
   term, or pushing the spine weight below `LOCKED_SPINE_WEIGHT_FLOOR` (0.25)
   **throws** instead of quietly producing a number. A balance pass that tries
   to tune Conviction, the Surge meter or the Dice out of the objective
   function fails loudly at measurement time.

Changing `LOCKED_MECHANIC_TERMS` is a `[needs-user-call]`, not a tuning
decision.

---

## 4. How each locked system enters the score

| System | Fed by (telemetry) | Used by (telemetry) | Sub-score |
|---|---|---|---|
| **Conviction** | `conviction-gained` (+ the opening bank) per round vs 2/round | `signature-cast` cost / income vs a 0.5 spend share | `√(income × spend)` |
| **Surge meter** | `momentum-advanced` + `wheel-lit` + surges per round vs 2/round | completion share = surges / (surges + `momentum-broken`) | `√(drive × completion)` |
| **Dice** | `dice-rolled` / `turn-dice-rolled` → spend share vs 0.5 | distinct `DICE_ECONOMY_VERBS` touched vs 4 of 11 | `√(spend × breadth)` |

The Surge term reads **both dice models** (`momentum-*` for spec-33 Upgradeable
Dice, `wheel-*` for the legacy comparison model), so `--legacy-dice` runs are
not scored as chain failure by construction.

---

## 5. Calibration

`COMBAT_QUALITY_CALIBRATION` is instrument calibration in the spirit of
`CURVE_SHAPE_TOLERANCES` — a reading of the shipped engine's structure,
sanity-checked against a live sweep. **Never loosen one to make a failing deck
pass.** That is a FINDING, not a reason to move the target.

Notable derivations:

- `arcTargetCentroid` **0.62** — a uniform damage profile centroids at 0.50, a
  linear setup→payoff ramp at ~0.67; the target sits between, nearer the ramp.
  `arcTolerance` 0.35 means a perfectly flat fight still scores ~0.66 (weak
  arc, not absent) while a round-one burst that then coasts scores 0.
- `widthTargetOptions` **3** — the powering die already filters the hand to one
  aspect, so three live matches is a real spread; one option is not a decision.
- `identityBand` **[0.15, 0.45]**, dead at **0.85** — set above the
  `/deck-tuning` §4 spam flag (0.70) so a flagged deck already scores badly
  before it hits zero.

---

## 6. Aggregation law

Component scores are **nonlinear**, so a rollup **pools the telemetry and
re-scores** rather than averaging per-cell indices. `poolObjectiveTelemetry` →
`scoreCombatObjective` is the only correct path, and the stage / preset / matrix
rollups all take it (asserted in `combat-objective.sim.test.ts`).

**One caveat:** IDENTITY is definitionally a per-DECK property. Pooling across
different decks dilutes the dominant share and inflates the term, so read
`idn` off a cell or a preset row, never off a `--deck=preset:all` matrix line.
The other three components pool cleanly. The CLI report says so in-line.

---

## 7. `statusEngagement` is kept, beside

The old metric stays computed, exported and asserted everywhere it already was.
Its **meaning** is demoted, not changed: it is a warning light (a collapse is
still worth seeing) and it is no longer the target. Nothing was repointed or
deleted, and no existing assertion changed meaning.

---

## 8. First reading (UNSTAMPED)

`npm run combat-playtest -- --stage=all --policy=all --deck=preset:all
--runs=20 --seed=1`, working tree at 2026-08-08 (Phase 43 uncommitted;
**not** a stamped baseline):

| Deck | early | mid | late | impossible |
|---|---|---|---|---|
| **threadbare** | 65% | 65% | 64% | 65% |
| **pilgrim** | 78% | 80% | 80% | 79% |
| **apostate** | 74% | 77% | 78% | 79% |

Matrix pooled: `cqi 78% [spine 71% (con 84 / sur 53 / dic 76), arc 90%,
wid 66%, idn 92%*]` — *matrix-level idn is the diluted reading; see §6.

The ordering is a validity check the metric passes: **THREADBARE — the
deliberately clunky teaching deck built to be removed
(`docs/profane-canon.md` §3) — scores ~14 points below the assembled decks**,
and its identity term (44–48%) reads exactly the intended "no card leads this
deck", while PILGRIM/APOSTATE sit at 82–100%.

Findings the first reading surfaces (information, not work — the card library
is transitional per bearings):

1. **The Surge meter is the least-used locked system** (`sur` 47–59% at every
   preset × stage). Chain completion is **35%**: the momentum chain BREAKS
   about twice for every surge it completes.
2. **Most rolled dice never power a line** — `dice-spent` 29% against a 0.5
   reference.
3. **`dominantCardShare` (the pre-existing witness) is broken post-strike-death**
   and reads ~100% on nearly every cell: the raw attribution ledger's
   `dotDamage` is filled at *summary* time, so the ledger carries direct damage
   only and collapses onto whichever signature burst last. CQI's identity term
   therefore reads cards from the sim's own per-line HP swing (immediate +
   projected DoT) and folds the ledger in only for non-card sources. **The
   standalone `dominantCardShare` stat was left untouched** (other suites read
   it) — repairing it is separate work.

---

## 9. Baseline status

**NOT re-stamped by Phase 43.** `npm run baseline:regen` stamps
`git rev-parse --short HEAD` while measuring the working TREE; with Phase 43
uncommitted (and four sibling phases in flight in the same tree) any stamp
produced now would name a commit that does not contain what was measured. The
existing baseline was already **STALE by 4 mechanics-source commits** before
this phase.

To stamp the first CQI baseline, from the repo root **on a clean tree with
Phase 43 committed**:

```bash
npm run baseline:regen              # full: runs=60, seed=1, all stages/policies
node scripts/check-baseline-freshness.mjs
```

The regenerated `deck-matrix-baseline.json` carries the new
`combatQuality` / `objectiveTelemetry` fields automatically — the regen script
serialises whatever `--json` emits, so no script change was needed.
