# Phase 88 — LevelUpModal derived-preview ribbon

> Promoted via `/oversight` 2026-05-24 (40th call). Needs engine 
> `previewAllocation` helper. Source signal from Phase 73 commit 
> body (`030e2a1`) — "Engine derived-stats preview NOT yet on the VM. 
> The brief's derived-preview ribbon ships as a follow-up."

**Source-of-truth lines:**
- `design/handoff-2026-05-23/project/screens/levelup.jsx:260-285` — the derived-preview ribbon grid (ATK/SKL/DEF columns × HEART/BODY/MIND rows).
- `plan/phases/phase_73_levelup_modal.md:84-89` — the original brief's derived-preview requirement.

---

## Routes / API endpoints / CLI surface

No new routes. Enhancement to existing `components/levelup/LevelUpModal.tsx`.

## Content / data reads

| Helper | Call | Use |
|--------|------|-----|
| `previewAllocation` | `previewAllocation(baseStats, allocations)` | Compute derived stats for preview |
| `selectLevelUpViewModel` | Enhancement | Add `derivedPreview` to VM |

## Components / handlers

**New:**
- `components/levelup/DerivedPreviewRibbon.tsx` — grid showing ATK/SKL/DEF deltas

**Enhanced:**
- `components/levelup/LevelUpModal.tsx` — integrate ribbon after stance rows
- `state/presenters/levelup.engine.ts` — add `derivedPreview` to view model

**Reused:**
- Existing `StanceRow` layout pattern
- `AXM` theme tokens

## Cross-links

**In (verify):** None. Contained enhancement to existing modal.

**Out (ship):** None. Modal enhancement only.

**Retro-fit:** None required.

## SEO / metadata / output schema

N/A. Modal component only.

## Hero / body / sub-section composition

**Derived-preview ribbon placement:**
- After stance allocation rows
- Before reset link
- Grid: 4 columns (label + ATK/SKL/DEF), 4 rows (header + HEART/BODY/MIND)
- Visual style: panel background, ash border, mono font for labels

## Empty / loading / error states

**When no allocations made:** Show current derived stats (no deltas).
**When allocations pending:** Show base → new values with delta indicators.
**Error state:** Fallback to current stats if preview calculation fails.

## Decisions made upfront — DO NOT ASK

1. **Engine helper placement:** Add `previewAllocation` to `axiomancer-mechanics` Character module, not mobile-side approximation. Ensures accuracy.

2. **Grid layout:** Match design exactly — 3 columns (ATK/SKL/DEF) × 3 stance rows. Headers with right-alignment.

3. **Delta display:** Show "base → new (+N)" format when allocations exist, plain "current" when no allocations.

4. **Performance:** Call `previewAllocation` on every allocation change. Engine calculation is lightweight (derived stats are simple formulas).

5. **Error handling:** If `previewAllocation` throws, fall back to displaying current derived stats without preview.

6. **Visual hierarchy:** Ribbon uses `AXM.bone` for labels, `AXM.parchment` for values, `AXM.sulfur` for deltas.

## Mobile reflow / responsive / paginate / output limits

Ribbon fits within existing modal scroll container. No responsive changes needed — mobile-first design.

## Pages × tests matrix

| Surface | Unit | E2E |
|---------|------|-----|
| `DerivedPreviewRibbon.tsx` | ✓ | — |
| `LevelUpModal.tsx` enhancement | ✓ (existing) | ✓ (existing) |
| `previewAllocation` helper | ✓ | — |
| `selectLevelUpViewModel` enhancement | ✓ (existing) | — |

## Verify gate

```bash
pnpm verify    # typecheck → test:run → data:validate → build → e2e
```

Standard verify gate. New tests must pass.

## Commit body template

```
feat: levelup modal derived-preview ribbon — phase 88

- Add DerivedPreviewRibbon component with ATK/SKL/DEF grid
- Add engine previewAllocation helper for stat calculations  
- Enhanced LevelUpModal to show derived stats preview
- Updated selectLevelUpViewModel with derivedPreview

Decisions:
- Engine-side preview calculation for accuracy over mobile approximation
- Match 2026-05-23 design grid exactly (3×3 + headers)
- Delta format: "base → new (+N)" when allocations pending

Closes #<phase-issue-number>
```

## DoD

- [ ] `previewAllocation(baseStats, allocations)` helper in `axiomancer-mechanics`
- [ ] `DerivedPreviewRibbon` component renders ATK/SKL/DEF grid
- [ ] `LevelUpModal` integrates ribbon after stance rows
- [ ] `selectLevelUpViewModel` includes `derivedPreview` data
- [ ] Unit tests for all new components and helpers
- [ ] Existing e2e tests pass (modal behavior unchanged)
- [ ] Visual design matches `design/handoff-2026-05-23/project/screens/levelup.jsx:260-285`

## Follow-ups (out of scope)

- Enhanced derived stats (emotional attack/defense, mental variants) if engine adds them
- Tooltip explanations for ATK/SKL/DEF calculations
- Animation transitions for preview updates