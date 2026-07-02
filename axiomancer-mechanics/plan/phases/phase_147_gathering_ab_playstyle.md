# Phase 147 — Gathering A/B + playstyle layer

## Outcome

Extend the existing `gathering.sim.ts` Monte-Carlo simulator with A/B config-variant testing and additional playstyle bots, enabling comparative tuning analysis for the Phase 148 minigame harness while preserving existing balance bands.

## Source spec

Builds on the Gathering engine from Spec 08 (world content and hazards). Phase 147 extends the existing `gathering.sim.ts` simulator that already has 3-policy Monte-Carlo testing (timid/balanced/greedy, 400 seeded runs). No new gameplay mechanics; purely simulation and balance-testing infrastructure following the pattern established in Phase 145 (Quest Board simulator) and Phase 146 (Hazard A/B layer).

## Implementation units

### Unit 1: Additional playstyle bots

**File**: `src/World/Gathering/gathering.sim.ts`

**Pattern**: Extend existing `GatherPolicyId` type and policy functions

**New bot policies**:
- **`wrath-pusher`** — Deliberately escalates wrath to 6-7, seeks communion plots to reset, maximizes extraction per depth
- **`communion-chaser`** — Prioritizes communion plots even at low wrath, seeks spiritual connection over material yield

**Types to extend**:
```typescript
export type GatherPolicyId = 'timid' | 'balanced' | 'greedy' | 'wrath-pusher' | 'communion-chaser';
```

**New policy functions**:
```typescript
function wrathPusherPolicy(s: GatheringSessionState, ctx: PolicyCtx): PolicyAction;
function communionChaserPolicy(s: GatheringSessionState, ctx: PolicyCtx): PolicyAction;
```

### Unit 2: A/B variant testing infrastructure

**File**: `src/World/Gathering/gathering.sim.ts`

**Pattern**: Following the hazard.sim.ts A/B runner pattern from Phase 146

**New types**:
```typescript
export interface GatheringTuning {
  wrathThreshold: number;
  eruptionPenalty: number;
  communionBonus: number;
  // Other tuning parameters as needed
}

export interface GatheringABResult {
  configA: GatheringTuning;
  configB: GatheringTuning;
  runs: number;
  comparison: {
    eruptionRateDiff: number;
    avgRichnessDiff: number;
    shillingsDiff: number;
    communionRateDiff: number;
  };
}
```

**Core A/B function**:
```typescript
export function runGatheringABTest(configA: GatheringTuning, configB: GatheringTuning, runs = 400): GatheringABResult;
```

### Unit 3: Structured JSON balance report

**File**: `src/World/Gathering/gathering.sim.ts`

**Pattern**: Phase 148 harness-consumable report format

**Report structure**:
```typescript
export interface GatheringBalanceReport {
  timestamp: string;
  totalRuns: number;
  policies: Record<GatherPolicyId, GatherSimSummary>;
  balanceBands: {
    eruptionRateMax: number;
    communionRateMin: number;
    richnessGradient: [number, number, number]; // timid, balanced, greedy
  };
  recommendations: string[];
}

export function generateGatheringBalanceReport(runs = 400): GatheringBalanceReport;
```

## Decisions made upfront — DO NOT ASK

1. **No balance changes**: Existing tuning constants in `gathering.tuning.ts` remain unchanged; this phase adds testing infrastructure only
2. **Bot complexity**: New bots use simple heuristics like existing policies; no complex multi-turn planning
3. **A/B test scope**: Focus on core economy parameters (wrath, richness, shillings); don't test content variations
4. **Report format**: JSON structure optimized for Phase 148 harness consumption, not human readability

## Verify gate

- Existing `gathering.balance.sim.test.ts` passes unchanged (proves no regression)
- New A/B test cases for config variant comparison
- New playstyle bot tests proving divergent behavior
- `npm run verify` (type-check + test + build)

## Commit body template

```
feat(gathering): phase 147 — A/B testing and playstyle extension

- Add wrath-pusher and communion-chaser bot policies
- Implement A/B config variant testing infrastructure  
- Generate structured JSON balance reports for Phase 148 harness

Decisions:
- Preserved existing balance bands to avoid regression
- Followed hazard.sim.ts A/B pattern for consistency
```

## Definition of Done

- [ ] Two new playstyle bots (wrath-pusher, communion-chaser) with distinct behaviors
- [ ] A/B variant runner comparing two GatheringTuning configs
- [ ] Structured JSON balance report generation
- [ ] Existing balance tests pass unchanged
- [ ] New hermetic test coverage for A/B functionality
- [ ] JSON report structure documented and typed
- [ ] Zero balance changes to existing gathering content

## Follow-ups (out of scope)

- Phase 148: Wire gathering A/B into the composable harness
- Future: Content-based A/B tests (different site layouts, plot distributions)
- Future: Multi-variable optimization beyond binary A/B comparison