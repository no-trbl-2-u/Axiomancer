# Phase 119 — Large-component extraction continuation (exploration + inventory)

## Routes / API endpoints / CLI surface

Target files for this phase:
- `app/(tabs)/exploration/index.tsx` — Exploration screen (731 lines → decomposed)
- `app/(tabs)/inventory/index.tsx` — Inventory screen (709 lines → decomposed)

Following Phase 117's successful PhaseBottom extraction pattern.

## Content / data reads

### Exploration screen view-models:
| Helper | Call | Use |
|--------|------|-----|
| `selectExplorationViewModel` | Via useGameState | Map nodes, current position, available options |
| `selectExplorationCodexHeader` | Via useGameState | Codex header state |
| `selectEventViewModel` | Via useGameState | Event modal data |
| `selectHasActiveEvent` | Via useGameState | Event modal visibility |
| `useTooltip` | `useTooltip()` | Tooltip functionality for disabled actions |

### Inventory screen view-models:
| Helper | Call | Use |
|--------|------|-----|
| `selectInventoryViewModel` | Via useGameState | Inventory items, equipment dock, tabs |
| `selectItemModalViewModel` | Via useGameState | Item detail modal data |
| `useTooltip` | `useTooltip()` | Tooltip functionality for item interactions |

## Components / handlers

### New primitives to extract from exploration/index.tsx:
- `MapCanvas.tsx` — Interactive exploration map with pan/zoom gestures
- `NodeGrid.tsx` — Grid layout of exploration nodes
- `ExplorationNode.tsx` — Individual map node component with type-specific styling
- `OptionsList.tsx` — Available node options/actions list
- `OptionRow.tsx` — Individual option row with icon and accessibility
- `EventBadge.tsx` — Node type badge component (ENCOUNTER, TREASURE, etc.)

### New primitives to extract from inventory/index.tsx:
- `PaperDoll.tsx` — Character silhouette SVG component (already function-extracted)
- `EquipmentDock.tsx` — Equipment slots container
- `EquipmentSlot.tsx` — Individual equipment slot with tooltip support
- `InventoryTabs.tsx` — Tab navigation for inventory sections
- `ItemGrid.tsx` — Grid layout for inventory items
- `ItemModal.tsx` — Item detail modal component
- `StatPreview.tsx` — Stat comparison preview for equipment

**Reused primitives:**
- All existing shared components (`ScreenBg`, `SectionLabel`, `StatusCard`, `ItemCard`, etc.)
- All existing hooks (`useTooltip`, `useGameActions`, `useGameState`, `useAesthetic`, etc.)
- All existing theme tokens from `theme/axm.ts`

## Cross-links

**In (verify):** Both screens preserve identical functionality, gestures, and user interactions
**Out (ship):** 13 new focused components replace two large files
**Retro-fit:** None required (internal refactor)

## SEO / metadata / output schema

N/A — Mobile app components, no web SEO.

## Hero / body / sub-section composition

### Exploration screen structure after extraction:
- exploration/index.tsx: Main container importing and composing sub-components
- MapCanvas: Interactive map with gesture handling
- NodeGrid + ExplorationNode: Visual node representation
- OptionsList + OptionRow: Available actions interface
- EventBadge: Node type indicators

### Inventory screen structure after extraction:
- inventory/index.tsx: Main container importing and composing sub-components
- PaperDoll: Character visual representation
- EquipmentDock + EquipmentSlot: Equipment management interface
- InventoryTabs + ItemGrid: Item browsing interface
- ItemModal + StatPreview: Item detail and comparison

## Empty / loading / error states

Preserve existing error handling:
- Missing map data: Engine handles gracefully
- Empty inventory: Existing empty state preserved
- Invalid equipment slots: Validation preserved
- Missing item data: Existing fallback behavior preserved

## Decisions made upfront — DO NOT ASK

1. **Target files**: Both exploration and inventory screens in single phase
2. **Component granularity**: Extract 13 focused components total, each <100 lines
3. **Props interface**: Each component receives minimal props slice needed
4. **State management**: Preserve existing hook pattern, no internal state changes
5. **Styling approach**: Extract shared styles to component-specific StyleSheet sections
6. **File locations**: 
   - Exploration components stay in `components/exploration/` folder
   - Inventory components stay in `components/inventory/` folder
7. **Gesture handling**: Preserve existing pan/zoom gestures in MapCanvas component
8. **Animation**: Preserve all existing Reanimated animations and SharedValues
9. **Accessibility**: Preserve all existing accessibilityRole, accessibilityLabel, testID props
10. **SVG components**: Keep SVG code in extracted components, preserve all viewBox and styling
11. **Modal handling**: Preserve existing modal state management patterns
12. **Tooltip integration**: Maintain existing TooltipProvider/TooltipTarget patterns

## Mobile reflow / responsive / paginate / output limits

N/A — No responsive changes, preserve existing mobile-first layout and all TouchableOpacity/gesture interactions.

## Pages × tests matrix

| Component | Unit Test | Integration |
|-----------|-----------|-------------|
| `MapCanvas` | ✓ | Via exploration/index tests |
| `NodeGrid` | ✓ | Via exploration/index tests |
| `ExplorationNode` | ✓ | Via exploration/index tests |
| `OptionsList` | ✓ | Via exploration/index tests |
| `OptionRow` | ✓ | Via exploration/index tests |
| `EventBadge` | ✓ | Via exploration/index tests |
| `PaperDoll` | ✓ | Via inventory/index tests |
| `EquipmentDock` | ✓ | Via inventory/index tests |
| `EquipmentSlot` | ✓ | Via inventory/index tests |
| `InventoryTabs` | ✓ | Via inventory/index tests |
| `ItemGrid` | ✓ | Via inventory/index tests |
| `ItemModal` | ✓ | Via inventory/index tests |
| `StatPreview` | ✓ | Via inventory/index tests |

## Verify gate

```bash
npm run lint        # ESLint passes
npx tsc --noEmit    # TypeScript compilation clean
npm test            # Unit tests pass including new component tests
```

## Commit body template

```
refactor: extract exploration + inventory subcomponents — phase 119

- Extract MapCanvas for interactive exploration map with gestures
- Extract NodeGrid and ExplorationNode for map visualization
- Extract OptionsList and OptionRow for action selection
- Extract EventBadge for node type indicators
- Extract PaperDoll for character visual representation
- Extract EquipmentDock and EquipmentSlot for equipment management
- Extract InventoryTabs and ItemGrid for inventory browsing
- Extract ItemModal and StatPreview for item details
- Preserve all functionality, accessibility, gestures, and animations
- 731 + 709 lines → 13 focused components <100 lines each

Decisions:
- Component granularity: Single responsibility per component
- File structure: Components organized in components/exploration/ and components/inventory/
- Gesture handling: Preserve pan/zoom in MapCanvas component
- Props interface: Minimal prop drilling, preserve hook patterns
- Animation: Maintain all Reanimated SharedValues and gestures
- Styling: Extract component-specific StyleSheet sections
```

## DoD

- [ ] `app/(tabs)/exploration/index.tsx` reduced from 731 lines to composition layer
- [ ] `app/(tabs)/inventory/index.tsx` reduced from 709 lines to composition layer
- [ ] Six new components in `components/exploration/` folder
- [ ] Seven new components in `components/inventory/` folder
- [ ] All existing exploration functionality preserved (map interaction, node selection)
- [ ] All existing inventory functionality preserved (equipment, tabs, modals)
- [ ] All gesture handling preserved (pan, zoom, touch targets)
- [ ] All animations and SharedValues preserved
- [ ] All accessibility props and testIDs preserved
- [ ] Unit tests for each extracted component
- [ ] TypeScript compilation clean
- [ ] Verify gate passes (lint, typecheck, test)
- [ ] Both screens render identical to pre-refactor

## Follow-ups (out of scope)

- Additional screen decompositions if more large files emerge
- Enhanced gesture interactions (separate phases)
- Performance optimizations for map rendering (separate phases)