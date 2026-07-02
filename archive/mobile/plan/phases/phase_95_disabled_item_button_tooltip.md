# Phase 95 — Disabled ITEM button tooltip in combat

> Promoted via `/oversight` 2026-05-27 (42nd call) from PHASE_CANDIDATES 
> `[score 4.0]`. Scope: tapping the disabled ITEM action button shows a tooltip 
> explaining unavailability. Non-visual combat feedback enhancement.

**Source-of-truth lines:**
- `plan/PHASE_CANDIDATES.md` — `[score 4.0] Disabled ITEM button tooltip in combat`
- Build plan Phase 95 scope: tapping disabled ITEM button shows tooltip explaining unavailability

---

## Routes / API endpoints / CLI surface

No new routes. Combat screen interaction enhancement only.

## Content / data reads

| Source | Use |
|---|---|
| Combat engine state | Check if ITEM action is available/enabled |
| Action button state | Determine disabled state for tooltip trigger |

## Components / handlers

**Enhanced:**
- Combat action phase buttons — add tap handler for disabled ITEM button
- PhaseBottom ActionPhase component — wrap disabled ITEM button with TooltipTarget

**Reused:**
- Existing TooltipTarget component from Phase 74
- Existing TapTooltip system
- Existing combat presenter action options structure

**New:**
- Disabled action button tap detection logic
- Tooltip integration for disabled ITEM action

## Cross-links

**In (verify):** Existing combat action tests should pass with new tooltip behavior.

**Out (ship):** No downstream phases required.

**Retro-fit:** None required - this is an additive interaction enhancement.

## SEO / metadata / output schema

N/A - combat screen enhancement only.

## Hero / body / sub-section composition

N/A - interaction enhancement only.

## Empty / loading / error states

**Disabled state feedback:** Tooltip explaining why ITEM action is unavailable when tapped while disabled.

## Decisions made upfront — DO NOT ASK

- Tooltip message: "No usable items in inventory." (matches current game state where items aren't implemented yet)
- Tooltip positioning: Standard bottom position via TooltipTarget
- Tooltip accent: 'rust' to match ITEM action's accent color
- Only trigger tooltip on tap of disabled ITEM button, not other disabled actions
- Reuse existing TooltipTarget pattern from Phase 74/75 rather than custom implementation
- Tooltip title: "ITEM UNAVAILABLE" (uppercase gothic to match design system)

## Mobile reflow / responsive / paginate / output limits

N/A - tooltip overlay adapts to existing responsive design.

## Pages × tests matrix

| Screen | Test coverage |
|---|---|
| Combat | Add test for disabled ITEM button tooltip behavior |

## Verify gate

Standard verify gate: `pnpm verify` (typecheck → test:run → build → e2e)

## Commit body template

```
feat: disabled ITEM button tooltip — phase 95

- Add tooltip feedback for disabled ITEM action button in combat
- Integrate with existing TooltipTarget system from Phase 74
- Show "No usable items in inventory." when tapping disabled ITEM
- Use rust accent to match ITEM button color theme

Decisions:
- Reused TooltipTarget system for consistency with existing tooltips
- Rust accent matches ITEM action's accentKind for visual cohesion  
- Only ITEM button gets disabled tooltip (other actions don't need it yet)

Closes #<phase-issue-number>
```

## DoD

- [ ] TooltipTarget wrapped around disabled ITEM action button
- [ ] Tooltip shows when tapping disabled ITEM button 
- [ ] Tooltip displays "ITEM UNAVAILABLE" title and explanation body
- [ ] Rust accent applied to match ITEM button color
- [ ] Existing action button behavior preserved for enabled actions
- [ ] Tests cover new disabled action tooltip interaction
- [ ] Verify gate passes

## Follow-ups (out of scope)

- Tooltips for other disabled action buttons if they become relevant
- Actual ITEM functionality implementation (separate phase)
- Dynamic tooltip content based on specific unavailability reason