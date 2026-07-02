# Phase 106 — v0.13.0 deprecation removals

## Outcome
Remove four `@deprecated` symbols scheduled for "removal at the next minor bump" now that v0.13.0 has shipped: `getResistStat` and three `endCombat*` aliases, with zero external consumer impact.

## Source spec
No dedicated spec — this is a maintenance phase draining critique-46 LOW per oversight-28 2026-06-02 promotion. The deprecation lifecycle is defined in `RELEASING.md` § "Deprecation lifecycle". CHANGELOG entries at `CHANGELOG.md:431-438` provide replacement guidance.

## Implementation units

**Unit 1 — Caller verification**
- Search for external/mobile consumer dependencies on the four deprecated symbols
- Grep mobile repo if reachable; otherwise document the zero-caller assumption in CHANGELOG migration block
- Target symbols: `getResistStat`, `endCombatPlayerVictory`, `endCombatPlayerDefeat`, `endCombatWithFriendship`

**Unit 2 — Symbol removal**
- Remove `getResistStat` from `src/index.ts:54` and `src/Combat/stats.ts:64`
- Remove three `endCombat*` aliases from `src/index.ts:78` and `src/Combat/combat.reducer.ts:143/149/155`
- Drop exports from `src/Combat/index.ts` if applicable
- Refresh `scripts/public-surface.expected.json` (runtime export count decreases)
- Add `[unreleased] ### Removed` CHANGELOG entry naming each symbol + replacement
- Clear the `### Deprecated` schedule row from `CHANGELOG.md:425`

**Unit 3 — Verification**
- Run `npm run verify` + `deploy:check` until green
- Public-surface diff guard will catch intended drift — refresh fixture in same commit
- Mark critique-46 LOW as Done in CRITIQUE.md

## Decisions made upfront — DO NOT ASK

1. **No consumer verification beyond grep** — the build plan specifies "grep mobile if reachable; otherwise note the assumption". We'll document the zero-caller assumption in CHANGELOG.
2. **Single removal commit** — all four symbols removed together for atomic public API change.
3. **CHANGELOG migration block format** — follow existing `### Removed` examples with symbol name + replacement pattern.
4. **Test preservation** — any tests using deprecated symbols will be updated to use replacements rather than deleted.

## Verify gate
- `npm run verify` (type-check + test + build)
- `npm run deploy:check` (package publishability)

## Commit body template
```
feat: phase 106 — remove v0.13.0 deprecated symbols

- Remove getResistStat (replaced by getStat with 'resistance')
- Remove endCombatPlayerVictory/Defeat/Friendship aliases (use endCombat)
- Update public surface fixture (-4 runtime exports)
- Clear CHANGELOG deprecated schedule, add removal migration notes

Decisions:
- Documented zero external caller assumption per build plan guidance
- Single atomic commit for all four deprecated symbols

Closes #<phase-issue-number>
```

## Definition of Done
- [ ] Four deprecated symbols removed from all export locations
- [ ] Public surface fixture updated to reflect reduced export count
- [ ] CHANGELOG `### Removed` section added with migration guidance
- [ ] CHANGELOG `### Deprecated` schedule row cleared
- [ ] critique-46 LOW marked as Done
- [ ] `npm run verify` green
- [ ] `npm run deploy:check` green
- [ ] All tests continue to pass with replacement symbols

## Follow-ups (out of scope)
None — this is a pure removal phase with no functional additions.