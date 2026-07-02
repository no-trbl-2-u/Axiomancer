# Phase 115 — Production component test coverage expansion

## Routes / API endpoints / CLI surface

Mobile component test coverage expansion following hermetic-test standard:

- No new routes — testing existing production components
- Test files under `components/__tests__/` and subdirectories  
- Follow naming convention: `ComponentName.test.tsx`
- Execute via `npm test` (Jest with jest-expo)

## Content / data reads

Test components via mocked `GameStoreProvider` and engine state fixtures:

| Helper | Call | Use |
|--------|------|-----|
| `createMemoryAdapter` | Direct test setup | Mock persistence for state tests |
| `createAppStore` | Direct test setup | Mock game state for component tests |
| Component mocks | `jest.mock()` | Mock external dependencies (SVGs, navigation) |

## Components / handlers

**Target components for expanded test coverage:**
- Components identified through codebase analysis as highest priority for test coverage
- Focus on production components used in critical user flows
- Components with complex logic or visual state that need verification

**Reused test primitives:**
- `@testing-library/react-native` render utilities
- Jest matchers and test structure  
- Existing mock patterns for engine state and dependencies
- Hermetic test wrapper utilities

## Cross-links

**In (verify):** All new tests must pass `npm test` 
**Out (ship):** Improved test coverage for production components
**Retro-fit:** None required (tests are additive)

## SEO / metadata / output schema

N/A — Component test coverage only.

## Hero / body / sub-section composition

Tests verify:
- Component renders without crashing with various prop combinations
- Proper handling of engine state edge cases  
- Correct visual output for different game states
- Accessibility attributes and interaction handlers

## Empty / loading / error states

Tests cover:
- Empty/null state handling
- Loading states where applicable  
- Error boundary integration
- Edge cases in prop validation

## Decisions made upfront — DO NOT ASK

1. **Scope determination:** Analysis shows StatBar, StanceGlyph, ToastHost, and CombatEnemyPanel already have comprehensive test coverage. Phase will focus on remaining untested production components identified through actual codebase analysis.

2. **Component priority:** Target components with highest production usage and complexity that currently lack test coverage.

3. **Test file locations:** Follow existing patterns - `components/__tests__/` for top-level, subfolder `__tests__/` for nested components.

4. **Test structure:** Mirror existing successful test patterns in codebase following hermetic testing standards.

5. **Mock strategy:** Use existing test utilities and mock patterns already established in codebase.

6. **Coverage verification:** Must achieve demonstrable improvement in component test coverage without breaking existing tests.

## Mobile reflow / responsive / paginate / output limits  

N/A — Component test addition only.

## Pages × tests matrix

| Component Area | Test Coverage Status | Action |
|----------------|---------------------|---------|
| components/ top-level | Comprehensive | Verify complete |  
| components/ subdirectories | Analysis required | Add missing tests |
| Complex visual components | Analysis required | Priority testing |
| Critical path components | Analysis required | Priority testing |

## Verify gate

Standard verify gate: `npm test && npm run typecheck && npm run build`

Must achieve:
- All new tests pass
- No regressions in existing test suite
- No TypeScript errors
- Clean build

## Commit body template

```
feat: production component test coverage expansion — phase 115

- Analyzed current test coverage state across production components
- Added hermetic tests for [specific components identified during implementation] 
- Improved test coverage for critical user flow components
- All tests follow hermetic-test standard in docs/testing.md

Following established test patterns with mocked dependencies.
Tests ensure component stability for production use.
```

## DoD

- [ ] Complete analysis of current component test coverage state
- [ ] Identify specific components needing test coverage (replacing outdated list in phase description)  
- [ ] Add hermetic tests for identified high-priority untested components
- [ ] All new tests pass under `npm test`
- [ ] No regressions in existing test suite
- [ ] Test coverage demonstrably improved in targeted areas

## Follow-ups (out of scope)

- Integration test coverage for component combinations
- Visual regression testing automation  
- Performance testing for complex components
- End-to-end user flow testing beyond component level