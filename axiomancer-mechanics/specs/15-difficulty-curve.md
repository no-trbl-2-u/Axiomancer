# Spec 15 — Difficulty-curve doctrine

## Goal

Define target difficulty bands per progression tier (early fishing-village / mid northern-forest / endgame boss): expected rounds-to-resolve, player survivability %, damage-dealt-vs-taken ratio, and friendship-route reachability. Reference Phase 104 probe fields as the measurement surface.

**Success state:** A clear difficulty doctrine with concrete numerical thresholds per tier that can guide future balancing decisions and Phase 104 probe result interpretation.

## Why now / dependencies

- **Unblocks:** Future difficulty curve monitoring and enforcement phases. Provides target metrics for balancing iterations. Establishes measurement framework for playtest evaluation.
- **Depends on:** Phase 104 probe fields (shipped) as the measurement surface. Phase 107 roster-wide difficulty tuning (shipped) establishing current baseline at ~65-75% resolution success.

## Current state

Phase 107 completed roster-wide difficulty tuning achieving approximately 65-75% resolution success rate across the current enemy roster. Phase 104 established probe fields for measuring:
- Rounds-to-resolve per encounter
- Player survivability rates  
- Damage-dealt vs damage-taken ratios
- Friendship-route reachability statistics
- Resource consumption patterns
- Skill usage distributions

The codebase has the measurement infrastructure but lacks explicit target difficulty bands per progression tier.

## Open questions

1. **Early tier (fishing-village) target bands.**
   > Your answer: Expected rounds-to-resolve: 3-5 rounds. Player survivability: 85-95%. Damage-dealt-vs-taken ratio: 1.5:1 to 2:1 (player advantage). Friendship-route reachability: 70-85% of encounters should offer viable friendship paths.

2. **Mid tier (northern-forest) target bands.**
   > Your answer: Expected rounds-to-resolve: 5-8 rounds. Player survivability: 70-85%. Damage-dealt-vs-taken ratio: 1.2:1 to 1.8:1 (moderate player advantage). Friendship-route reachability: 55-70% of encounters should offer viable friendship paths.

3. **Endgame tier (boss encounters) target bands.**
   > Your answer: Expected rounds-to-resolve: 8-15 rounds. Player survivability: 55-75%. Damage-dealt-vs-taken ratio: 0.8:1 to 1.4:1 (balanced to slight player advantage). Friendship-route reachability: 40-60% of encounters should offer viable friendship paths.

4. **Measurement cadence and tolerance bands.**
   > Your answer: Target bands represent 80th percentile thresholds (80% of encounters should fall within these ranges). Outliers beyond the bands signal tuning needs. Measurements should be taken after significant roster changes, equipment updates, or skill adjustments.

## Proposed approach

This is a pure documentation spec with no code implementation. The spec itself IS the deliverable.

### Commit 1: Author difficulty-curve spec
- Create `specs/15-difficulty-curve.md` with complete target bands
- Update `specs/README.md` recommended order table with row 15

## Acceptance checklist

- [x] Target bands defined for fishing-village tier (early encounters)
- [x] Target bands defined for northern-forest tier (mid-game encounters) 
- [x] Target bands defined for boss tier (endgame encounters)
- [x] Phase 104 probe fields referenced as measurement surface
- [x] Measurement cadence and tolerance guidelines specified
- [x] `specs/README.md` updated with row 15 in recommended order
- [x] All content committed and pushed
- [x] Phase 121 — Three-anchor playtest balance scaffold for Sage preset

## Out of scope

- Implementation of automated difficulty monitoring (future phase)
- Active balancing adjustments based on these targets (iterative work)
- Integration of targets into Phase 104 probe automation (future enhancement)
- Extension to additional progression tiers beyond the three defined