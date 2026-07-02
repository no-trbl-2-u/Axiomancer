# Phase 98 — Items + skill-resource integration AUDIT

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

A read-only audit that verifies the item-modifier + set-bonus + skill-resource systems are actually working end-to-end in play (not merely present as code). Produces a per-system pass/drift table in `plan/AUDIT.md`. Drops CRITIQUE rows for any drift; no behavior change unless a real bug surfaces (then per-bug commit).

## Source spec

Rescoped at oversight-26 2026-05-30. Original promotion (oversight-25, "Item rarity system / Spec 05c", score 8.0) was filed against already-shipped work — Spec 05c is fully implemented. Per oversight-26 Q1 the user rescoped this phase to a **read-only audit** that verifies the systems are working end-to-end.

Reference specs:
- `specs/05c-item-rarity.md` (item modifiers + rarity system)
- `specs/05d-modifier-catalogue.md` (modifier rolling and resolution)
- `specs/05e-set-items.md` (set bonuses)
- `specs/04-skills-engine.md` + `specs/04b-skills-library-and-e2e.md` (skill-resource integration)

Resolved questions:
1. **Audit scope**: Three units — item modifiers, set bonuses, skills vs resource generation. No implementation changes unless real bugs found.
2. **Evidence gathering**: Use existing test harnesses, CLI tools, and hermetic tests to verify contracts still hold.
3. **Reporting format**: Pass/drift table in `plan/AUDIT.md` with per-system verdicts.

## Implementation units (commit per unit)

### Unit 1 — Item modifiers audit

Verify: `dropItem(id, level, rarity)` rolls the correct mod count per rarity, values fall in the level-banded ranges, `resolveModifiers` merges rolled mods into Equipment combat stats, and rolled mods actually apply in combat (damage/defense/resist chains compose post-Phase-80 pure-split).

Evidence gathering:
- Run hermetic tests in `src/Items/e2e/` to confirm dropItem behavior
- Check `src/Items/modifier.catalogue.ts` + `rollModifiers`/`resolveModifiers` implementations
- Verify combat integration via `src/Combat/e2e/` tests showing modifier effects
- Use CLI tools to generate sample items across rarities and validate stat ranges

### Unit 2 — Set bonuses audit

Verify: `getActiveSetBonuses` fires at the right thresholds, `initializeCombat` stacks set start-tokens, `applySetGenerationBonus` chains on basic actions, and set passive effects land/clean-up combat-scoped.

Evidence gathering:
- Run hermetic tests in `src/Items/e2e/set.engine.test.ts` (if exists)
- Check `src/Items/set.engine.ts` + `getActiveSetBonuses` implementation
- Verify combat integration shows set bonuses triggering correctly
- Test set bonus thresholds (2-piece, 3-piece, etc.) using CLI combat scenarios

### Unit 3 — Skills vs resource generation audit

Re-verify the Phase 77 token-economy contract still holds end-to-end: basic attack/defend grant stance tokens per Spec 04; skills consume the right resources; insufficient-resource skill attempts behave per spec; no regression since Phase 77.

Evidence gathering:
- Run hermetic tests in `src/Skills/e2e/` and `src/Combat/e2e/`
- Check `canUseSkill(combatResources, skill)` behavior
- Verify stance token generation in combat via basic actions
- Test resource consumption across different skill types
- Confirm insufficient-resource handling via CLI combat edge cases

## Decisions made upfront — DO NOT ASK

- **Read-only audit**: No implementation changes unless a real bug surfaces. Goal is verification, not enhancement.
- **Evidence sources**: Use existing test suites, CLI tools, and code inspection. Do not write new test infrastructure for this audit.
- **Bug threshold**: Only fix if evidence shows a clear functional regression. Cosmetic issues or "could be better" findings go to CRITIQUE.
- **Reporting format**: Pass/drift table with verdicts (PASS/DRIFT) and brief evidence summaries per system.

## Verify gate

```bash
npm run verify     # type-check + lint + test + build all green
```

No new implementation to verify — audit uses existing code. Any bug fixes discovered during audit must pass verify gate.

## Commit body template

```
audit(items,skills): phase 98 — items + skill-resource integration verification

- Item modifiers: verify dropItem/rollModifiers/combat integration [PASS/DRIFT]
- Set bonuses: verify getActiveSetBonuses/combat effects [PASS/DRIFT]  
- Skills vs resources: verify Phase 77 token-economy contract [PASS/DRIFT]

Findings: <brief summary of any drift or bugs found>

Decisions:
- Read-only audit approach preserves existing functionality
- Evidence gathered from existing tests + CLI verification
```

## Definition of Done

- [ ] Item modifier system verified through dropItem → combat stat application chain
- [ ] Set bonus system verified through threshold → combat effect application
- [ ] Skill-resource integration verified against Phase 77 token-economy contract
- [ ] Per-system pass/drift table added to `plan/AUDIT.md`
- [ ] Any discovered bugs fixed with individual commits (if needed)
- [ ] `plan/steps/01_build_plan.md` Phase 98 row flipped to `[x]` with hash
- [ ] `npm run verify` and `npm run deploy:check` both exit 0

## Follow-ups (out of scope)

- Any DRIFT findings from the audit should be filed as CRITIQUE rows for `/iterate`
- Performance optimizations or "nice to have" enhancements are out of scope
- UI-tier item preview functionality (Phase 75/76) is separate and not audited here