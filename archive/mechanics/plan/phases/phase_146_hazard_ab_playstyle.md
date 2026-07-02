# Phase 146 — Hazard A/B + playstyle layer

## Outcome

Extends `hazard.sim.ts` with A/B config variant testing and additional playstyle bots to provide structured JSON reports for the Phase 148 harness.

## Source spec

**Build plan row:** Phase 146 blocked by Phase 145 (now completed). Extends existing `hazard.sim.ts` greedy-bot Monte-Carlo sim with A/B variant runner and additional playstyle bots for divergence measurement.

**Pattern reference:** Quest Board simulator (`quest-board.sim.ts`) which already implements the A/B testing pattern we need to follow.

## Implementation units

### Unit 1: Add playstyle bots to hazard.sim.ts
- **File:** `src/World/Hazard/hazard.sim.ts`
- **Pattern:** Add two new bot policies alongside the existing greedy bot:
  - `conservative` — always takes safe route, only plays sure-win cards, minimal die spending
  - `opportunist` — always takes risk route, aggressive die spending, maximizes high-value plays
- **Types:** Extend `SimStats` interface if needed; add policy parameter to `simulateHazard`

### Unit 2: A/B variant runner
- **File:** `src/World/Hazard/hazard.sim.ts`
- **Pattern:** Following `quest-board.sim.ts` pattern, add:
  - `HazardABResult` interface (configA, configB summaries + significance analysis)
  - `runHazardAB` function taking two `HazardTuning` configs, 300 runs each
  - Compares perfect-rate, failure-rate, avg-wins between configs
  - Returns structured diff for Phase 148 harness consumption

### Unit 3: Balance band reporting
- **File:** `src/World/Hazard/hazard.sim.ts`
- **Pattern:** Add structured JSON report generation:
  - `HazardBalanceBands` interface (per-policy thresholds + actual vs target)
  - `HazardBalanceReport` interface (multiple policies + summary health)
  - `generateHazardBalanceReport` function providing structured data for Phase 148

### Unit 4: Extended balance tests
- **File:** `src/World/Hazard/e2e/hazard.balance.sim.test.ts`
- **Pattern:** Add new test cases for A/B functionality:
  - A/B runner produces meaningful diffs when configs differ
  - New playstyle bots stay within expected divergence ranges
  - Balance report structure validates correctly

## Decisions made upfront — DO NOT ASK

- **Conservative bot strategy:** Safe route only, minimum die spending, targets 90%+ at-least-one-win rate
- **Opportunist bot strategy:** Risk route only, aggressive die spending, targets 15%+ perfect rate
- **A/B significance threshold:** >5pp perfect rate difference OR >5pp failure rate difference
- **Balance band thresholds:** Use existing hazard.balance.sim.test.ts bands as the baseline
- **Tuning config parameter:** Accept `HazardTuning` type (to be imported from hazard.tuning.ts if exists, or typed as any initially)
- **Report format:** JSON-serializable structures for Phase 148 harness consumption

## Verify gate

- `npm run type-check` (zero errors)
- `npm test` (all existing tests pass + new A/B tests)
- `npm run build` (dist/ builds cleanly)
- Existing `hazard.balance.sim.test.ts` stays green with extended coverage

## Commit body template

```
feat(hazard): phase 146 — A/B testing + playstyle divergence

- Add conservative/opportunist bots alongside existing greedy policy
- Implement A/B variant runner with config diff analysis  
- Add structured balance band reporting for harness consumption
- Extend balance tests with A/B validation coverage

Decisions:
- Conservative policy: safe route only, 90%+ win rate target
- Opportunist policy: risk route only, 15%+ perfect rate target
- A/B significance: >5pp rate differences trigger "significant" flag
- JSON output format matches quest-board.sim.ts pattern
```

## Definition of Done

- [ ] Two new playstyle bots (conservative, opportunist) implemented in hazard.sim.ts
- [ ] A/B variant runner accepts two HazardTuning configs and returns structured diff
- [ ] Balance band reporting provides JSON output for Phase 148 harness
- [ ] All existing hazard.balance.sim.test.ts cases pass unchanged
- [ ] New test cases validate A/B functionality and bot policies
- [ ] Verify gate passes (type-check + test + build)
- [ ] No breaking changes to existing hazard.sim.ts exports

## Follow-ups (out of scope)

- Actual balance tuning changes (Phase 149+ will use this harness for evidence-backed adjustments)
- Integration with Phase 148 composable harness (handled in Phase 148)
- Additional bot policies beyond conservative/opportunist (future iterations)