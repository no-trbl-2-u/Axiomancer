# Phase 98 — Combat terminology implementation

## Outcome

Implement the terminology and iconography improvements designed in Phase 96 across the combat UI. Replace engine jargon with player-friendly language, update confusing icons, and improve information hierarchy. Addresses AUDIT [4.5] Combat UX unintuitive and closes playtest findings [F02]/[F04]/[F05]/[F06].

## Why

Phase 96 produced the design specification for fixing combat UX comprehension barriers. This phase implements those designs, transforming the combat interface from "decode the interface" to "understand the tactical situation" through player-centric terminology and clearer visual hierarchy.

## Surface / Routes

**No route changes.** Updates existing combat screen at `app/(tabs)/combat.tsx` and combat components.

## Content / data reads

| Helper | Call | Use |
|---|---|---|
| `selectCombatViewModel` | `selectCombatViewModel(state)` | Get current combat state and format with new terminology |
| Existing combat selectors | N/A | Updated to return player-friendly labels |

## Components / handlers

**Updated existing components:**
- `app/(tabs)/combat.tsx` — main combat screen with new terminology
- `components/combat/CombatPanel.tsx` — updated labels and phase descriptions
- `components/combat/PhaseBottom.tsx` — action buttons with clear language
- `components/ActionIcon.tsx` — improved icon comprehension
- `components/EffectChip.tsx` — player-friendly effect names
- `components/EffectGlyph.tsx` — clearer visual symbols
- `components/StanceGlyph.tsx` — intuitive stance indicators

**Reused primitives:**
- Theme tokens from `theme/axm.ts` (unchanged)
- Existing layout components
- Current combat flow and mechanics

## Cross-links

**In (verify):** Combat remains accessible from main tab navigation.
**Out (ship):** No new outbound links added.
**Retro-fit:** None required — combat is a standalone screen.

## SEO / metadata

**Not applicable** — mobile app with no web URLs.

## Hero / body / sub-section composition

**Combat screen layout (unchanged structure, updated content):**
- Header: "COMBAT" remains, but phase labels use player-friendly terms
- Body: Combat panel with clearer terminology and iconography  
- Footer: Action buttons with intuitive language ("COMMIT" vs "LET IT FALL")

**Key terminology updates:**
- "Choose a Stance" (was `choosingStance`)
- "Your Move" (was `choosingAction`) 
- "Select Technique" (was `choosingSkill`)
- "Strike Unfolds" (was `resolving`)
- "TECHNIQUES" header (was "CRUCIBLE")
- "VITAE" label (retained as Axiomancer canon; do not replace with "HEALTH")
- "FOCUS" indicator (was "MIND MARKS")

## Empty / loading / error states

**Preserved existing states with updated terminology:**
- No combat active: "No battle in progress"
- Loading combat: "Preparing for battle..."
- Error state: "Battle interrupted - restart to continue"

## Decisions made upfront — DO NOT ASK

1. **Terminology source:** Use exact mappings from `design/combat-ux-overhaul.md` terminology table. No improvisation on language.

2. **Implementation scope:** Focus only on terminology and iconography as specified in Phase 96 design. No functional changes to combat mechanics.

3. **Presenter layer:** Update presenter to return player-friendly labels while maintaining existing data structure and contract.

4. **Icon improvements:** Enhance visual clarity of existing icons without wholesale redesign. Maintain current icon structure.

5. **Battle log language:** Implement player-friendly battle log format from design brief, replacing engine terminology with natural language.

6. **Progressive implementation:** Ship all terminology changes in single phase to maintain consistency. Avoid partial updates.

7. **Accessibility preservation:** Ensure all terminology changes improve comprehension for new players while maintaining information density for experienced players.

## Mobile reflow / responsive / paginate / output limits

**No changes to responsive behavior.** Existing combat layout works across device sizes. Updated terminology uses similar character counts to maintain visual balance.

## Pages × tests matrix

| Component | Unit Tests | Integration Tests |
|---|---|---|
| `combat.tsx` | ✓ Renders with new terminology | ✓ Combat flow works end-to-end |
| `CombatPanel.tsx` | ✓ Displays player-friendly labels | ✓ Phase transitions use correct language |
| `PhaseBottom.tsx` | ✓ Action buttons show clear text | ✓ Button actions work correctly |
| `ActionIcon.tsx` | ✓ Icons render with improved clarity | N/A |
| `EffectChip.tsx` | ✓ Effects show player-friendly names | N/A |
| `StanceGlyph.tsx` | ✓ Stance icons are comprehensible | N/A |
| Combat presenter | ✓ Returns formatted terminology | ✓ View model mapping correct |

## Verify gate

```bash
npm run typecheck   # TypeScript compilation
npm test            # All unit tests pass
npm run test:e2e    # Combat screen renders and functions
npm run lint        # Code style compliance
```

## Commit body template

```
feat: combat terminology clarity — phase 98

- Replace engine jargon with player-friendly language across combat UI
- Update phase labels: "Choose a Stance", "Your Move", "Select Technique"
- Improve action buttons: "COMMIT" replaces "LET IT FALL"
- Clarify combat panel headers: "TECHNIQUES" vs "CRUCIBLE"
- Enhance battle log with natural language descriptions
- Maintain all existing combat mechanics and functionality

Decisions:
- Used exact terminology mappings from Phase 96 design brief
- Preserved presenter contract structure with updated return values
- Enhanced icon comprehension without wholesale visual redesign

Addresses AUDIT [4.5] Combat UX unintuitive
Closes playtest findings [F02]/[F04]/[F05]/[F06]
```

## DoD

- [ ] All combat UI uses player-friendly terminology per Phase 96 design
- [ ] Battle log shows natural language descriptions
- [ ] Action buttons and phase labels are comprehensible to new players  
- [ ] Icon clarity improved without breaking existing visual patterns
- [ ] All existing combat functionality preserved
- [ ] Unit tests updated for new terminology
- [ ] E2E tests verify combat flow works end-to-end
- [ ] TypeScript compilation clean
- [ ] No console errors in combat screen

## Follow-ups (out of scope)

- **Phase 99 candidate:** Information hierarchy improvements (visual grouping, spacing)
- **Phase 100 candidate:** Progressive disclosure of advanced combat mechanics
- **Future:** Combat tutorial overlay using new terminology
- **Future:** Accessibility audit of improved iconography