# Phase 117 — Large-component extraction refactor

## Routes / API endpoints / CLI surface

Target file for this phase:
- `components/combat/PhaseBottom.tsx` — Combat phase bottom section (634 lines → decomposed)

Note: `app/(tabs)/exploration/index.tsx` (717 lines) and `app/(tabs)/inventory/index.tsx` (709 lines) to follow as subsequent phases if this extraction pattern proves successful.

## Content / data reads

Combat view-model via engine presenters:

| Helper | Call | Use |
|--------|------|-----|
| `CombatViewModel` | Passed as prop | Combat phase state, stances, actions, skills |
| `useTooltip` | `useTooltip()` | Tooltip functionality for disabled actions |
| `toRomanLower` | `toRomanLower(number)` | Roman numeral formatting |

## Components / handlers

**New primitives to extract from PhaseBottom.tsx:**
- `PhaseStack.tsx` — Phase progression UI component (visual stack of phases)
- `StanceCard.tsx` — Individual stance selection card component  
- `StancePhase.tsx` — Complete stance selection phase UI
- `ActionPhase.tsx` — Action selection phase UI with flee option
- `SkillPhase.tsx` — Skill selection phase UI
- `SkillRow.tsx` — Individual skill option row component
- `RollBar.tsx` — Progress/stat bar component for rolls
- `ResolvePanel.tsx` — Combat resolution display panel

**Reused primitives:**
- `SectionLabel`, `StanceGlyph`, `ActionIcon`, `TooltipTarget` (unchanged)
- `useTooltip`, `useGameActions`, `useGameState` (unchanged)
- All existing theme tokens from `theme/axm.ts`

## Cross-links

**In (verify):** PhaseBottom functionality remains identical, all combat flows preserved
**Out (ship):** Eight new focused components replace single large file
**Retro-fit:** None required (internal refactor)

## SEO / metadata / output schema

N/A — Mobile app component, no web SEO.

## Hero / body / sub-section composition

PhaseBottom structure after extraction:
- PhaseBottom.tsx: Main container importing and composing sub-components
- PhaseStack: Visual phase progression indicator  
- Phase-specific sections: StancePhase, ActionPhase, SkillPhase
- ResolvePanel: Combat resolution and continuation
- Shared components: StanceCard, SkillRow, RollBar

## Empty / loading / error states

Preserve existing error handling:
- Missing phase data: Engine handles gracefully
- Action/skill unavailable: Disabled states and tooltips preserved  
- Invalid stance selections: Validation preserved

## Decisions made upfront — DO NOT ASK

1. **Target file priority**: PhaseBottom.tsx first (634 lines, most extractable sections)
2. **Component granularity**: Extract 8 focused components, each <100 lines
3. **Props interface**: Each component receives minimal props slice needed
4. **State management**: Preserve existing callback pattern, no internal state changes
5. **Styling approach**: Extract shared styles to component-specific StyleSheet sections
6. **Testing strategy**: Unit tests for each extracted component with mocked props
7. **File locations**: Components stay in `components/combat/` folder alongside PhaseBottom
8. **Import structure**: PhaseBottom imports and composes all sub-components
9. **Accessibility**: Preserve all existing accessibilityRole, accessibilityLabel, testID props
10. **Haptics**: Preserve existing haptic feedback calls

## Mobile reflow / responsive / paginate / output limits

N/A — No responsive changes, preserve existing mobile-first layout and all TouchableOpacity interactions.

## Pages × tests matrix

| Component | Unit Test | Integration |
|-----------|-----------|-------------|
| `PhaseStack` | ✓ | Via PhaseBottom tests |
| `StanceCard` | ✓ | Via PhaseBottom tests |
| `StancePhase` | ✓ | Via PhaseBottom tests |
| `ActionPhase` | ✓ | Via PhaseBottom tests |
| `SkillPhase` | ✓ | Via PhaseBottom tests |
| `SkillRow` | ✓ | Via PhaseBottom tests |
| `RollBar` | ✓ | Via PhaseBottom tests |
| `ResolvePanel` | ✓ | Via PhaseBottom tests |

## Verify gate

```bash
npm run lint        # ESLint passes
npx tsc --noEmit    # TypeScript compilation clean
npm test            # Unit tests pass including new component tests
```

## Commit body template

```
refactor: extract PhaseBottom subcomponents — phase 117

- Extract PhaseStack for phase progression UI
- Extract StanceCard for individual stance selection
- Extract StancePhase for complete stance selection flow
- Extract ActionPhase for action selection with flee option
- Extract SkillPhase for skill selection UI
- Extract SkillRow for individual skill display
- Extract RollBar for progress/stat indicators
- Extract ResolvePanel for combat resolution display
- Preserve all functionality, accessibility, and haptics
- 634 lines → 8 focused components <100 lines each

Decisions:
- Component granularity: Single responsibility per component
- Props interface: Minimal prop drilling, preserve callback pattern
- File structure: Components stay in components/combat/ folder
- Styling: Extract component-specific StyleSheet sections
- Testing: Unit tests for each extracted component
```

## DoD

- [ ] `PhaseBottom.tsx` reduced from 634 lines to composition layer
- [ ] Eight new components in `components/combat/` folder
- [ ] All existing combat phase functionality preserved
- [ ] All accessibility props and testIDs preserved  
- [ ] All haptic feedback preserved
- [ ] Unit tests for each extracted component
- [ ] TypeScript compilation clean
- [ ] Verify gate passes (lint, typecheck, test)
- [ ] Combat phase bottom renders identical to pre-refactor

## Follow-ups (out of scope)

- Exploration screen decomposition (app/(tabs)/exploration/index.tsx, 717 lines)
- Inventory screen decomposition (app/(tabs)/inventory/index.tsx, 709 lines)
- Additional combat UI improvements (separate phases)