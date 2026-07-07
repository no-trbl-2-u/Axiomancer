# Phase 4 — Balance-sim population witnesses for HP kill-paths (test-only)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.
> Follow-up to Phase 1 (`plan/phases/phase_1_combat_test_backfill.md`),
> which added single-seed funded-path witnesses. This phase adds
> **population-level** (many-seed, policy-driven) coverage for the
> three kill-paths named in the build-plan row: Conclusion/BODY-sig,
> Execute finish, escalation clock.

## Scope

Add population-level (multi-seed, real-policy-driven) balance-sim
coverage for HP kill-paths still lacking it. **No engine behavior
change**: test-only, mirrors the existing
`hazard-pattern-combat.balance.sim.test.ts` idiom (a Monte-Carlo
run via `simulateHazardPatternCombat` / `runOneEncounter`, doctrine
assertions on the aggregate stats).

## Reality check against the codebase (resolves the row's premise)

- **Conclusion/BODY-sig: already has population-level coverage.**
  `hazard-pattern-combat.balance.sim.test.ts`'s `'HP combat —
  BODY/Conclusion archetype is a viable status-board finisher'`
  describe block (3 tests) already runs a CONCLUDE loadout across
  120 seeds and asserts `winRate`, `avgActiveEffectsPerPhase`, and
  `mechanicBurstFraction`. **No new test needed for this one** —
  noted here so the build-plan row's premise is corrected rather
  than silently duplicated.
- **Execute finish: no population-level coverage before this phase.**
  Only single-crafted-state unit tests existed
  (`combat.depth-epic.engine.test.ts`, `status-depth-selectors.engine.test.ts`)
  plus a deck-membership check (not an outcome witness).
- **Escalation clock (THE CLOCK): no population-level coverage
  before this phase.** Only formula-level unit tests forcing
  `state.round` on a hand-crafted state existed
  (`combat.depth-epic.engine.test.ts` H3/H4).

## Canonical sibling

`axiomancer-mechanics/src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`
— extend it (do not fork a new file; it already owns the
`loadout()` helper, RUNS/SEED constants, and the doctrine-witness
idiom this phase's tests follow).

## Outputs

```
axiomancer-mechanics/src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts   (extended, +3 tests)
```

## Decisions made upfront — DO NOT ASK

- **Execute witness loadout:** `['pyrrhic-victory', 'slippery-slope',
  'hasty-generalization']`. Pyrrhic Victory's `kind: 'execute'` gate
  (`hpPct: 0.3, dotStacks: 3`) is reached via the HP-threshold path
  (the DoT pair erodes the target below 30% before it dies) rather
  than the 3-distinct-DoT path (the pair only covers 2 distinct
  effect types — poison + bleed). That's sufficient: the phase asks
  for population coverage of the execute mechanic firing, not
  coverage of both its gate paths (the dotStacks path already has
  unit coverage). Mirrors the CONCLUDE test's two-test shape: one
  viability check on `LittleBelle`, one `mechanicBurstFraction > 0`
  detonation check on the boss (`KingOfRevenge`).
- **Escalation-clock witness shape — bucket by real round count, not
  policy-vs-policy.** First attempt compared the `turtle` (outlast)
  policy against `dot-weaver` (fast) on the same boss, expecting
  turtle to lose more per the doctrine comment ("a careless or
  over-cautious line loses where before combat was unloseable").
  Measured evidence contradicted this: turtle's guard mitigation
  dominates the signal and can make it *out-survive* dot-weaver
  despite dragging fights out longer (measured directly via a
  throwaway probe, not assumed) — the policy-vs-policy comparison
  conflates two mechanics (guard mitigation and the escalation
  clock) and would be a flaky, mis-attributed witness. The clean
  isolation: run ONE policy/loadout/enemy combo across many seeds,
  bucket the real (fully-played) runs by how many rounds they
  actually took (natural RNG variance — no synthetic round-forcing),
  and compare average player-HP-taken-per-round between the
  short-fight bucket and the long-fight bucket. Measured with the
  `TURTLE` loadout (`['brace-for-impact', 'slippery-slope',
  'hasty-generalization']`) vs `KingOfRevenge` at 300 seeds: round-2
  bucket ~3.5 HP/round, round-4 bucket ~14.7 HP/round (~4x) —
  deterministic at this seed range (fixed seeds, no real randomness),
  not flaky. Test asserts the long bucket exceeds 2x the short
  bucket's per-round rate (safe margin below the measured ~4x).
- **Enemy choice:** `KingOfRevenge` (boss-tier — `THREAT_ESCALATION_BOSS_MULT`
  applies, matching the existing suite's boss-detonation tests) for
  both the Execute-on-boss test and the escalation-clock bucket test.
- **RUNS:** reuse the file's existing `RUNS = 120, SEED = 1` for the
  two Execute tests (matches every other test in the file). The
  clock-bucket test needs denser sampling for stable non-empty
  buckets at both round counts; it uses a local `CLOCK_RUNS = 300`
  rather than raising the shared constant (keeps the rest of the
  suite's runtime unchanged).
- **Test-only.** No engine, content, or export change this phase.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + lint + vitest + build. Must be
green **twice** (determinism check) before commit. No mobile /
card-editor gate needed — touches no public export surface.

## Deploy gate

```bash
npm run deploy:check
```

CI-green (GitHub Actions). Touches `axiomancer-mechanics/**`, so
`verify-mechanics.yml` (and, via path filters, `verify-mobile.yml`
+ `verify-card-editor.yml`) will run. Wait for success; iterate on
failure per `skills/ship-a-phase.md` failure modes (<=3 same-root-
cause iterations).

## Git

```bash
git add axiomancer-mechanics/src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts
git commit -m "$(cat <<'EOF'
test(mechanics): population witnesses for execute + escalation clock — phase 4

- add population-level Execute-finisher witness (Pyrrhic Victory,
  viability + boss detonation, mirrors the CONCLUDE test shape)
- add population-level THE CLOCK witness: buckets real seeded fights
  by round count and confirms longer fights take measurably more
  damage per round (isolated from any policy/guard confound)

Decisions:
- test-only; no engine change
- Conclusion/BODY-sig already had population coverage (pre-existing
  CONCLUDE describe block) — build-plan row premise corrected, no
  duplicate test added
- escalation-clock witness buckets one policy's own seed spread by
  round count rather than comparing turtle-vs-dot-weaver, after
  measuring that comparison conflates guard mitigation with the
  clock (turtle can out-survive dot-weaver despite longer fights)
EOF
)"
git push origin main
```

## DoD

Flip Phase 4 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append the commit hash, add a "Phase log" line. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 4 shipped — balance-sim population witnesses"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- None identified. The three named kill-paths now all have
  population-level coverage (one pre-existing, two added here).
