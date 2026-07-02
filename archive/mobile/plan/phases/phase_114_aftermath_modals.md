# Phase 114 — Aftermath modals (design implementation)

> Design-driven implementation tick for aftermath modals: Victory,
> Friendship, Defeat, and Error. Transforms the delivered handoff
> at `design/handoff-2026-05-23/project/screens/aftermath-modal.jsx`
> into mobile React Native components following the established
> presenter-component contract.

## Outcome

Post-combat modal system replaces the existing `<AftermathBanner>`
toast pattern. Four non-dismissible modals cover all combat
resolution outcomes plus error fallback, shipped as reusable
components under `components/aftermath/`.

## Routes / API endpoints / CLI surface

**Routes:** None — these are modal components, not screens.

**Surface API:**
- `components/aftermath/VictoryModal.tsx` — `<VictoryModal>`
- `components/aftermath/FriendshipModal.tsx` — `<FriendshipModal>`
- `components/aftermath/DefeatModal.tsx` — `<DefeatModal>`
- `components/aftermath/ErrorFallbackModal.tsx` — `<ErrorFallbackModal>`

All components export as default and follow the established modal pattern.

## Content / data reads

| Helper | Call | Use |
|--------|------|-----|
| `selectCombatVictoryViewModel` | `(state)` | Victory modal props |
| `selectCombatFriendshipViewModel` | `(state)` | Friendship modal props |
| `selectCombatDefeatViewModel` | `(state)` | Defeat modal props |
| `selectErrorFallbackViewModel` | `(state)` | Error modal props |

All selectors to be added to `lib/presenters/combat.engine.ts`.

## Components / handlers

**New primitives:**
- `components/aftermath/VictoryModal.tsx` — Victory outcome modal
- `components/aftermath/FriendshipModal.tsx` — Friendship outcome modal  
- `components/aftermath/DefeatModal.tsx` — Defeat outcome modal
- `components/aftermath/ErrorFallbackModal.tsx` — Error fallback modal
- `components/aftermath/AftermathBackdrop.tsx` — Shared backdrop wrapper
- `components/aftermath/PixelHeartEmblem.tsx` — 16x16 pixel art heart for friendship modal

**Reused primitives:**
- `<TornPanel>` — for clipped content panels
- `<Splatter>` — blood spatter decorations
- `<SectionLabel>` — eyebrow text styling
- `<TouchableOpacity>` — button base
- `<Modal>` from React Native — backdrop behavior

## Cross-links

**In (verify):** All aftermath modals should render properly with test data.
**Out (ship):** Integration with combat flow requires separate integration phase.
**Retro-fit:** Update any existing references to `<AftermathBanner>` to point toward the new modal system (placeholder comments only).

## SEO / metadata / output schema

Not applicable — mobile modal components.

## Hero / body / sub-section composition

Each modal follows the design specification from `design/aftermath-modals-prompt.txt`:

**VictoryModal structure:**
1. Eyebrow: "THE FOE FALLS" 
2. Enemy name + epithet
3. Final blow panel (torn edge, splatter, flavor text)
4. Reward strip (XP, vitae/sigils, loot count)
5. Loot list (or empty state message)
6. Continue button

**FriendshipModal structure:**
1. Eyebrow: "THE HEART OPENS"
2. Former-foe name + epithet  
3. 16x16 pixel art heart emblem
4. Pact phrase (italic chronicle voice)
5. Reward strip (rust-tinted currency)
6. Optional journal entry callout
7. Continue button

**DefeatModal structure:**
1. Spent candle wick + eyebrow
2. Character name
3. Killer details
4. Chronicle death paragraph with dropcap
5. Run summary ledger
6. Blood seep gradient
7. Two buttons (retry / abandon)

**ErrorFallbackModal structure:**
1. Hatch overlay + gothic title
2. Error code as chapter marker
3. Technical details panel with copy button
4. Optional hint message
5. Two action buttons
6. Comfort message at bottom

## Empty / loading / error states

**Empty loot:** Replace loot list with italic message "no spoils. only quiet."
**No journal entry:** Hide journal callout section entirely.
**Missing technical details:** Show generic "the binding weakened" message.

All modals are rendered immediately with passed props — no loading states required.

## Decisions made upfront — DO NOT ASK

1. **Design fidelity:** Exact 1:1 implementation of the handoff design specs. No creative interpretation.

2. **Pixel art implementation:** The friendship modal's 16x16 heart emblem will be implemented as an SVG with `<rect>` elements, exactly as specified in the design prompt.

3. **Color palette:** Use only the AXM design tokens from `theme/axm.ts`. No additional colors.

4. **Typography:** Follow the established type classes (axm-display, h1, h2, body, bodyit, caption, eyebrow, mono, mono-lg).

5. **Modal behavior:** All modals are non-dismissible by tap-outside. Each owns its explicit dismiss control.

6. **Component structure:** Each modal as a separate file under `components/aftermath/` for maintainability.

7. **Shared backdrop:** Extract common backdrop pattern to `AftermathBackdrop.tsx` for reuse across all four modals.

8. **Button styling:** Primary buttons use parchment-on-black with 2px parchment border. Ghost buttons use no border, bone color.

9. **Splatter usage:** Sparse on victory, absent on defeat/friendship/error per design specs.

10. **Voice register:** Chronicle voice for flavor text — terse, past-tense, weighted. No second-person archaic pronouns.

## Mobile reflow / responsive / paginate / output limits

**Phone frame:** All modals sized for 390×844 phone interior as specified in design.
**No pagination:** Each modal displays complete content in single view.
**Responsive behavior:** Fixed layout optimized for mobile portrait — no landscape considerations.
**Text overflow:** Long item names truncated with ellipsis. Chronicle text hard-wrapped.

## Pages × tests matrix

| Component | Unit Test | Integration Test |
|-----------|-----------|------------------|
| `VictoryModal.tsx` | ✓ Render with victory props | ✓ Button callbacks |
| `FriendshipModal.tsx` | ✓ Render with friendship props | ✓ Pixel heart display |
| `DefeatModal.tsx` | ✓ Render with defeat props | ✓ Dual button actions |
| `ErrorFallbackModal.tsx` | ✓ Render with error props | ✓ Copy button interaction |
| `AftermathBackdrop.tsx` | ✓ Basic backdrop render | ✓ Tap-outside prevention |
| `PixelHeartEmblem.tsx` | ✓ SVG pixel grid render | ✓ Color accuracy |

All tests follow the hermetic standard in `docs/testing.md`.

## Verify gate

```bash
npm run typecheck    # TypeScript compilation
npm run test        # Jest unit test suite
npm run verify      # Full verification pipeline
```

All tests must pass. Visual verification against design specs.

## Commit body template

```
feat: aftermath modals (design implementation) — phase 114

- VictoryModal component with final blow panel and reward display
- FriendshipModal with pixel art heart emblem and warm styling
- DefeatModal with run summary and dual action buttons  
- ErrorFallbackModal with technical panel and copy action
- Shared AftermathBackdrop preventing tap-outside dismissal
- PixelHeartEmblem 16x16 SVG implementation per design spec

Decisions:
- Exact 1:1 design fidelity from handoff-2026-05-23 bundle
- Pixel art heart implemented as SVG rect grid per specification
- Chronicle voice register maintained across all flavor text
- Individual component files for maintainability
```

## DoD

- [ ] Four modal components implemented under `components/aftermath/`
- [ ] All design specifications from prompt matched exactly
- [ ] Pixel art heart emblem renders as specified 16x16 grid
- [ ] Color palette limited to AXM design tokens only
- [ ] Typography follows established type classes
- [ ] Non-dismissible behavior implemented on all modals
- [ ] Unit tests cover all component render scenarios
- [ ] Integration tests verify button interactions
- [ ] TypeScript compilation clean
- [ ] All verify gate checks pass

## Follow-ups (out of scope)

- Integration with combat flow state management (separate phase)
- Combat presenter selectors for modal data (separate phase)  
- Removal of existing `<AftermathBanner>` implementation (separate phase)
- Visual regression tests for design accuracy (separate phase)