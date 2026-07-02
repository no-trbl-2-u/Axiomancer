# Phase 145 — Quest Board simulator (A/B + e2e + playstyle)

## Outcome

Build a comprehensive balance simulator for the Quest Board minigame following the `hazard.sim.ts` / `gathering.sim.ts` pattern, enabling outcome-distribution measurement, balance band verification, and A/B testing between different tuning configurations.

## Source spec

Builds on the Quest Board engine implemented in `src/World/QuestBoard/`. No single spec covers this balance simulator functionality; Phase 145 fills the major gap where Quest Board has only engine-correctness unit tests (`quest-board.engine.test.ts`) with no outcome-distribution measurement or balance bands.

## Implementation units

### Unit 1: Core simulator with scripted bots

**File**: `src/World/QuestBoard/quest-board.sim.ts`

**Pattern**: Following `hazard.sim.ts` / `gathering.sim.ts` Monte-Carlo runner pattern

**Bot policies** (3+ scripted players with distinct strategies):
- **`safe`** — Always takes lowest-risk verbs, avoids press-your-luck, prefers bribe/detour options, leaves markets quickly
- **`gambler`** — Always press-your-luck at gather spots, fights duels instead of bribes, takes risky snag crossings
- **`economist`** — Optimizes shilling yield per turn, balances risk vs. reward based on fish reserves

**Core types**:
```typescript
export type QuestBoardPolicyId = 'safe' | 'gambler' | 'economist';

export interface QuestBoardSimRunResult {
  seed: number;
  boardId: string; 
  policy: QuestBoardPolicyId;
  outcome: QuestBoardOutcome;
  daysTaken: number;
  fishLeft: number;
  vigorLeft: number;
  vowsKept: number;
  metrics: QuestBoardMetrics;
}

export interface QuestBoardSimSummary {
  runs: number;
  policy: QuestBoardPolicyId;
  tiers: Record<QuestOutcomeTier, number>;
  avgDaysTaken: number;
  avgFishLeft: number;
  avgVigorLeft: number;
  avgVowsKept: number;
  masterworkRate: number;
  seaworthyRate: number;
  driftwoodRate: number;
}
```

**Functions**:
- `simulateQuestBoard(seed: number, boardId: string, policy: QuestBoardPolicyId): QuestBoardSimRunResult`
- `runQuestBoardSim(options: { runs: number; policy: QuestBoardPolicyId; boardId?: string; startSeed?: number }): QuestBoardSimSummary`

### Unit 2: A/B variant runner

**Extension** of the core simulator with config-diffing capability

**A/B runner types**:
```typescript
export interface QuestBoardABResult {
  configA: QuestBoardSimSummary;
  configB: QuestBoardSimSummary;
  significant: boolean;
  analysis: {
    masterworkDiff: number;
    daysTakenDiff: number;
    vowsKeptDiff: number;
  };
}
```

**Functions**:
- `runQuestBoardAB(configA: QuestBoardTuning, configB: QuestBoardTuning, options: { runs: number; boardId?: string }): QuestBoardABResult`

### Unit 3: Balance band report (structured JSON)

**JSON output** for Phase 148 harness consumption

**Balance band types**:
```typescript
export interface QuestBoardBalanceBands {
  boardId: string;
  policy: QuestBoardPolicyId;
  masterworkRate: { min: number; max: number; actual: number; inBand: boolean };
  avgDaysTaken: { min: number; max: number; actual: number; inBand: boolean };
  avgVowsKept: { min: number; max: number; actual: number; inBand: boolean };
  overallHealth: 'healthy' | 'needs_tuning';
}

export interface QuestBoardBalanceReport {
  bands: QuestBoardBalanceBands[];
  timestamp: string;
  summary: { healthyBoards: number; totalBoards: number };
}
```

**Function**:
- `generateQuestBoardBalanceReport(): QuestBoardBalanceReport`

## Decisions made upfront — DO NOT ASK

1. **Bot count**: Exactly 3 bots (safe/gambler/economist) to match gathering simulator's 3-policy pattern and provide measurable playstyle divergence
2. **Runs per policy**: Default to 300 runs to match hazard balance band standard (fast suite, ~±5pp noise)
3. **Board rotation**: When `boardId` not specified, test only `'build-the-boat'` (the canonical first board) to keep initial implementation focused  
4. **Significance testing**: A/B considers results significant if masterwork rate difference >10pp OR average days difference >0.5 days
5. **Balance band thresholds**: Safe policy masterwork rate 15-35%, economist 25-45%, gambler 5-25% (subject to tuning after initial data)
6. **RNG seeding**: Follow existing pattern: `startSeed + i * 7919` where i = run index
7. **Policy bot logic**: Use similar decision tree structure to gathering bots, with space-specific choice functions per verb type
8. **JSON report format**: Match the structured report pattern that Phase 148 harness expects to consume

## Verify gate

- `npm run type-check` — TypeScript compilation clean
- `npm test` — all tests including new hermetic e2e pass  
- `npm run build` — dist/ builds successfully

## Commit body template

```
feat(quest-board): phase 145 — balance simulator with A/B testing

- Core Monte-Carlo simulator with 3 scripted bot policies (safe/gambler/economist)
- A/B variant runner for config comparison with significance analysis  
- Balance band reporting with structured JSON output for Phase 148 harness
- 300-run simulation suite following hazard.sim.ts / gathering.sim.ts patterns

Decisions:
- 3 bot policies chosen for clear playstyle divergence measurement
- Default 300 runs per policy to match established balance test standards
- Focus on 'build-the-boat' board initially for concrete implementation scope
- A/B significance threshold: >10pp masterwork rate OR >0.5 days difference

Closes #<phase-issue-number>
```

## Definition of Done

- [ ] `quest-board.sim.ts` implements core simulator with 3 scripted bot policies
- [ ] Monte-Carlo runner executes 300 seeded runs per bot per board
- [ ] A/B variant runner compares two `QuestBoardTuning` configs with diff analysis
- [ ] Balance band report generates structured JSON for Phase 148 harness consumption  
- [ ] Hermetic e2e test at `src/World/QuestBoard/e2e/quest-board.balance.sim.test.ts`
- [ ] New A/B test cases verify config comparison functionality
- [ ] All existing quest-board tests remain green
- [ ] `npm run verify` passes completely
- [ ] No balance changes to quest-board content (simulator only)

## Follow-ups (out of scope)

- Phase 146: Hazard A/B + playstyle layer (extends hazard.sim.ts)
- Phase 147: Gathering A/B + playstyle layer (extends gathering.sim.ts)  
- Phase 148: Composable minigame harness wrapper (consumes this simulator)
- Balance tuning runs using the new simulator (separate phase)
- Additional board support beyond 'build-the-boat' (when more boards exist)