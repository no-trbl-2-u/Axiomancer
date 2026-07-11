# Phase 27 — Re-baseline (measurement)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

**Measurement only — no numeric tuning.** Phase 26 closed the
dice-turn farm (`startTurn` now refuses a second tray within one
threat phase) and clamped attribution overkill. Every win-rate,
statusEngagement, dominance, and attribution number on record
before 2026-07-10 was measured against the farm and is therefore
untrustworthy. This phase re-runs the full stage × policy matrix
under the Turn Law, re-derives the doctrine witnesses, and
publishes a re-triage report that becomes the new source of truth
for every subsequent tuning phase (28–33). Source:
`plan/tuning/2026-07-10-turn-law-and-honest-baseline.md` §3.

No code changes are in scope. If the matrix run surfaces an
engine bug (crash, invariant violation), fix the minimum needed
to complete the measurement and note it under Decisions — do not
retune numbers to chase the doctrine bands. Repricing (Conviction
economy, curve-shape tolerances, per-card floors) is explicitly
deferred to Phase 31+ per the roadmap.

## Method

Run `npm run combat-playtest` (the stage × policy matrix CLI,
`src/CLI/combat-playtest.cli.ts` → `runPlaytestMatrix`) plus the
existing balance-band/curve-shape hermetic suite, which already
runs the honest post-Turn-Law engine:

```bash
# 1. Full matrix — every stage, every sim policy, policy-pick decks
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards --json
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards   # human-readable twin

# 2. Curve-shape / preset-floor witness (same computation the pinned
#    test performs — confirms or refutes KNOWN_CURVE_VIOLATORS)
npx vitest run src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts --reporter=verbose

# 3. Qualitative transcripts (Turn-Law-shaped, attribution-clamped) —
#    early and mid, matching the pre-law baseline.md's transcript pair
#    for direct before/after comparison
npm run combat -- --auto --policy status --stage early --seed 3 --max-turns 14 --json-events
npm run combat -- --auto --policy status --stage mid --seed 5 --max-turns 14 --json-events
```

Metric definitions unchanged from the pre-law baseline
(`plan/tuning/2026-07-10-audit-evidence/baseline.md`): `statusEng`
= status-applying plays / total plays; `dotFrac` = enemy HP lost
to DoT / total enemy HP lost; `dom` = dominant card's HP-damage
share; win = victory + mercy (befriend).

## Outputs

```
plan/tuning/2026-07-11-phase27-rebaseline.md          — new, the report
axiomancer-mechanics/src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts
  — KNOWN_CURVE_VIOLATORS comment updated to record the Phase 27
    confirmation (only touched if the derived offender set changed;
    the constant itself only changes if it did)
```

Report sections (mirrors `baseline.md`'s shape so before/after is a
straight diff):

1. Raw stage × policy table (win / V-M-D-R / rounds / statusEng /
   dotFrac / strike / dom) — the full 152-cell matrix.
2. Stage summaries vs the locked 80/50/25-35/0 doctrine.
3. Greedy-vs-blind gap (hidden-information value check).
4. Curve-shape / per-preset floor results — confirm or refute
   `KNOWN_CURVE_VIOLATORS` (currently empty; the test file's own
   comment already predicts this pass confirms zero offenders).
5. Card coverage / dead-card rate.
6. Two qualitative transcripts (early, mid) with attribution
   sanity-checked against the Phase 26 clamp (no overkill vs.
   enemy max HP) and signature (`sig-conviction-strike`) damage
   share re-measured.
7. Reading — what changed vs. the farmed baseline, what the
   doctrine violations now are, and which follow-up phase
   (28–33) owns each one.
8. A short pointer at the top of `2026-07-10-turn-law-and-honest-baseline.md`
   §3 marking it satisfied, referencing the new report.

## Decisions made upfront — DO NOT ASK

- **≥60 runs/cell, seed=1, `policy-pick` decks, `--cards` for the
  per-card table** — matches the source doc's explicit ask
  ("≥60 runs/cell, plus per-card tables") and keeps the run
  reproducible against a fixed seed, same convention as the
  pre-law baseline.
- **The curve-shape/preset-floor numbers come from actually
  running the pinned vitest suite**, not a hand-rolled
  reproduction — that suite IS the graded witness
  (`KNOWN_CURVE_VIOLATORS`, `PRESET_FLOORS`), so its own output is
  the authoritative re-derivation. If it's green with zero
  violators, the constant needs no code change — the report still
  documents the confirmation for the record.
- **Two qualitative transcripts (early + mid), not the full four
  from `baseline.md`.** The quantitative matrix already covers
  late/impossible exhaustively across 8 policies × N enemies; the
  qualitative transcript's job is a human-readable attribution
  sanity check post-Phase-26-clamp, which early+mid demonstrate
  (mid is also the stage where signature dominance was worst
  pre-law, making it the sharper before/after comparison).
- **No numeric retuning even if the doctrine bands are badly
  missed.** This phase's deliverable is the honest number and the
  routing decision (which phase owns the fix), not the fix itself
  — `2026-07-10-turn-law-and-honest-baseline.md`'s own Order
  section gates repricing (#4) on this landing first, and the
  roadmap phases (31 "repricing gated on Phase 27", 32, 33) exist
  precisely to receive these findings.
- **If a stage/policy cell's win rate is ~0%, that is reported
  as-is, not treated as a harness bug**, unless the matrix crashes
  or a `stats.runs !== requested runs` accounting mismatch appears
  (the pinned suite already asserts this invariant and stayed
  green). A near-total mid/late collapse is itself the headline
  finding this phase exists to surface.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

The matrix commands above are read-only analysis (no engine code
touched); the verify gate here is a sanity check that the repo is
still green, not a gate on the report content itself.

## Deploy gate

```bash
npm run deploy:check
```

Touches `plan/tuning/**` (+ possibly a comment-only line in the
balance-bands test) — no runtime surface; deploy gate is a
formality but still run per the skill contract.

## Git

```bash
git add plan/tuning/2026-07-11-phase27-rebaseline.md \
        axiomancer-mechanics/src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts
git commit -m "$(cat <<'EOF'
plan: re-baseline the combat matrix under the Turn Law — phase 27

- full stage x policy matrix re-run post Phase 26 (60 runs/cell,
  seed 1, policy-pick decks); published as
  plan/tuning/2026-07-11-phase27-rebaseline.md
- re-derived stage curve vs the locked 80/50/25-35/0 doctrine,
  statusEngagement/dotFrac/dominance witnesses, dead-card rate,
  greedy-vs-blind hidden-info gap
- confirmed KNOWN_CURVE_VIOLATORS' predicted zero-offender outcome
  against the pinned balance-bands/curve-shape suite
- two qualitative early/mid transcripts sanity-check the Phase 26
  attribution clamp and re-measure signature damage share

Decisions:
- measurement only, no numeric retuning this phase (repricing is
  gated on this report per the turn-law-and-honest-baseline doc's
  Order section; owned by phases 28-33)
EOF
)"
git push origin main
```

## DoD

Flip Phase 27 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append the commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 27 shipped — re-baseline under the Turn Law"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- **Phase 28 — Show the Engine.** Legibility sweep, parallel-safe
  with this phase.
- **Phase 31 — repricing gated on this phase.** The Conviction /
  signature economy repricing explicitly waits on this report's
  numbers.
- **Phases 29/30/32/33** — keyword registry, FREE-line content
  pass, theme deep work, enemy answers — all read this report as
  updated ground truth where they reference win rates or
  engagement.
- If the report finds a doctrine violation severe enough to block
  further roadmap phases (e.g., a stage that cannot be won by any
  policy at all), that finding is escalated in the report's Reading
  section, not silently absorbed — `/oversight` or the next
  `/expand` pass triages it into a phase.
