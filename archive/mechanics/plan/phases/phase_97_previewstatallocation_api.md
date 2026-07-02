# Phase 97 — GH#78 previewStatAllocation API

## Outcome

Export `previewStatAllocation(baseStats, allocation)` that returns exact derived stats for hypothetical stat point allocations, enabling mobile's level-up modal to show accurate cross-stat effects.

## Source spec

GitHub issue #78. No dedicated spec file — requirements drawn from mobile's actual usage pattern and the existing `allocateStatPoint` implementation in `src/Character/index.ts:106`.

## Implementation units

**Unit 1 — `previewStatAllocation` function.**  
File: `src/Character/index.ts`  
Types: `PreviewAllocation = { heart: number; body: number; mind: number }` in `src/Character/types.ts`  
Logic: Clone `baseStats`, apply `allocation` deltas additively, compute derived stats via existing `deriveStats` + `deriveNonCombatStats` + `calculateMaxHealth` without mutating the original character. Return `{ derivedStats, nonCombatStats, maxHealth }`.  
Pattern: Pure function signature `previewStatAllocation(baseStats: BaseStats, allocation: PreviewAllocation): PreviewResult` where `PreviewResult = { derivedStats: DerivedStats; nonCombatStats: NonCombatStats; maxHealth: number }`.

**Unit 2 — Public exports.**  
File: `src/index.ts`  
Logic: Add `previewStatAllocation` and `PreviewAllocation`, `PreviewResult` types to the Character exports block.  
Pattern: Maintain alphabetical ordering within the Character section.

**Unit 3 — E2E tests.**  
File: `src/Character/e2e/preview-stat-allocation.engine.test.ts`  
Logic: Test golden path (basic allocation preview), cross-stat effects (heart allocation affecting other derived stats), zero allocation (no-op), edge case (negative allocation — should be additive).  
Pattern: Hermetic test using `apprenticePreset` as baseline character, verify output matches manual `allocateStatPoint` chain but without character mutation.

## Decisions made upfront — DO NOT ASK

1. **Function location:** In `src/Character/index.ts` adjacent to `allocateStatPoint` for easy maintenance. Both functions share the same stat derivation logic.

2. **Input shape:** `PreviewAllocation` has all three stats (heart/body/mind) as numbers, allowing multi-stat previews in a single call. Mobile can pass `{ heart: 1, body: 0, mind: 0 }` for single-stat preview.

3. **Return shape:** `{ derivedStats, nonCombatStats, maxHealth }` covers all stat surfaces that mobile might need. No `health` or `availableStatPoints` in the preview — those are character-instance concerns.

4. **Equipment handling:** Function takes pure `BaseStats` input, no equipment modifiers. Mobile must pass character's current `baseStats` (which already includes equipment via character creation flow). This matches the GH#78 use case.

5. **Negative allocation handling:** Additive — negative values subtract from base stats. No bounds checking in the preview function. Mobile responsible for UI validation.

## Verify gate

`npm run verify` (type-check + test + build). No new external dependencies.

## Commit body template

```
feat(character): phase 97 — previewStatAllocation API

- Add previewStatAllocation function in src/Character/index.ts
- Export PreviewAllocation and PreviewResult types  
- E2E tests cover golden path and cross-stat effects

Enables mobile's level-up modal to show accurate derived stats preview
without duplicating engine's stat derivation formula.

Closes #78
```

## Definition of Done

- [ ] `previewStatAllocation(baseStats, { heart: 1, body: 0, mind: 0 })` returns exact derived stats for hypothetical +1 heart allocation
- [ ] Function exported from package barrel (`axiomancer-mechanics`)
- [ ] TypeScript types for input (`PreviewAllocation`) and output (`PreviewResult`)
- [ ] E2E test verifies output matches manual `allocateStatPoint` chain
- [ ] Function handles multi-stat allocation in single call
- [ ] No character mutation — pure function returning calculated stats only

## Follow-ups (out of scope)

- Multi-level allocation preview (requires XP/level-up logic extension)
- Equipment-aware allocation preview (would need character context, not just base stats)
- Allocation validation/bounds checking (mobile UI responsibility)