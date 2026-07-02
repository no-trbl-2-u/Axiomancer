# Tuning

## Overview

The Tuning module provides automated game balance testing and optimization. It runs statistical experiments on game mechanics, measures health across difficulty levels and playstyles, and automatically applies improvements that make the game more balanced and engaging.

The module is intentionally NOT re-exported from the package's public API (`src/index.ts`) — it's internal tooling for maintaining game balance.

## Core Components

### Experiment Pipeline

- `experiment.runner.ts` — A/B experiment engine. Measures baseline health, applies a candidate change, measures new health, and keeps the change only if it improves balance without regressions.
- `matrix.runner.ts` — Runs combat matrices across level × playstyle × difficulty combinations to gather statistical samples.
- `matrix.builder.ts` — Constructs test matrices with configurable cell weighting and focus filters.

### Health Metrics

- `health.metrics.ts` — Core balance objective with two terms:
  1. **Band deviation** — distance from difficulty-specific success rate targets
  2. **Engagement shortfall** — penalty for low status-effect usage (enforces doctrine)
- `engagement.metrics.ts` — Measures status-effect engagement vs. basic-attack trading
- `difficulty.bands.ts` — Target success rate bands for easy/normal/hard difficulties

### Balance Recommendations

- `analyst.bridge.ts` — Generates balance candidates from three sources:
  1. **Heuristic** — doctrine-aware nudges using parameter direction hints
  2. **API** — Claude Messages API with rich per-cell briefings (optional)
  3. **File** — structured output from `balance-analyst` subagent (optional)
- `tunable.registry.ts` — Allow-listed numeric parameters safe for autonomous tuning
- `tunable.applier.ts` — Applies changes to TypeScript/JSON source files via AST manipulation

### Knowledge & Learning

- `strategist.knowledge.ts` — Machine learning for status-effect optimization. Tracks damage and status leverage per enemy and skill, used by the STRATEGIST playstyle.
- `ledger.ts` — Experiment history to avoid repeating recently-rejected changes
- `focus.parser.ts` — Focus filters for targeted testing (by category, level band, tags, etc.)

### Utilities

- `loadout.builder.ts` — Creates test characters with level-appropriate stats and equipment
- `enemy.scaler.ts` — Scales enemies for specific difficulty/level combinations
- `verify.gate.ts` — Ensures changes don't break builds or tests
- `report.generator.ts` — Formats experiment results for human review
- `cli.ts` — Command-line interface (not part of engine API)

## Design Philosophy

### Status-First Doctrine

The tuning system enforces the game's core design principle: **status effects are the main fun in combat encounters**. This is implemented mathematically through:

- **Engagement scoring** — low status-effect usage is penalized even if win rates are healthy
- **Witness metric** — compares STRATEGIST (status-first) vs AGGRESSIVE (basic-attack) playstyles; basic-attack dominance triggers regression guards
- **Direction hints** — parameter registry includes declared effects on engagement, not just difficulty

### A/B Statistical Rigor

All balance changes are validated through:

- **Paired testing** — same seeds and matchups for before/after comparison
- **Significance testing** — improvements must clear the statistical noise floor
- **Regression guards** — defeat rates, engagement collapse, and witness regressions block changes
- **Confidence levels** — high/medium/low based on sample size and effect size

### Focus-Driven Testing

The system supports targeted optimization through focus filters:

- **Categories** — fundamental, enemy, item, effect, skill, loot
- **Level bands** — early, mid, late, end
- **Tags** — custom groupings for related parameters
- **Date filters** — test only recent changes
- **Sample scaling** — concentrate testing effort on focused areas

## Key Types

### Health Scoring

```typescript
interface HealthScore {
  aggregate: number;           // Combined objective (lower = healthier)
  meanEngagement: number;      // Status-effect usage across matrix
  witness?: WitnessMetric;     // Strategist vs aggressive comparison
  maxDefeatRate: number;       // Regression guard
}

interface HealthComparison {
  winner: 'A' | 'B';
  significant: boolean;        // Clears noise floor
  confidence: 'high' | 'medium' | 'low';
  regression: boolean;         // Defeat rate increased
  engagementRegression: boolean; // Status usage collapsed
  witnessRegression: boolean;  // Basic attacks became dominant
}
```

### Matrix Testing

```typescript
interface MatrixCell {
  level: number;
  playstyle: PlaytestPolicy;   // STRATEGIST | AGGRESSIVE | ...
  difficulty: 'easy' | 'normal' | 'hard';
  enemySlug: string;
  runs: number;
  weight: number;
}

interface FocusFilter {
  categories?: TuningCategory[];
  levelBands?: LevelBand[];
  tags?: string[];
  addedAfter?: string;         // ISO date for recent changes
  sampleScale?: number;        // Multiply focused cell runs
}
```

### Tunable Parameters

```typescript
interface TunableParam {
  id: string;
  kind: 'constant' | 'multiplier' | 'enemy-stat' | 'item-modifier' | 'skill-power' | 'effect-duration' | 'drop-weight';
  category: TuningCategory;
  file: string;                // Repo-relative path
  locator: TunableLocator;     // AST navigation to exact value
  min: number; max: number;    // Hard bounds
  magnitudeCapPct: number;     // Per-experiment change limit
  effect?: {                   // Direction hints for heuristics
    difficulty?: 'raises' | 'lowers' | 'either';
    engagement?: 'raises' | 'lowers' | 'either';
  };
}
```

## Usage Examples

### Basic Experiment

```typescript
import { runExperiment } from './experiment.runner';
import { buildMatrix } from './matrix.builder';

const plan = buildMatrix({
  levels: [1, 5, 10],
  playstyles: ['STRATEGIST', 'AGGRESSIVE'],
  difficulties: ['normal'],
  baseRuns: 20
});

const candidate = {
  paramId: 'player-attack-multiplier',
  proposedValue: 1.15,
  rationale: 'Increase player damage to improve resolution rates',
  source: 'heuristic'
};

const result = await runExperiment(candidate, plan, deps);
// Returns: kept/rejected, health comparison, statistical confidence
```

### Focus Testing

```typescript
import { parseFocus, buildMatrix } from './tuning';

const focus = parseFocus('skill,effect --level=early,mid --added-after=2026-06-01');
const plan = buildMatrix({ focus, sampleScale: 2.0 });
// Tests only skill/effect parameters from recent changes, double sample size
```

### Knowledge Learning

```typescript
import { loadKnowledge, makeAdvisor } from './strategist.knowledge';

const knowledge = loadKnowledge('./strategist-knowledge.json');
const advisor = makeAdvisor(knowledge);

// In combat loop:
const recommendedStance = advisor.recommendStance(enemy, playerState);
const recommendedSkill = advisor.recommendSkill(enemy, availableSkills);
```

## CLI Interface

The module includes a command-line interface (`cli.ts`) for manual testing and debugging:

```bash
# Run full tuning session with focus
npm run tune -- --focus="enemy --level=early" --runs=50

# Test specific candidate
npm run tune -- --candidate="player-defense-base=45" --verify

# Generate recommendations without applying
npm run tune -- --recommendations-only --analyst=api
```

## Integration Points

### Playtest Harness

The Tuning module builds on the existing Playtest module (`../Playtest/`) for combat simulation. Each matrix cell runs multiple playtest sessions with different seeds, then aggregates results for statistical analysis.

### Balance Analyst Agent

The `balance-analyst` subagent (`.claude/agents/balance-analyst.md`) provides AI-driven recommendations that the analyst bridge can validate and auto-apply. This bridges human expertise with automated execution.

### Combat Doctrine

All tuning decisions optimize for the game's core design principle from `VISION.md`: status effects are the main engagement mechanism, not basic-attack trading. This is enforced through engagement metrics and witness comparisons.

## Safety & Validation

### Regression Prevention

- **Defeat rate ceiling** — changes that increase player defeat rates beyond thresholds are rejected
- **Engagement floor** — changes that reduce status-effect usage below 35% are penalized
- **Witness protection** — changes that make basic attacks outperform status play are blocked
- **Build verification** — all changes must pass `npm run verify` before being kept

### Change Constraints

- **Magnitude caps** — parameters can only change by configured percentages per experiment
- **Hard bounds** — min/max values are strictly enforced
- **Step constraints** — some parameters are constrained to integer steps
- **Cooldowns** — recently-rejected changes for a parameter are temporarily blocked

### Transparency

- **Full experiment logs** — every A/B test is recorded with statistical details
- **Source backups** — original values are preserved and can be restored
- **Change attribution** — each kept change includes rationale and confidence level
- **Report generation** — human-readable summaries of all experiments and outcomes

## Test Coverage

The Tuning module has comprehensive hermetic end-to-end test coverage across all 19 source files:

### Core Analytics Tests
- `health.metrics.engine.test.ts` — Health scoring algorithms, band deviation calculations, A/B comparisons
- `matrix.builder.engine.test.ts` — Matrix enumeration, focus filtering, enemy assignment, run scaling
- `analyst.bridge.engine.test.ts` — Recommendation generation, API integration, candidate validation

### Matrix Execution Tests  
- `matrix.runner.engine.test.ts` — Matrix execution workflows, cell processing, strategist knowledge integration
- `experiment.runner.engine.test.ts` — A/B experiment orchestration, baseline/variant comparison, result analysis

### Supporting Module Tests
- `loadout.builder.engine.test.ts` — Character loadout construction for different playstyles and levels
- `tunable.applier.engine.test.ts` — Parameter validation, value application, rollback functionality
- `tunable.registry.engine.test.ts` — Registry loading, filtering, integrity validation
- `strategist.knowledge.engine.test.ts` — Knowledge storage, enemy weakness tracking, strategic recommendations
- `report.generator.engine.test.ts` — Experiment report generation, markdown formatting, data visualization
- `verify.gate.engine.test.ts` — Verification logic, safety checks, integration validation

All tests use proper RNG stubbing via `test-utils/rng.ts` for deterministic outcomes and include both golden path coverage and error case handling. The test suite ensures the tuning system maintains reliability and correctness as it automatically modifies game balance parameters.