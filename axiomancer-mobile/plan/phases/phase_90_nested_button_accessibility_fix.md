# Phase 90 — Nested button accessibility fix in stance picker

> Promoted via `/oversight` 2026-05-25 (41st call) from PHASE_CANDIDATES 
> `[score 3.0]` / AUDIT `[8.0]`. Console errors on web; breaks hydration 
> semantics; screen readers double-announce. Refactor ADV/DIS badge from 
> `Pressable` to `View` + accessibility props to eliminate nested 
> `<button>` DOM violation.

**Source-of-truth lines:**
- `plan/AUDIT.md` — [8.0] nested button DOM hierarchy violation finding
- `plan/PHASE_CANDIDATES.md` — full rationale and proposed scope  
- `components/combat/PhaseBottom.tsx` — StanceCard component with nested button issue
- Live-drive playtest 2026-05-24 against http://localhost:8082 — source observation

---

## Routes / API endpoints / CLI surface

No new routes. Internal bug fix for existing combat functionality.

## Content / data reads

| Helper | Call | Use |
|--------|------|-----|
| `StanceCard` component | Render stance options | Contains nested button violation |
| `useTooltip` hook | Show stance-chip tooltips | Tooltip functionality to preserve |
| Combat view-model | `vm.stancePicker.options` | Stance advantage/disadvantage state |

## Components / handlers

**Enhanced:**
- `components/combat/PhaseBottom.tsx` — refactor ADV/DIS badge from nested `Pressable` to `View` with accessibility props
- `StanceCard` component — eliminate nested button while preserving tooltip behavior

**Reused:**
- `useTooltip` hook — preserve existing tooltip functionality  
- `TouchableOpacity` stance card wrapper — main interaction target
- ADV/DIS badge styling and positioning

**New:**
- None. Pure refactoring of existing component.

## Cross-links

**In (verify):** None. Internal accessibility fix.

**Out (ship):** None. Self-contained component refactor.

**Retro-fit:** None required.

## SEO / metadata / output schema

N/A. Internal accessibility fix with no external interface changes.

## Hero / body / sub-section composition

No visual changes to stance picker layout or appearance. ADV/DIS badge remains visually identical.

## Empty / loading / error states

No changes to state handling. Accessibility fix only.

## Decisions made upfront — DO NOT ASK

1. **Fix approach:** Convert ADV/DIS badge from `Pressable` to `View` with accessibility props rather than extracting badge outside stance card. Maintains current visual design.

2. **Tooltip behavior:** Preserve existing long-press tooltip functionality by moving `onLongPress` handler to the parent `TouchableOpacity` stance card wrapper, conditioned on advantage/disadvantage presence.

3. **Accessibility labels:** Enhance the parent `TouchableOpacity` accessibility label to include advantage/disadvantage information, making the badge information available to screen readers without separate button announcement.

4. **Touch target preservation:** Long-press anywhere on stance card (not just badge area) will trigger tooltip when ADV/DIS is present. Simpler interaction model than nested touch targets.

5. **Test scope:** Focus on accessibility and tooltip behavior. No visual regression testing needed since appearance is unchanged.

## Mobile reflow / responsive / paginate / output limits

No layout changes. Accessibility refactor only.

## Pages × tests matrix

| Surface | Unit | E2E |
|---------|------|-----|
| `StanceCard` accessibility | ✓ (enhanced existing) | — |
| ADV/DIS tooltip behavior | ✓ (existing, verify preserved) | ✓ (existing, verify preserved) |
| Nested button elimination | ✓ (new assertion) | ✓ (web playtest verification) |

## Verify gate

```bash
npm run verify    # lint + typecheck + test
```

Standard verify gate. All existing tests must remain green. Web playtest should show no console errors for nested buttons.

## Commit body template

```
fix: eliminate nested button in stance picker ADV/DIS badges — phase 90

- Refactor ADV/DIS badge from Pressable to View + accessibility props  
- Move tooltip trigger to parent TouchableOpacity stance card wrapper
- Enhance stance card accessibility label with advantage/disadvantage info
- Eliminate nested <button> DOM violation causing console errors on web

Decisions:
- Badge remains visually positioned as before, no layout changes
- Long-press tooltip now fires anywhere on stance card when ADV/DIS present
- Parent accessibility label includes advantage/disadvantage state
- No extraction of badge outside card — maintains current design

Closes #<phase-issue-number>
```

## DoD

- [ ] ADV/DIS badge converted from `Pressable` to `View` in `StanceCard`
- [ ] Long-press tooltip handler moved to parent `TouchableOpacity`  
- [ ] Parent accessibility label enhanced with advantage/disadvantage information
- [ ] No nested `<button>` DOM elements in stance picker
- [ ] Tooltip behavior preserved — long-press shows stance-chip tooltip
- [ ] Web playtest shows no console errors for button hierarchy violation
- [ ] All existing combat tests pass
- [ ] Accessibility labels properly announce advantage/disadvantage state

## Follow-ups (out of scope)

- Audit other potential nested button violations across the codebase
- Consider extracting common accessibility patterns for interactive elements with badges
- Evaluate whether `TooltipTarget` component could be enhanced to handle this pattern