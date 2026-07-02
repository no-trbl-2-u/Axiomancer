# Phase 121 — Mobile playthrough integration harness

## Outcome

Scripted integration scenarios that exercise the full player journey end-to-end, from title screen detection through map movement, encounter trigger, combat action selection, round resolution, and aftermath, asserting observable state at each step rather than just presenter shape.

## Why

User observed that mechanical unit tests (Jest presenter/action suites) report everything green but manual play reveals integration gaps — the test harness doesn't catch wiring problems between engine state, presenter output, and UI rendering. The current hermetic component tests verify local behavior but miss cross-component integration flows.

## Routes / API endpoints / CLI surface

N/A — this is internal test infrastructure.

## Content / data reads

N/A — integration tests exercise existing game flow, no new content.

## Components / handlers

- **New**: `test-utils/simulatePlayerAction.ts` helper for driving store actions and flushing React updates
- **New**: `state/e2e/new-player-journey.engine.test.tsx` — full journey from fresh state through first encounter
- **New**: `state/e2e/combat-lifecycle.engine.test.tsx` — prelude → FIGHT → resolution → aftermath flow
- **New**: `state/e2e/re-trigger.engine.test.tsx` — regression guard for Phase 118 issue #191
- **Reused**: `withAllProviders` from Phase 64
- **Reused**: existing action creators from `state/actions`

## Cross-links

**In (verify):** None — these are internal test utilities.  
**Out (ship):** None — test infrastructure doesn't generate user-facing links.  
**Retro-fit:** None.

## SEO / metadata / output schema

N/A — test files don't generate metadata.

## Hero / body / sub-section composition

N/A — test infrastructure.

## Empty / loading / error states

Test cases will cover both success and error scenarios to ensure integration robustness.

## Decisions made upfront — DO NOT ASK

- **Test organization**: Three separate test files (new-player, combat-lifecycle, re-trigger) rather than one monolith for better maintainability
- **Helper location**: `simulatePlayerAction` goes in `test-utils/` alongside `withAllProviders` 
- **Assert strategy**: Verify both engine state mutations AND presenter output to catch wiring gaps
- **Test scope**: Focus on critical user journey paths, not exhaustive permutation testing
- **Naming**: Use "engine.test.tsx" suffix to match existing e2e test convention in `state/e2e/`

## Mobile reflow / responsive / paginate / output limits

N/A — test infrastructure.

## Pages × tests matrix

| Test Suite | Coverage |
|------------|----------|
| `new-player-journey.engine.test.tsx` | Fresh state → title screen → map movement → encounter trigger |
| `combat-lifecycle.engine.test.tsx` | Prelude → FIGHT → action selection → round resolution → aftermath |
| `re-trigger.engine.test.tsx` | Second encounter after first completes (Phase 118 regression) |

## Verify gate

`npm run typecheck && npm test` — all new tests must pass alongside existing suite.

## Commit body template

```
feat: mobile playthrough integration harness — phase 121

- New player journey script: title screen → map → encounter trigger
- Combat lifecycle script: prelude → action → resolution → aftermath  
- Re-trigger script: second encounter regression guard
- simulatePlayerAction helper for driving full state updates

Decisions:
- Split into 3 test files for maintainability over single monolith
- Assert both engine state and presenter output to catch wiring gaps
- Focus on critical paths, not exhaustive permutation coverage

Closes #<phase-issue-number>
```

## DoD

- [ ] All three test scenarios green
- [ ] `simulatePlayerAction` helper implemented and tested
- [ ] Integration tests catch the class of bugs missed by unit tests
- [ ] `npm run verify` passes
- [ ] Build plan updated to `[x]`

## Follow-ups (out of scope)

- Expand to inventory/equipment interaction flows (future phase)
- Add performance benchmarking to integration harness (future phase)
- Visual regression testing integration (blocked on web target)