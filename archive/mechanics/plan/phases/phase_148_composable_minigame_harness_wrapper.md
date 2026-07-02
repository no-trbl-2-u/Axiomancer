# Phase 148 — Composable minigame harness wrapper

## Outcome

Create a unified composable harness that orchestrates A/B testing, hermetic e2e outcome coverage, and playstyle-strategy divergence measurement across all three minigames (Hazard, Gathering, Quest Board), outputting structured reports for use as a standard verification gate in future balance phases.

## Source spec

Builds on the balance simulation infrastructure established across Phases 145-147. No specific existing spec; this is a synthesis phase that wires the three per-minigame simulators into a single composable runner. Uses Spec 11 (RNG seeding and test harness) for deterministic execution patterns and the established simulator patterns from `hazard.sim.ts`, `gathering.sim.ts`, and `quest-board.sim.ts`.

## Implementation units

### Unit 1: Unified harness types and interface

**File**: `src/World/minigame-harness.types.ts`

**Pattern**: Common type definitions for cross-minigame orchestration

**Core types**:
```typescript
export interface MinigameHarnessConfig {
  minigames: ('hazard' | 'gathering' | 'quest-board')[];
  runs: number;
  seed?: string;
  abTestVariants?: {
    hazard?: [HazardTuning, HazardTuning];
    gathering?: [GatheringTuning, GatheringTuning];
    questBoard?: [QuestBoardTuning, QuestBoardTuning];
  };
}

export interface MinigameHarnessReport {
  timestamp: string;
  totalMinigames: number;
  results: {
    hazard?: HazardBalanceReport;
    gathering?: GatheringBalanceReport;
    questBoard?: QuestBoardBalanceReport;
  };
  abTests?: {
    hazard?: HazardABResult;
    gathering?: GatheringABResult;
    questBoard?: QuestBoardABResult;
  };
  passFail: {
    hazard: boolean;
    gathering: boolean;
    questBoard: boolean;
    overall: boolean;
  };
}

export interface MinigameHarnessSummary {
  minigamesRun: string[];
  totalRuns: number;
  overallPass: boolean;
  recommendations: string[];
}
```

### Unit 2: Core harness orchestrator

**File**: `src/World/minigame-harness.resolver.ts`

**Pattern**: Following the engine + resolver pattern from other World modules

**Core function**:
```typescript
export function runMinigameHarness(config: MinigameHarnessConfig): MinigameHarnessReport;
```

**Implementation approach**:
- Orchestrate calls to individual simulator runners
- Coordinate RNG seeding across all minigames for reproducibility
- Aggregate results into unified report structure
- Apply pass/fail criteria based on balance bands
- Generate consolidated recommendations

**Helper functions**:
```typescript
function runHazardHarness(runs: number, seed: string, abVariants?: [HazardTuning, HazardTuning]): { report: HazardBalanceReport; abTest?: HazardABResult };
function runGatheringHarness(runs: number, seed: string, abVariants?: [GatheringTuning, GatheringTuning]): { report: GatheringBalanceReport; abTest?: GatheringABResult };
function runQuestBoardHarness(runs: number, seed: string, abVariants?: [QuestBoardTuning, QuestBoardTuning]): { report: QuestBoardBalanceReport; abTest?: QuestBoardABResult };
function evaluateOverallBalance(report: MinigameHarnessReport): boolean;
```

### Unit 3: Hermetic e2e test for the harness

**File**: `src/World/e2e/minigame-harness.engine.test.ts`

**Pattern**: Following established e2e test patterns with stubbed RNG

**Test coverage**:
- Single minigame execution (each of the three)
- All minigames together
- A/B testing scenarios
- Reproducible results with same seed
- Pass/fail evaluation logic
- Report structure validation

```typescript
describe('Minigame Harness', () => {
  it('runs single minigame harness', () => { /* ... */ });
  it('orchestrates all three minigames', () => { /* ... */ });
  it('performs A/B testing when variants provided', () => { /* ... */ });
  it('produces deterministic results with same seed', () => { /* ... */ });
  it('correctly evaluates pass/fail criteria', () => { /* ... */ });
});
```

### Unit 4: Export integration

**File**: `src/index.ts`

**Pattern**: Add new exports to public barrel

**New exports**:
```typescript
// Minigame Harness
export {
  runMinigameHarness,
  type MinigameHarnessConfig,
  type MinigameHarnessReport,
  type MinigameHarnessSummary,
} from './World/minigame-harness.resolver';
export type {
  // Re-export types for external access
} from './World/minigame-harness.types';
```

## Decisions made upfront — DO NOT ASK

1. **Module location**: Place in `src/World/` as it orchestrates World minigames; not in a separate `Testing/` or `Harness/` module
2. **RNG coordination**: Use single seed parameter passed down to individual simulators rather than separate seeds per minigame
3. **Report aggregation**: Embed individual minigame reports rather than summarizing them, preserving full detail for analysis
4. **Pass/fail criteria**: Use existing balance bands from individual simulators; overall pass requires all enabled minigames to pass
5. **A/B testing**: Optional per-minigame; if variants not provided, skip A/B testing for that minigame
6. **Default runs**: Follow existing simulator conventions (≥300 runs) for statistical significance
7. **Import strategy**: Import from individual simulator public exports, not internal implementations

## Verify gate

- All existing minigame simulator tests pass unchanged
- New hermetic e2e test covers full harness functionality
- Harness runs cleanly across all three minigames
- Report structure matches typed interface
- `npm run verify` (type-check + test + build)

## Commit body template

```
feat(world): phase 148 — composable minigame harness wrapper

- Create unified harness orchestrating hazard, gathering, and quest board simulators
- Support optional A/B testing across all minigames with unified reporting
- Add hermetic e2e test coverage for cross-minigame orchestration

Decisions:
- Placed in World module as it orchestrates World minigames
- Single seed parameter coordinates RNG across all simulators
- Embed full individual reports rather than summarizing for analysis depth
```

## Definition of Done

- [x] Unified type definitions for cross-minigame orchestration
- [x] Core harness resolver orchestrating all three simulators
- [x] Support for optional A/B testing per minigame
- [x] Structured report aggregation with pass/fail evaluation
- [x] Hermetic e2e test coverage for harness functionality
- [x] Public exports added to src/index.ts
- [x] All existing simulator tests pass unchanged
- [x] Harness runs cleanly across all three minigames
- [x] Reproducible results with seed parameter

## Follow-ups (out of scope)

- Phase 149+: Use harness as standard verification gate in balance phases
- Future: Performance optimization for large-scale batch testing
- Future: Report visualization and analysis tooling
- Future: Additional minigames integration as they're added