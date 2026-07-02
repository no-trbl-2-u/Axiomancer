# Phase 116 — Difficulty-curve doctrine spec

## Outcome

`specs/15-difficulty-curve.md` authored defining target bands per progression tier (early fishing-village / mid northern-forest / endgame boss): expected rounds-to-resolve, player survivability %, damage-dealt-vs-taken ratio, and friendship-route reachability. `specs/README.md` recommended-order row added.

## Source spec

Build plan Phase 116 row. References Phase 104 probe fields as the measurement surface. Pure docs/spec work; no code implementation.

## Implementation units

### Unit 1: Author difficulty-curve spec

**File:** `specs/15-difficulty-curve.md`

**Content:**
- Goal: Define target difficulty bands per progression tier
- Current state: Phase 107 roster-wide tuning reached ~65-75% resolution success
- Three progression tiers:
  - Early (fishing-village): Beginner-friendly encounters
  - Mid (northern-forest): Moderate challenge ramp
  - Endgame (boss): High-stakes encounters
- Target metrics per tier:
  - Expected rounds-to-resolve
  - Player survivability %
  - Damage-dealt-vs-taken ratio
  - Friendship-route reachability
- Reference Phase 104 probe fields as measurement surface
- Pre-fill `> Your answer:` lines with concrete thresholds
- Acceptance checklist for implementation tracking

**Pattern:** Follow Spec 14 format: Goal, Why now, Current state, Open questions with pre-filled answers, Proposed approach, Acceptance checklist, Out of scope.

### Unit 2: Update specs README

**File:** `specs/README.md`

**Content:**
- Add row 15 in recommended order table
- Point to `specs/15-difficulty-curve.md`
- Position after row 14 (philosophical alignment)
- Mark as **NEXT** status

## Decisions made upfront — DO NOT ASK

1. **Progression tiers:** Use fishing-village / northern-forest / endgame boss as the three canonical tiers per the build plan description.

2. **Measurement surface:** Reference Phase 104 probe fields exactly as specified in the build plan.

3. **Pre-filled answers:** Since the build plan notes "**User-attended at brief dispatch to lock the numbers**", the brief will include realistic default thresholds that can be refined later.

4. **Spec format:** Follow established spec conventions from Spec 14 and others in the `/specs` directory.

5. **Pure docs:** This is explicitly "Pure docs/spec; no code" per the build plan.

## Verify gate

- `npm run type-check` (should pass — no code changes)
- `npm test` (should pass — no code changes)  
- `npm run build` (should pass — no code changes)

## Commit body template

```
feat(specs): Phase 116 — Difficulty-curve doctrine spec

- Author specs/15-difficulty-curve.md with target bands per progression tier
- Define early/mid/endgame thresholds for rounds-to-resolve, survivability, damage ratios, friendship reachability
- Reference Phase 104 probe fields as measurement surface
- Update specs/README.md recommended order with row 15

Decisions:
- Three canonical progression tiers: fishing-village / northern-forest / endgame boss
- Pre-filled answer defaults for user refinement at oversight
- Pure docs/spec work as specified in build plan
```

## Definition of Done

- [ ] `specs/15-difficulty-curve.md` authored with complete spec format
- [ ] Target bands defined for all three progression tiers
- [ ] Phase 104 probe fields referenced as measurement surface  
- [ ] `> Your answer:` lines pre-filled with threshold defaults
- [ ] Acceptance checklist included in spec
- [ ] `specs/README.md` updated with row 15 in recommended order
- [ ] All files committed and pushed

## Follow-ups (out of scope)

- Actual implementation of difficulty curve monitoring/enforcement (future phase)
- Balancing adjustments based on spec thresholds (iterative)
- Integration with Phase 104 probe automation (if needed)