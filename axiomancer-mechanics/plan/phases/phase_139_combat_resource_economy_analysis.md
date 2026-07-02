# Phase 139 — Combat Resource Economy Analysis

## Outcome

Comprehensive analysis of resource generation rates vs skill costs across combat scenarios, measuring resource-starved vs resource-flooded patterns and tuning basic action generation rates and skill costs for optimal combat pacing.

## Source spec

This phase addresses resource economy balance identified in PHASE_CANDIDATES expand candidate. Current system has a five-resource economy (heart/body/mind/fallacy/paradox) with generation from basic actions and consumption via skill costs, but lacks systematic analysis of whether players experience resource starvation or flooding across difficulty levels.

## Implementation units

### Unit 1: Resource economy metrics collection
- File: `src/Tuning/resource.metrics.ts`
- Types: `ResourceEconomyMetrics`, `ResourceFlowSnapshot`, `ResourcePattern` interfaces
- Logic: Track resource generation rates, consumption patterns, pool sizes over time during combat scenarios
- Pattern: Mirror existing `engagement.metrics.ts` and `health.metrics.ts` structure with resource-focused telemetry

### Unit 2: Resource economy analysis engine
- File: `src/Tuning/e2e/resource-economy.engine.test.ts`  
- Types: Test scenarios covering low/mid/high tier combat across STRATEGIST playstyles
- Logic: Hermetic e2e tests measuring resource starvation (< 3 total resources for ≥3 rounds) vs flooding (≥ 20 total resources)
- Pattern: Follow existing tuning e2e patterns with fixed RNG and structured scenario coverage

### Unit 3: Resource economy tuning recommendations
- File: `src/Tuning/resource.recommendations.ts`
- Types: `ResourceTuningProposal` with suggested adjustments to generation constants and skill costs  
- Logic: Analyze patterns and propose adjustments to `RESOURCE_GENERATION` constants or specific skill `resourceCost` values
- Pattern: Analysis-only module that proposes changes but doesn't apply them (similar to analyst pattern)

### Unit 4: Integration with existing tuning matrix
- File: `src/Tuning/matrix.runner.ts` (extend existing)
- Types: Add resource economy metrics to existing `TuningResults` 
- Logic: Wire resource metrics collection into existing playtest matrix runs
- Pattern: Extend existing matrix infrastructure rather than parallel system

## Decisions made upfront — DO NOT ASK

1. **Scope**: Pure analysis and measurement. No automatic changes to game constants - only recommendations.
2. **Metrics focus**: Track resource starvation (consistently low pools blocking skill use) and resource flooding (pools growing much faster than consumption).
3. **Target patterns**: Healthy resource economy should see 60-80% of combat rounds where player has 3+ total resources available.
4. **Integration approach**: Wire into existing tuning matrix infrastructure rather than separate analysis system.
5. **Analysis depth**: Focus on basic action generation rates vs skill costs; set bonuses and equipment interactions are secondary.
6. **Evidence threshold**: Require at least 100 combat rounds per scenario to establish patterns.

## Verify gate

- `npm run verify` (type-check + tests + build)
- `npm run combat-tuning` for resource economy evidence collection
- Resource metrics show clear patterns of starvation vs flooding across difficulty tiers

## Commit body template

```
feat(Tuning): phase 139 — combat resource economy analysis

- Add resource economy metrics collection and analysis
- Measure resource generation vs consumption patterns across scenarios  
- Integrate resource flow tracking into tuning matrix
- Generate tuning recommendations for optimal combat pacing

Decisions:
- Analysis-only approach with recommendations, no automatic constant changes
- Focus on basic action generation rates vs skill costs as primary levers
- Target 60-80% of rounds with 3+ total resources available as healthy pattern
```

## Definition of Done

- [ ] Resource economy metrics track generation rates, consumption patterns, pool sizes over combat duration
- [ ] Hermetic e2e coverage shows resource starvation vs flooding patterns across difficulty levels
- [ ] Resource economy analysis integrated into existing tuning matrix infrastructure
- [ ] Resource tuning recommendations generated based on pattern analysis
- [ ] Evidence shows clear resource flow patterns across STRATEGIST playstyle scenarios
- [ ] No changes to game constants or skill costs (analysis phase only)
- [ ] `npm run verify` passes
- [ ] `npm run combat-tuning` includes resource economy telemetry

## Follow-ups (out of scope)

- Automatic application of resource tuning recommendations (separate implementation phase)
- Equipment and set bonus resource interaction analysis
- Multi-combatant resource economy (deferred to Spec 07)
- Philosophical resource (fallacy/paradox) generation rate analysis beyond skill usage