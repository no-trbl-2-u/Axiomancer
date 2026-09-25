# Hazard balance tuning — 2026-07-07

> **Status:** HISTORICAL — archived 2026-09-25 (trim T5, `plan/2026-09-25-trim-the-fat.spec.md` Tier 2 docs); superseded, kept for provenance. Original path: `axiomancer-mechanics/docs/reports/hazard-tuning-2026-07-07.md`. Not a source of rules.

**0 numeric changes applied and shipped.** One change (REC#10 front-loaded Safe
ramp) was drafted, sim-validated, and then reverted after it broke two
hardcoded-fixture unit tests — see "Considered but not applied" below. The
main output of this pass is a headline finding: **the CDR-0006 / PRD design
targets that this skill's own instructions cite as "the objective function"
have drifted substantially from the shipped, tested hazard engine** — in at
least three independent, verifiable ways. Continuing to tune numbers against
the stale targets would fight the game's own committed regression tests.

## Headline finding: CDR-0006 doctrine has drifted from shipped + tested reality

Three separate axes were checked against CDR-0006/PRD and each came back
contradicted by a **committed, passing test or an explicit rationale doc**,
not just a stale comment:

### 1. Die-face bag: doctrine wants 2 hostile (X) faces; shipped has 2 gold faces

- CDR-0006 (`docs/hazard-minigame.md:124,153,861`) and the PRD
  (`docs/hazard-minigame-prd.md:81`) both specify: 6 faces, **red 1/6, blue
  1/6, purple 1/6, gold 1/6, hex 2/6** ("expected ~1.3 X dice per opening
  roll").
- Shipped `HAZARD_TUNING.dice.faces` (`hazard.tuning.ts:54`) is
  `['red','blue','purple','gold','gold','hex']` — **gold 2/6, hex 1/6**, the
  inverse ratio.
- This is not an oversight. `docs/hazard-v2-vs-mechanics-divergence.md:206`
  explicitly documents: *"Mechanics dice distribution is still `red, blue,
  purple, gold, x, x`; mobile is `red, blue, purple, gold, gold, hex`."* A
  prior pass reconciled **mechanics to match mobile**, and locked it in with
  regression tests: `audit/e2e/parity.audit.test.ts:101-106` asserts
  `gold` appears exactly twice and `hex` exactly once; `audit/divergence.
  verification.ts:169-173` verifies the same 6-slot shape and calls anything
  else a "gap."
- **Evidence:** a dedicated 300-run CLI sample (`--seed 99999 --runs 300
  --hazard cracked-cliff --route top`, 1200 total die draws) measured
  gold 34.3%, hex 18.2%, red/blue/purple ~16% each — matching the shipped
  2-gold/1-hex config, not CDR-0006's 1-gold/2-hex. Rolls with 2+ hostile
  dice: **16.0%** of opening rolls, versus the ~41% CDR-0006's own math
  assumes for its "X-interaction card matters against 2+ X dice" target.
- **Why this wasn't touched:** reverting to CDR-0006's ratio would directly
  break the two committed parity-audit assertions above, undoing a
  deliberate mobile-parity fix. This is a **doctrine-vs-shipped-parity
  conflict**, not a numeric bug — see "Open questions."

### 2. Route clear-rate targets: CDR-0006 says 70–80%/40–60%; the shipped, tested bands say ~90–100%/74–97%

- The skill's own design-targets table (sourced from CDR-0006/PRD) states
  safe-route clear rate 70–80% and risk-route clear rate 40–60% for early
  sessions.
- `docs/hazard-balance-recommendations.md` (dated 2026-06-10, amended
  2026-06-12) is the **current, authoritative, actively-maintained** balance
  doc for this exact axis. It states the guard bands in plain language:
  *"guard bands currently enforce Safe ≥90% at-least-one-win / ≤8% failure
  and Risk 75–98% at-least-one-win / 3–25% failure."*
- `src/World/Hazard/e2e/hazard.balance.sim.test.ts` encodes this precisely:
  safe `atLeastOneWinRate >= 0.9`; risk `atLeastOneWinRate` in `[0.74, 0.97]`.
  This is a **passing, committed test**, re-blessed as recently as
  2026-06-25 per its own inline comments.
- **CLI evidence** (see matrix below) lands squarely inside these shipped
  bands and nowhere near the CDR-0006 numbers: safe clear rate 100% across
  all 6 hazards; risk clear rate 77.5–90%.
- **Conclusion:** the CDR-0006 clear-rate targets are stale for this game.
  Tuning thresholds to chase 70–80%/40–60% would fail
  `hazard.balance.sim.test.ts` outright. No action taken; recommend T update
  CDR-0006/the PRD (or explicitly mark them superseded by
  `hazard-balance-recommendations.md`).

### 3. Threshold magnitude scale: CDR-0006's "5–7 top / 8–11 bottom per round" no longer describes the shipped numbers

- CDR-0006's "Threshold Calibration" section (`docs/hazard-minigame.md`,
  §Balance Notes) computes a top-route floor of ~5–7 combined progress per
  round and a bottom-route floor of ~8–11, assuming ~2 direct-progress cards
  drawn per round.
- Shipped safe-route thresholds are **20–26 cumulative** across 3 rounds
  (e.g. `cracked-cliff` safe: `[20, 23, 25]`), and risk thresholds are
  **8–13 per meter per round** (dual). These numbers come from a documented
  full retune: `hazard.content.ts`'s own header comment says thresholds were
  "RETUNED for the no-re-cast dice doctrine" versus an even earlier
  prototype scale (12–14), and raised again in the "2026-06-12 difficulty
  pass" cited in `hazard-balance-recommendations.md`. The CDR-0006 numbers
  describe neither generation.
- No action taken — this confirms finding #2 rather than adding a new axis;
  recorded so a future pass doesn't re-derive it from scratch.

## Also corrected: this skill's own "Known engine gaps" table is substantially stale

Per Step 5, each cited gap was re-verified directly against the shipped
engine before writing this report. **Four of six rows no longer describe
the code:**

| Gap (as stated in the skill) | Status found | Evidence |
|---|---|---|
| Per-round failure penalties not applied (`hazard.engine.ts:221` TODO) | **Stale.** No `TODO` marker exists anywhere in `hazard.engine.ts` (`grep -c TODO` → 0). Vitae penalty *is* applied, but batched into `computeOutcome` at hazard-end (`penaltyVitae: route.penaltyVitae * losses - wardPenaltyReduction`), not incrementally per round. | `hazard.engine.ts:1053` |
| Dice refresh between rounds (resets all spent dice) | **Stale/wrong.** `continueHazardAfterResolve` spreads `...s` with no `dice` override; the trailing comment reads *"dice untouched — the one cast must last the hazard."* Dice genuinely persist for the whole crossing. | `hazard.engine.ts:1075-1119`, esp. line 1118 |
| Exhausted dice reset between rounds | **Moot.** `HazardDieState` is `'available' \| 'spent'` only — there is no `'exhausted'` state in the type system to reset. | `hazard.types.ts:76` |
| Dual-type (risk route) round resolution incomplete | **Stale/wrong.** `resolveHazardRound` already requires both meters: `cleared = p.force >= nF && p.escape >= nE`. | `hazard.engine.ts:800-813` |
| Die color set (green/yellow leftover) | **Stale (already fixed), but for the wrong reason.** No green/yellow anywhere; the real, still-open divergence is the gold/hex *ratio* (see finding #1), not color vocabulary. | `hazard.tuning.ts:54` |
| Persistent map benefits not wired (H08/H12/H15) | **Moot.** Those hazard IDs don't exist in the shipped `HAZARD_LIBRARY` (6 hazards: `cracked-cliff`, `flooded-undercroft`, `ashfall-crossing`, `famine-march`, `bandit-hunt`, `fever-rot`). No `⚑ future phase` markers found in `hazard.types.ts`. | `hazard.content.ts:551-648` |

**Recommendation:** refresh §5/§8 of the `/hazard-tuning` skill file itself —
most of its "known gaps" table now describes a version of the engine that
predates at least one and probably several retunes. Left as-is, every future
run re-discovers (or worse, trusts) stale gaps.

## Mana-crisis axis: real measurement, ambiguous verdict — not tuned

Design target: >50% of runs enter the final round with ≤1 available die.
CLI evidence (auto/greedy policy, distinct seeds per hazard/route, 40 runs
each): **0–27.5%** across all 6 hazards — far below target.

Dice genuinely do not refresh (see gap-table correction above), so this
*could* be a real deficit. But the average available-die count actually
climbs slightly from round 1 (~3.2) to the final round in the raw
distribution (`{1:40,2:118,3:185,4:110,5:27}` across 480 samples, avg 2.93),
because the greedy auto-bot uses recast/convert/draw effects to replenish
its mana pool. This may be **correct, skilled-play behavior** (CDR-0006's
crisis math assumes a naive "spend 2 dice/round, no recast" player, not an
optimizing bot), or it may indicate the auto-bot's heuristic overweights
mana-generation cards relative to a real average player. Distinguishing
these needs a second, deliberately mana-naive bot policy for comparison —
out of scope for a numeric-only pass. **Not tuned**; flagged for a future
pass with a policy-comparison harness.

## Deck composition: healthy, no action needed

Direct-progress card share (target: ≤50% of pool):

| Pool | direct-progress share |
|---|---|
| Starter deck (by distinct card, weight > 0) | 31.3% (5/16) |
| Starter bag (weighted by copies, n=22) | 22.7% |
| Reward pool (n=176) | 21.6% |
| Full pool (n=192) | 22.4% |

Comfortably under the 50% ceiling everywhere. No action needed.

X-interaction (convert-effect) starter card: only **`windread` / READ THE
WIND** (weight 2 of 22). Draw probability of at least one in a 5-card hand
from the 22-weight starter bag ≈ 41% — just at the ≥40% target on paper.
But per finding #1, 2+ hostile dice (the situation this card exists to
answer) only occurs in ~16% of rolls under the shipped die-face bag, not the
~41% CDR-0006 assumed — so the card is drawn "often enough" by the letter of
the target, but the situation it solves is much rarer than doctrine pictured.
Flagged, not touched (fixing it means picking a side of finding #1 first).

## CLI evidence matrix

All runs: `--auto --json-events --state-log <path>`, distinct seed per
hazard/route pair (avoids the correlated-seed trap below), 40 runs each.

```
npm run hazard -- --auto --seed 1  --runs 40 --hazard cracked-cliff        --route top    --json-events --state-log <path>
npm run hazard -- --auto --seed 2  --runs 40 --hazard cracked-cliff        --route bottom --json-events --state-log <path>
npm run hazard -- --auto --seed 3  --runs 40 --hazard flooded-undercroft   --route top    --json-events --state-log <path>
npm run hazard -- --auto --seed 4  --runs 40 --hazard flooded-undercroft   --route bottom --json-events --state-log <path>
npm run hazard -- --auto --seed 5  --runs 40 --hazard ashfall-crossing     --route top    --json-events --state-log <path>
npm run hazard -- --auto --seed 6  --runs 40 --hazard ashfall-crossing     --route bottom --json-events --state-log <path>
npm run hazard -- --auto --seed 7  --runs 40 --hazard famine-march         --route top    --json-events --state-log <path>
npm run hazard -- --auto --seed 8  --runs 40 --hazard famine-march         --route bottom --json-events --state-log <path>
npm run hazard -- --auto --seed 9  --runs 40 --hazard bandit-hunt          --route top    --json-events --state-log <path>
npm run hazard -- --auto --seed 10 --runs 40 --hazard bandit-hunt          --route bottom --json-events --state-log <path>
npm run hazard -- --auto --seed 11 --runs 40 --hazard fever-rot            --route top    --json-events --state-log <path>
npm run hazard -- --auto --seed 12 --runs 40 --hazard fever-rot            --route bottom --json-events --state-log <path>
npm run hazard -- --auto --seed 99999 --runs 300 --hazard cracked-cliff    --route top    --json-events --state-log <path>   # dedicated die-face frequency sample
```

**Methodology note:** an initial pass reused one `--seed` base across all 12
hazard/route files. That was wrong — `--runs N` derives per-run seeds only
from `(baseSeed, runIndex)`, so every file's run-index-1 die roll was
*identical* regardless of hazard, since dice are cast before any
hazard-specific divergence. The combined "1200 dice" tally from that pass
was actually 100 independent dice repeated 12x, which is why it showed an
anomalous 4% hex rate. Re-run with 12 distinct seed bases before drawing any
conclusion; the corrected numbers below are from that second pass.

| Hazard / route | n | clear rate (wins>0) | final-round ≤1-die rate |
|---|---|---|---|
| cracked-cliff / top | 40 | 100.0% | 12.5% |
| cracked-cliff / bottom | 40 | 90.0% | 2.5% |
| flooded-undercroft / top | 40 | 100.0% | 5.0% |
| flooded-undercroft / bottom | 40 | 77.5% | 2.5% |
| ashfall-crossing / top | 40 | 100.0% | 27.5% |
| ashfall-crossing / bottom | 40 | 80.0% | 0.0% |
| famine-march / top | 40 | 100.0% | 10.0% |
| famine-march / bottom | 40 | 87.5% | 2.5% |
| bandit-hunt / top | 40 | 100.0% | 5.0% |
| bandit-hunt / bottom | 40 | 77.5% | 2.5% |
| fever-rot / top | 40 | 100.0% | 27.5% |
| fever-rot / bottom | 40 | 77.5% | 2.5% |

All safe (top) rows exceed the `hazard.balance.sim.test.ts` floor
(`atLeastOneWinRate >= 0.9`); all risk (bottom) rows land inside
`[0.74, 0.97]`. Consistent with finding #2 — the shipped bands are healthy
by their own committed test, not by CDR-0006.

## Considered but not applied

**REC#10 (front-load the Safe route's difficulty ramp)** —
`docs/hazard-balance-recommendations.md` explicitly flags this as a
"pure-number change guarded by the balance sim — cheap win," still
unimplemented (not in the ✅ list). Rationale: Safe currently clears almost
entirely on round 3 momentum, so an early X rarely threatens anything;
front-loading makes round 1 the real test.

Drafted change (same final-round threshold, climb moved earlier), validated
with `simulateHazard` (3000-run in-process Monte Carlo, not the subprocess
CLI — this is the same simulator `hazard.balance.sim.test.ts` already
trusts):

| Hazard | old thresholds | candidate | perfect / win / fail (old → new) |
|---|---|---|---|
| cracked-cliff, famine-march | `[20,23,25]` | `[22,24,25]` | 62.5% / 99.3% / 0.7% → 47.6% / 98.4% / 1.6% |
| flooded-undercroft, bandit-hunt | `[19,23,26]` | `[23,25,26]` | 59.3% / 99.5% / 0.5% → 32.0% / 96.7% / 3.3% |
| ashfall-crossing, fever-rot | `[22,23,25]` | `[24,24,25]` | 52.8% / 98.7% / 1.3% → 37.2% / 96.9% / 3.1% |

Every candidate stayed inside the `hazard.balance.sim.test.ts` bands (safe
win ≥90%, perfect 18–65%, fail ≤10%). **Applied to `hazard.content.ts`,
then `npm test` broke two tests in `hazard.engine.test.ts`:**

- `outcome and rewards > perfect tier may skip` (line 705) — expected
  `phase` = `'done'`, got `'rewards'`.
- `enchant momentum ... > a clear cleared by an aura carries only the RAW
  surplus forward` (line 917) — expected `carryForce` = 2, got 1.

Root cause: both tests use a hardcoded fixture (`runToOutcome`'s 6 copies of
the `footing` card per round) tuned to just barely clear `cracked-cliff`'s
*old* thresholds. The new, higher round-1/round-2 thresholds push that exact
fixture below the clear line, so the "perfect tier" and "momentum carry"
assertions in those two tests no longer hold for that specific fixture —
not a sign the underlying engine behavior broke.

Per the verify-gate hard rule, the change was reverted in full
(`git checkout -- src/World/Hazard/hazard.content.ts`) rather than editing
the test fixtures to route around the failure. **Recommendation:** if T
wants REC#10 adopted, a human should resize `runToOutcome`'s fixture (more
than 6 `footing` copies, or a stronger card) alongside the threshold change,
since the fixture card count was never meant to pin an exact threshold
value — but that's a test-authoring judgment call outside this skill's
numeric-tuning authority.

## Open questions

1. **Which is canonical for die faces: CDR-0006 (1 gold/2 hex) or the
   mobile-parity-locked shipped config (2 gold/1 hex)?** This cascades into
   the mana-crisis rate, gold scarcity, and X-interaction-card relevance
   targets. Recommend T pick one and either (a) update
   `docs/hazard-minigame.md` + `-prd.md` to describe the shipped 2-gold/1-hex
   ratio and recompute its X-frequency/mana-crisis math, or (b) explicitly
   schedule a coordinated mechanics+mobile die-face change with the parity
   tests updated in the same PR.
2. **Should CDR-0006's clear-rate and threshold-magnitude targets be
   formally superseded by `hazard-balance-recommendations.md`?** Right now
   two documents disagree on the same axis and only one has a passing test
   backing it.
3. **Is the auto/greedy CLI bot a fair proxy for the mana-crisis target?**
   It appears to actively manage mana via recast/convert cards, which may
   suppress the crisis rate relative to a real average player. A
   mana-naive bot policy would settle this.

## Test gate

`npm test` cold, before any change: 140 files / 2104 tests passed.
`npm test` after REC#10 draft: 139 passed / 1 failed (2 assertions) — reverted.
`npm test` after revert: 140 files / 2104 tests passed (confirmed clean).

No numeric or content changes ride this PR; `git diff` against `main` is
report-only.
