# Phase 89 — Combat log-entry shape audit + regression pin

> Promoted via `/oversight` 2026-05-24 (40th call). Source signal: 
> hotfix `043d607` for boss-skill killing-blow crash due to undefined
> `enemyAction.skillId`. Contract divergence between engine types 
> and runtime shapes needs audit + regression protection.

**Source-of-truth lines:**
- `plan/PHASE_CANDIDATES.md:` — the full rationale and proposed scope.
- Hotfix commit `043d607` — defensive optional-chain fix for crash.
- `state/presenters/aftermath.engine.ts` — reads `combat.log[last].enemyAction` for defeat panel.

---

## Routes / API endpoints / CLI surface

No new routes. Bug fix and regression protection for existing combat functionality.

## Content / data reads

| Helper | Call | Use |
|--------|------|-----|
| `CombatStateLike` | Type audit | Validate contract vs runtime shape |
| `aftermath.engine.ts` | `selectAftermathViewModel` | Access log entry fields safely |
| Combat state actions | `resolveRound` | Populate log entries with consistent shape |

## Components / handlers

**New:**
- `state/e2e/aftermath-snapshot.engine.test.ts` — regression test for undefined log entry fields
- Boss-skill killing-blow fixture — reproduces crash scenario

**Enhanced:**
- `state/actions.ts` — audit `resolveRound` for defensive guards
- `state/presenters/aftermath.engine.ts` — ensure null-safety for log entry access

**Reused:**
- Existing combat test infrastructure
- Engine integration test patterns

## Cross-links

**In (verify):** None. Internal bug fix and test coverage.

**Out (ship):** None. Defensive improvements only.

**Retro-fit:** None required.

## SEO / metadata / output schema

N/A. Internal bug fix and regression protection.

## Hero / body / sub-section composition

N/A. No UI changes.

## Empty / loading / error states

**Enhanced error handling:** Combat log entry consumption made null-safe throughout the codebase.

## Decisions made upfront — DO NOT ASK

1. **Regression test placement:** Add new test file `aftermath-snapshot.engine.test.ts` for focused crash reproduction rather than expanding existing combat tests.

2. **Audit scope:** Focus on `aftermath.engine.ts` and `resolveRound` as primary consumers of log entry fields. Other log consumers audited if time permits.

3. **Engine PR deferral:** File engine issue for type/runtime contract divergence but don't block mobile fix on engine changes.

4. **Defensive patterns:** Use optional chaining and null coalescing throughout log entry field access.

5. **Test fixture approach:** Create minimal boss-skill scenario that triggers undefined `enemyAction` rather than complex battle simulation.

## Mobile reflow / responsive / paginate / output limits

N/A. No UI changes.

## Pages × tests matrix

| Surface | Unit | E2E |
|---------|------|-----|
| `aftermath-snapshot.engine.test.ts` | ✓ | — |
| `resolveRound` audit | ✓ (existing enhanced) | — |
| `selectAftermathViewModel` enhancement | ✓ (existing enhanced) | — |
| Boss-skill crash fixture | ✓ | — |

## Verify gate

```bash
pnpm verify    # typecheck → test:run → data:validate → build → e2e
```

Standard verify gate. New regression test must pass.

## Commit body template

```
fix: combat log-entry shape audit + regression pin — phase 89

- Add aftermath-snapshot regression test for undefined enemyAction
- Audit resolveRound and aftermath presenter for null-safety
- Create boss-skill killing-blow crash reproduction fixture
- Enhanced defensive guards for combat log entry field access

Decisions:
- Focused regression test over expanding existing combat test suite
- Defensive optional chaining throughout log entry consumption
- Engine type contract issue filed separately, mobile fix ships first

Closes #<phase-issue-number>
```

## DoD

- [ ] `aftermath-snapshot.engine.test.ts` reproduces boss-skill killing-blow crash
- [ ] Regression test covers undefined `enemyAction` scenario
- [ ] Audit `state/actions.ts` `resolveRound` for defensive guards
- [ ] Audit `state/presenters/aftermath.engine.ts` for null-safety
- [ ] All log entry field access uses optional chaining
- [ ] New tests pass and existing combat tests remain green
- [ ] Engine issue filed for type/runtime contract divergence

## Follow-ups (out of scope)

- Engine PR to fix type/runtime divergence if audit confirms contract violation
- Extended audit of all combat log consumers beyond aftermath + resolveRound
- Enhanced error reporting for malformed log entries