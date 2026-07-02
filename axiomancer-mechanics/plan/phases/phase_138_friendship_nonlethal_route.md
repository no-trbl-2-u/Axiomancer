# Phase 138 — Friendship/nonlethal route expressiveness on lethal anchors

## Outcome

Make the mercy route a reachable outcome on Easy (Level 6 Coastal Tyrant) and Normal (Level 15 audit-sentinel) three-anchor enemies without breaking lethal-anchor win bands (Easy 100%, Normal 75–100%, Difficult 25–50%).

## Source spec

This phase addresses friendship route expressiveness identified in PHASE_CANDIDATES Phase-121-closeout signal. Current system has friendship mechanics (Phase 68 BefriendabilityConfig) but may not be properly tuned for three-anchor enemies across difficulty levels.

## Implementation units

### Unit 1: Three-anchor playtest matrix setup
- File: `src/Game/e2e/three-anchor-friendship.engine.test.ts`
- Types: Test cases covering Easy Coastal Tyrant and Normal audit-sentinel
- Logic: Structured playtest scenarios with STRATEGIST witness targeting friendship outcomes
- Pattern: Mirror existing `befriend.engine.test.ts` structure but focus on three-anchor scenarios

### Unit 2: Befriendability config tuning
- File: `src/Enemy/enemy.library.ts` 
- Types: Update existing `CoastalTyrant` and audit-sentinel configs if needed
- Logic: Adjust `BefriendabilityConfig` parameters (hpGate, roundsThreshold, requiredStances) to enable friendship routes on target difficulties
- Pattern: Follow existing Phase 68 config schema

### Unit 3: Friendship rate target bands
- File: `src/Game/playtesting/policies.ts`
- Types: Extend playtest reporting with friendship-rate bands per difficulty
- Logic: Add friendship success rate tracking and target band validation (Easy/Normal should hit friendship route reliably)
- Pattern: Similar to existing win-rate band validation

## Decisions made upfront — DO NOT ASK

1. **Approach**: Pure balance/content tuning work. No changes to core combat resolution unless evidence forces otherwise.
2. **Target bands**: Easy should achieve ~80-90% friendship rate, Normal ~60-80% friendship rate when attempting mercy route.
3. **Witness strategy**: Use STRATEGIST with friendship-seeking behavior rather than creating new dedicated witness.
4. **Configuration scope**: Focus on Coastal Tyrant and audit-sentinel as the two three-anchor representatives.
5. **HP gate tuning**: If needed, adjust hpGate.belowPct to make friendship more achievable without breaking lethal win bands.

## Verify gate

- `npm run verify` (type-check + tests + build)
- `npm run playtest` for friendship rate validation
- Three-anchor matrix shows friendship rates in target bands for Easy/Normal

## Commit body template

```
feat(Combat): phase 138 — friendship route tuning for three-anchor enemies

- Add three-anchor friendship playtest matrix 
- Tune befriendability configs for reachable mercy routes
- Add friendship rate bands to playtest reporting
- Target Easy 80-90%, Normal 60-80% friendship success rates

Decisions:
- Used existing STRATEGIST witness with friendship-seeking policy
- Focused on Coastal Tyrant + audit-sentinel as anchor representatives  
- Preserved lethal win bands while enabling mercy expressiveness
```

## Definition of Done

- [ ] Three-anchor playtest matrix covers Easy Coastal Tyrant and Normal audit-sentinel
- [ ] Friendship rates in target bands: Easy 80-90%, Normal 60-80%
- [ ] Lethal anchor win bands preserved (Easy 100%, Normal 75–100%, Difficult 25–50%)
- [ ] STRATEGIST witness can seek friendship routes effectively
- [ ] Befriendability configs tuned for mercy route accessibility
- [ ] Playtest reporting includes friendship rate bands per difficulty
- [ ] `npm run verify` passes
- [ ] `npm run playtest` shows evidence of target friendship rates

## Follow-ups (out of scope)

- Difficult tier friendship tuning (25–50% band) - may need separate phase
- Friendship route policy depth improvements beyond STRATEGIST
- Additional three-anchor enemy types beyond the two anchor representatives