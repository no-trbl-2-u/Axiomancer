# Phase 94 — Sealed node tap feedback

> Promoted via `/oversight` 2026-05-27 (42nd call) from PHASE_CANDIDATES
> `[score 4.0]`. Scope: tapping a sealed map node shows a brief toast 
> ("This path is sealed."). Playtest source: F11.

**Source-of-truth lines:**
- `plan/PHASE_CANDIDATES.md` — `[score 4.0] Sealed node tap feedback`
- deep-playtest 2026-05-27 — `[F11]` no feedback when tapping sealed nodes
- Build plan Phase 94 scope: brief toast on sealed node tap

---

## Routes / API endpoints / CLI surface

No new routes. Map interaction enhancement only.

## Content / data reads

| Source | Use |
|---|---|
| Node state from map data | Determine if tapped node is sealed |
| Engine map state | Check node accessibility status |

## Components / handlers

**Enhanced:**
- Exploration screen map interaction logic — add tap handler for sealed nodes

**Reused:**
- Existing toast/notification system
- Existing map rendering components
- Existing node state detection logic

**New:**
- Sealed node tap detection handler
- Toast feedback component integration for sealed nodes

## Cross-links

**In (verify):** Existing exploration screen tests should pass with new feedback.

**Out (ship):** No downstream phases required.

**Retro-fit:** None required - this is an additive interaction enhancement.

## SEO / metadata / output schema

N/A - no new routes or content.

## Hero / body / sub-section composition

N/A - interaction enhancement only.

## Empty / loading / error states

**Sealed state feedback:** "This path is sealed." toast message when tapping sealed nodes.

## Decisions made upfront — DO NOT ASK

- Toast message wording: "This path is sealed." (simple and direct)
- Toast duration: Standard brief duration (2-3 seconds)
- Toast positioning: Standard bottom position
- Reuse existing toast system rather than custom modal
- Only show feedback for truly sealed nodes, not disabled/unavailable for other reasons

## Mobile reflow / responsive / paginate / output limits

N/A - toast overlay adapts to existing responsive design.

## Pages × tests matrix

| Screen | Test coverage |
|---|---|
| Exploration | Add test for sealed node tap feedback |

## Verify gate

Standard verify gate: `pnpm verify` (typecheck → test:run → build → e2e)

## Commit body template

```
feat: sealed node tap feedback — phase 94

- Add toast feedback when tapping sealed map nodes
- Integrate with existing toast notification system  
- Show "This path is sealed." message for 2-3 seconds
- Enhance exploration map interaction UX

Decisions:
- Used existing toast system over custom modal for consistency
- Simple "This path is sealed." wording for clarity

Closes #<phase-issue-number>
```

## DoD

- [ ] Sealed node tap detection implemented
- [ ] Toast feedback shows on sealed node tap
- [ ] Message displays "This path is sealed."
- [ ] Integration with existing toast system
- [ ] Tests pass for new interaction
- [ ] Verify gate passes

## Follow-ups (out of scope)

- Other node state feedback (locked, requires key, etc.)
- Visual indication of sealed status before tap
- Audio feedback for sealed node interaction