# Phase 100 — Dev-Menu seeded test playthroughs

## Outcome

Add two Dev-Menu seed presets that initialize engine state to reproducible fixtures for testing game extremes: (a) fresh level-1 start-of-game state and (b) max-level endgame state with all items and skills.

## Why

Today everything starts at level 1 / 5-each with enemies that rubber-band to the player, so neither start-of-game nor endgame extremes are easily exercisable for testing. The CRITIQUE [MED] /dev finding identified that balance testing requires reproducible state fixtures. This phase provides the MOBILE Dev-Menu affordance for state seeding — engine-side balance work remains out of scope.

## Scope

### `DebugPlaythroughPresets.tsx`

Two-button row in DevMenu for reproducible test state initialization:

- **FRESH START** button — resets to level-1, minimal gear, early-game enemy scaling
- **ENDGAME** button — sets max-level, all items/skills, endgame enemy scaling

Direct game state manipulation via `store.setState()` to create reproducible test fixtures.

## Routes / API endpoints / CLI surface

No new routes. Component renders inside existing DevMenu on the CHARACTER tab (`app/(tabs)/character/index.tsx`).

## Content / data reads

No content reads. Direct engine state manipulation.

| Helper | Call | Use |
|--------|------|-----|
| `useGameStore()` | Direct setState | State preset application |

## Components / handlers

**New primitives:**
- `DebugPlaythroughPresets` — two-button test preset row

**Reused:**
- `DevMenu` wrapper (existing)
- Button styling from `DebugPresetPicker` pattern  
- `isDevToolsEnabled()` gate pattern

## Cross-links

**In (verify):**
- DevMenu mounts component in character tab
- Presets affect all game state displays across tabs

**Out (ship):**
- Component appears in DevMenu when expanded
- FRESH START creates reproducible level-1 state
- ENDGAME creates reproducible max-level state

**Retro-fit:**
- Add component to `app/(tabs)/character/index.tsx` DevMenu children list

## SEO / metadata / output schema

N/A (dev-only component)

## Hero / body / sub-section composition

`DebugPlaythroughPresets`:
- One row: `[FRESH START] [ENDGAME]`
- Labels: "DEBUG · PLAYTHROUGHS"
- Sub-text: "state seeding for test coverage"

## Empty / loading / error states

Component renders null when `!isDevToolsEnabled()`.

## Decisions made upfront — DO NOT ASK

- **Two presets only** — start-of-game and endgame cover the testing extremes identified in the critique
- **Direct state manipulation** — use `store.setState()` pattern from existing debug components rather than engine actions
- **Character tab placement** — follows established debug component pattern
- **Button styling** — mirror `DebugPresetPicker` visual treatment
- **State fixtures** — Fresh start: level 1, basic equipment; Endgame: max level, all items/skills unlocked

## Mobile reflow / responsive / paginate / output limits

Standard DevMenu responsive behavior. Component collapses to vertical button stack on narrow viewports.

## Pages × tests matrix

| Component | Unit test | Integration | E2E |
|-----------|-----------|-------------|-----|
| `DebugPlaythroughPresets` | Yes | Via DevMenu | Via character tab |

## Verify gate

- `npx tsc --noEmit` (TypeScript)
- `npm test` (Jest + RTL)
- `npm run lint` (ESLint)
- DevMenu renders with new presets in character tab
- Button presses successfully change game state

## Commit body template

```
feat: dev-menu seeded test playthroughs — phase 100

- FRESH START preset for level-1 start-of-game testing
- ENDGAME preset for max-level endgame testing  
- Two-button row in CHARACTER tab DevMenu
- Reproducible state fixtures for balance testing coverage

Decisions:
- Two preset approach covers testing extremes from critique finding
- Direct setState pattern consistent with existing debug components
- CHARACTER tab placement follows established debug affordance pattern

Closes #[ISSUE_NUMBER]
```

## DoD

- [x] `DebugPlaythroughPresets.tsx` component created
- [x] Component integrated into CHARACTER tab DevMenu
- [x] FRESH START preset implemented (level 1, basic state)
- [x] ENDGAME preset implemented (max level, all unlocks)
- [x] Unit tests covering preset application
- [x] Dev-only gate (`isDevToolsEnabled()`) applied
- [x] TypeScript passes
- [x] Tests pass
- [x] ESLint passes

## Follow-ups (out of scope)

- Engine-side balance/progression curve work (CRITIQUE [MED] difficulty, `[needs-engine-release]`)
- Additional preset variations beyond start/endgame extremes
- Preset state persistence across app restarts