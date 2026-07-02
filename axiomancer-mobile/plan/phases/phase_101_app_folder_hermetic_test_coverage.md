# Phase 101 — App-folder hermetic test coverage

## Routes / API endpoints / CLI surface

Mobile app routes under `app/` directory following Expo Router file-based routing:

- `app/index.tsx` — Root index with title screen logic and navigation redirect  
- `app/_layout.tsx` — Root layout with providers, fonts, persistence  
- `app/(tabs)/_layout.tsx` — Tab layout (already covered by existing tests)
- `app/(tabs)/character/index.tsx` — Character screen (has .screen.test.tsx)
- `app/(tabs)/combat.tsx` — Combat screen (has .screen.test.tsx) 
- `app/(tabs)/exploration/index.tsx` — Exploration screen (has .screen.test.tsx)
- `app/(tabs)/inventory/index.tsx` — Inventory screen (has .screen.test.tsx)
- `app/(tabs)/memoir/index.tsx` — Memoir screen (has .screen.test.tsx)
- `app/event/index.tsx` — Event modal screen (has .screen.test.tsx)

## Content / data reads

Tests read engine state via mocked `GameStoreProvider` and `useGameState`:

| Helper | Call | Use |
|--------|------|-----|
| `selectOnboardingViewModel` | `useGameState(selectOnboardingViewModel)` | Title screen vs redirect logic |
| `selectActiveTab` | `useGameState(selectActiveTab)` | Navigation redirect target |

## Components / handlers

**New primitives to test:**
- App root index route mounting and onboarding flow
- App root layout provider hierarchy mounting

**Reused primitives:**
- `TitleScreen` component (imported from `@/components/TitleScreen`)
- All provider components (`GameStoreProvider`, `AestheticModeProvider`, etc.)
- Existing test utilities (`createMemoryAdapter`, `createAppStore`)

## Cross-links

**In (verify):** Route-tree test ensures only valid routes exist under `app/`
**Out (ship):** Tests verify route navigation logic works end-to-end
**Retro-fit:** None required (tests are additive)

## SEO / metadata / output schema

N/A — Mobile app routes, no web SEO.

## Hero / body / sub-section composition

Tests verify:
- Root index renders `TitleScreen` for new players  
- Root index renders `Redirect` for returning players
- Root layout mounts full provider hierarchy without crashing
- Error boundary and corrupt save modal integration

## Empty / loading / error states

- New player: shows title screen
- Returning player: redirects to active tab
- Font loading: shows nothing until loaded
- Persistence loading: shows nothing until loaded
- Corrupt save: shows modal
- Error boundary: tested separately

## Decisions made upfront — DO NOT ASK

1. **Test location:** `state/e2e/app-routes.engine.test.tsx` (not individual files per route)
2. **Coverage focus:** Root index and layout only — tab screens already have `.screen.test.tsx` files
3. **Mock strategy:** Mock `expo-router` navigation, use `createMemoryAdapter` for state
4. **Title screen testing:** Test the conditional logic, not the component internals
5. **Provider testing:** Mount the full hierarchy, assert no crashes and basic functionality
6. **Font loading:** Mock `useFonts` to return loaded state immediately

## Mobile reflow / responsive / paginate / output limits

N/A — Route logic testing only, no visual layout concerns.

## Pages × tests matrix

| Route | Test Coverage |
|-------|---------------|
| `app/index.tsx` | Onboarding flow, navigation redirect logic |
| `app/_layout.tsx` | Provider hierarchy mounting, font/persistence loading |

All other routes already have comprehensive `.screen.test.tsx` coverage.

## Verify gate

Standard verify gate: `npm run typecheck && npm test && npm run build`

## Commit body template

```
feat: app-folder hermetic test coverage — phase 101

- Add hermetic e2e tests for root app routes (index, layout)
- Test onboarding flow and navigation redirect logic
- Test provider hierarchy mounting and loading states
- Achieve 100% hermetic coverage for app/ route components

Following docs/testing.md hermetic standard with mocked dependencies.
Tests live under state/e2e/ per the testing standard.
```

## DoD

- [x] Hermetic e2e tests added for root app routes
- [x] Tests cover onboarding flow branch conditions  
- [x] Tests verify provider mounting and error boundaries
- [x] All tests pass under `npm test`
- [x] No files added under `app/` (tests go in `state/e2e/`)

## Follow-ups (out of scope)

- Web target route testing (when web support is added)
- Deep link handling testing (when deep links are implemented)  
- Real device behavior testing (haptics, fonts) — remains manual