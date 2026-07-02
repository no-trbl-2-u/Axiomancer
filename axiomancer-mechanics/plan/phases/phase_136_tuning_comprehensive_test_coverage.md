# Phase 136 — Tuning Module Comprehensive Test Coverage

## Outcome
Tuning module has comprehensive hermetic e2e test coverage for all 19 source files with focus on the 6 core files identified in AUDIT finding, ensuring `npm run verify` passes consistently.

## Source spec
References RNG seeding and test harness standards from `specs/11-rng-seeding-and-test-harness.md`. Phase promotes AUDIT finding from PHASE_CANDIDATES expand-51 focused on `analyst.bridge.ts`, `engagement.metrics.ts`, `health.metrics.ts`, `matrix.builder.ts`, `matrix.runner.ts`, `experiment.runner.ts`.

## Implementation units

### Unit 1: Core analytics test coverage
Files: `src/Tuning/e2e/analyst.bridge.engine.test.ts` (expand existing), `src/Tuning/e2e/health.metrics.engine.test.ts` (new), `src/Tuning/e2e/matrix.builder.engine.test.ts` (new)
- Expand existing `analyst.bridge.engine.test.ts` to cover all public methods and error paths
- Create `health.metrics.engine.test.ts` testing health calculation algorithms with stubbed RNG
- Create `matrix.builder.engine.test.ts` testing scenario matrix construction with various difficulty configurations

### Unit 2: Matrix execution test coverage  
Files: `src/Tuning/e2e/matrix.runner.engine.test.ts` (new), `src/Tuning/e2e/experiment.runner.engine.test.ts` (new)
- Create `matrix.runner.engine.test.ts` testing full matrix execution workflows with mocked combat scenarios
- Create `experiment.runner.engine.test.ts` testing experiment orchestration and result collection

### Unit 3: Supporting module test coverage
Files: `src/Tuning/e2e/` additions for remaining uncovered modules
- Create hermetic e2e tests for: `loadout.builder.ts`, `tunable.applier.ts`, `tunable.registry.ts`, `strategist.knowledge.ts`, `report.generator.ts`, `verify.gate.ts`
- Each test uses proper RNG stubbing via `test-utils/rng.ts` and tests golden path + one error case minimum

## Decisions made upfront — DO NOT ASK
- **RNG approach**: All tests use `mockFixedRng`, `mockAlternatingRng`, or `mockSequentialRng` from `src/test-utils/rng.ts` — no custom vi.spyOn for RNG
- **Test scope**: Hermetic e2e tests only, driving modules through their public entry points, not unit tests for internal functions
- **Error coverage**: Each test covers golden path plus at least one error case (invalid input, missing dependencies, etc.)
- **Existing test handling**: Expand existing tests rather than replace; maintain current test structure and naming patterns
- **Mock strategy**: Use dependency injection where available; stub external dependencies (file system, combat engine) but test internal Tuning logic end-to-end

## Verify gate
- `npm run verify` must pass (includes `npm run type-check && npm test && npm run build`)
- All new tests must be hermetic (no external dependencies, no file system access except through mocks)
- Coverage increase measurable in test output

## Commit body template
```
test(tuning): phase 136 — comprehensive test coverage

- Expand analyst.bridge.engine.test.ts with full method coverage
- Add health.metrics.engine.test.ts with RNG-stubbed health calculations  
- Add matrix.builder.engine.test.ts with scenario construction tests
- Add matrix.runner.engine.test.ts with execution workflow tests
- Add experiment.runner.engine.test.ts with orchestration tests
- Add e2e tests for 6 supporting modules with hermetic coverage

Decisions:
- Used test-utils/rng.ts stubs exclusively for RNG mocking
- Focused on e2e coverage over unit test granularity per module standards
- Maintained existing test structure and naming conventions

Verification: tuning e2e green + npm run verify
```