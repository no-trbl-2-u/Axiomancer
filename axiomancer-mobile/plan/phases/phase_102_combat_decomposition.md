# Phase 102 — Combat.tsx decomposition

## Routes / API endpoints / CLI surface

Combat screen route:
- `app/(tabs)/combat.tsx` — Combat screen main entry (814 lines → decomposed)

## Content / data reads

Combat view-model via engine presenters:
  
| Helper | Call | Use |
|--------|------|-----|
| `useCombatViewModel` | `useCombatViewModel()` | Combat phase stack, enemy, player stats |
| `selectCodexStatusLine` | `useGameState(selectCodexStatusLine)` | Combat status line display |

## Components / handlers

**New primitives to extract:**
- `CombatEnemyPanel.tsx` — Enemy display area with portrait and health
- `CombatPhaseStack.tsx` — Phase progression UI (stance → action → skill → resolving)
- `CombatStanceSection.tsx` — Stance picker for combat phases
- `CombatActionSection.tsx` — Action button selection
- `CombatSkillSection.tsx` — Skill picker when action is 'skill'
- `CombatLogDisplay.tsx` — Combat log entries and battle history

**Reused primitives:**
- `CodexStatusStrip` (preserved)
- `useGameActions`, `useGameState` (preserved)
- All existing theme tokens and styling patterns

## Cross-links

**In (verify):** Combat screen functionality remains identical
**Out (ship):** Six new focused components replace single large file
**Retro-fit:** None required (internal refactor)

## SEO / metadata / output schema

N/A — Mobile app screen, no web SEO.

## Hero / body / sub-section composition

Combat screen structure:
- Header: CodexStatusStrip (unchanged)
- Enemy panel: Portrait, health, status effects
- Phase stack: 4 phases in vertical progression
- Combat log: Scrollable battle history
- Footer: Tab navigation (unchanged)

## Empty / loading / error states

Preserve existing error handling:
- No enemy: Falls back to dev-mode mock
- Invalid phase: Engine handles gracefully
- Action/skill unavailable: Disabled states preserved

## Decisions made upfront — DO NOT ASK

1. **Component granularity**: Extract 6 focused components, each <150 lines
2. **Props interface**: Each component receives only needed slice of view-model
3. **State management**: Preserve existing presenter pattern, no local state changes
4. **Styling approach**: Migrate inline styles to StyleSheet.create per component
5. **Testing strategy**: Unit tests for each extracted component with mocked view-model
6. **File locations**: Components go to `components/combat/` folder
7. **Import structure**: Main combat.tsx imports and composes sub-components

## Mobile reflow / responsive / paginate / output limits

N/A — No responsive changes, preserve existing mobile-first layout.

## Pages × tests matrix

| Component | Unit Test | Integration |
|-----------|-----------|-------------|
| `CombatEnemyPanel` | ✓ | Via combat.screen.test.tsx |
| `CombatPhaseStack` | ✓ | Via combat.screen.test.tsx |
| `CombatStanceSection` | ✓ | Via combat.screen.test.tsx |
| `CombatActionSection` | ✓ | Via combat.screen.test.tsx |
| `CombatSkillSection` | ✓ | Via combat.screen.test.tsx |
| `CombatLogDisplay` | ✓ | Via combat.screen.test.tsx |

## Verify gate

```bash
npm run test        # Unit tests pass
npm run typecheck   # TypeScript compilation clean  
npm run lint        # ESLint passes
npm run test:e2e    # E2E tests verify combat flow unchanged
```

## Commit body template

```
feat: combat screen decomposition — phase 102

- Extract CombatEnemyPanel for enemy display (portrait, health, effects)
- Extract CombatPhaseStack for phase progression UI 
- Extract CombatStanceSection for stance picker
- Extract CombatActionSection for action buttons
- Extract CombatSkillSection for skill selection
- Extract CombatLogDisplay for battle history
- Preserve presenter contract and all functionality
- 814 lines → 6 focused components <150 lines each

Decisions:
- Component granularity: 6 components follow single-responsibility principle
- Props interface: Each component receives minimal view-model slice
- File structure: components/combat/ folder for combat-specific UI
- Styling: Migrate inline styles to StyleSheet.create per component
```

## DoD

- [ ] `app/(tabs)/combat.tsx` reduced from 814 lines to composition layer
- [ ] Six new components in `components/combat/` folder
- [ ] All existing combat functionality preserved
- [ ] Unit tests for each extracted component
- [ ] TypeScript compilation clean
- [ ] Verify gate passes (test, typecheck, lint, e2e)
- [ ] Combat screen render identical to pre-refactor

## Follow-ups (out of scope)

- Combat animation improvements (separate phase)
- Additional combat modes (separate phase)
- Combat tutorial integration (separate phase)