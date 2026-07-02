# Phase 103 — Combat re-trigger lock fix

> **High priority bug fix.** After WIN or FRIENDSHIP outcomes, players cannot trigger new combat encounters. Only DEFEAT/restart properly clears the encounter lock.

## Outcome

Combat-end state properly cleared for all three terminal outcomes (victory, friendship, defeat), allowing players to trigger new encounters regardless of the previous combat result.

## Source spec

No specific spec — this is a bug fix addressing playtest finding #89(a) from oversight-27. The combat encounter system should allow re-engagement after any terminal outcome.

## Implementation units

### Unit 1 — Root cause analysis and fix

**Files:** `src/Game/store.ts`, `src/Game/game.reducer.ts`, `src/World/` combat trigger logic

**Root cause:** The encounter-lock flag is likely cleared only in the defeat/restart code path but not in victory/friendship paths in `endCombat()` handling.

**Fix approach:** Ensure all three terminal combat outcomes (`victory`, `friendship`, `defeat`) properly reset the encounter lock state. This may involve:
- Examining `endCombat()` in the game store
- Checking `END_COMBAT` action handling in game.reducer.ts  
- Verifying MapEvents combat-trigger gates in src/World/ clear the lock consistently
- Watch for interaction with Phase 23/31 node-consumption and Phase 51 autosave patterns

### Unit 2 — Hermetic e2e test

**Files:** `src/Game/e2e/combat-retrigger.engine.test.ts` (new)

**Coverage:** Drive full encounter-to-outcome cycles for each terminal state, then assert subsequent `startCombat` (or combat node navigation) succeeds:
- Victory → new combat trigger works
- Friendship → new combat trigger works  
- Defeat → new combat trigger works (regression guard)
- Pin the asymmetry so it cannot return

### Unit 3 — Documentation update

**Files:** `docs/combat.md`, `docs/gameloop.md` (if combat-end state documented), `CHANGELOG.md`

**Updates:**
- Clarify combat-end-state behavior in relevant docs if lock semantics are documented
- Add `CHANGELOG.md [unreleased] ### Fixed` entry for the re-trigger bug

## Decisions made upfront — DO NOT ASK

- Fix approach: Ensure encounter lock is cleared in ALL terminal outcome paths, not just defeat
- Test scope: Cover all three outcomes with hermetic e2e, focus on the lock state transition
- Documentation: Update only if lock semantics are already documented; don't add new prose

## Verify gate

Standard: `npm run verify` (type-check + lint + test + build)

## Commit body template

```
fix(combat): combat re-trigger lock cleared for all outcomes

- Fix encounter lock not clearing after victory/friendship outcomes
- Add hermetic e2e covering all terminal outcome → retrigger paths  
- Update docs and CHANGELOG

Decisions:
- Fixed in endCombat/END_COMBAT handling to ensure lock cleared for victory/friendship same as defeat
- Added regression guard in hermetic e2e to pin the asymmetry

Closes #<phase-issue-number>
```

## Definition of Done

- [ ] Victory outcome properly clears encounter lock
- [ ] Friendship outcome properly clears encounter lock  
- [ ] Defeat outcome continues to clear encounter lock (regression guard)
- [ ] Hermetic e2e test covers all three outcome → retrigger scenarios
- [ ] Documentation updated if lock semantics are documented
- [ ] CHANGELOG.md entry added
- [ ] Verify gate passes
- [ ] Deploy gate passes