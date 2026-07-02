# Phase 116 — Token resource accumulation fix

> **Outcome:** Fix token resource accumulation bug (issue #227) so combat skills can be cast. Engine's per-round `combatResources` accrual is verified and propagated through the presenter chain.

## Routes / API endpoints / CLI surface

N/A — combat resources are presenter-only state managed by engine reducer.

## Content / data reads

| Helper | Call | Use |
|---|---|---|
| `resolveCombatRound` (engine) | `resolveCombatRound(combat, playerAction, enemyAction, skillLookup)` | Returns updated `CombatState` with accumulated `combatResources` |
| `selectCombatViewModel` | `selectCombatViewModel(state, localUi)` | Reads `state.combat.combatResources` to build token display |

## Components / handlers

**Reused primitives:**
- `CrucibleToken` interface (lines 323-334 in `combat.engine.ts`) 
- `buildCrucibleTokens` function (lines 866-875) maps resource pool to token display
- `calculateResourceTotals` function (lines 756-768) computes totals and ratios
- Token affordability logic in `canAffordSkill` (lines 877-883)

**No new components required** — issue is data flow, not UI.

## Cross-links

**In (verify):** Combat presenter test suite verifies round-over-round token accumulation
**Out (ship):** Token accumulation enables skill casting in combat flow
**Retro-fit:** None required

## SEO / metadata / output schema

N/A — internal combat state only

## Hero / body / sub-section composition

N/A — bug fix affects underlying data, not layout

## Empty / loading / error states

Existing empty state (EMPTY_POOL) preserved when no combat active.

## Decisions made upfront — DO NOT ASK

1. **Root cause hypothesis:** Engine's `resolveCombatRound` returns updated `combatResources` but mobile isn't reading or preserving them correctly in the action chain
2. **Investigation approach:** Trace from `state/actions.ts` `resolveRound` through `updateCombat(withLog)` to verify `combatResources` propagation
3. **Fix strategy:** Ensure engine-emitted `combatResources` are preserved through the mobile action chain and read by the presenter
4. **No simulation:** Never implement local token accumulation logic — must use engine truth only
5. **Verification method:** Focused Jest tests on round-over-round resource accumulation plus skill affordability

## Mobile reflow / responsive / paginate / output limits

N/A — no UI changes, only data flow fix

## Pages × tests matrix

| Test file | Coverage |
|---|---|
| `state/e2e/combat.engine.test.ts` | Round-over-round token accumulation, skill affordability |
| `state/presenters/combat.engine.test.ts` | Presenter reads engine `combatResources` correctly |

## Verify gate

1. `npm run typecheck` — TypeScript compilation
2. `npm test combat` — Focused combat presenter/resource tests
3. `npm run verify` — Full verification pipeline

## Commit body template

```
fix: token resource accumulation from engine truth

- Engine combatResources now propagate through resolveRound action chain
- Combat presenter reads accumulated resources correctly per round
- Skills can now be cast when sufficient tokens are available
- Closes #227

Verification: focused combat presenter tests + npm run verify
```

## DoD

- [ ] Engine's `resolveCombatRound` `combatResources` preserved in mobile action chain
- [ ] Combat presenter reads accumulated resources from engine state
- [ ] Token accumulation works round-over-round (verified by test)
- [ ] Skill affordability updates correctly based on accumulated resources
- [ ] No local token logic remains (engine truth only)
- [ ] Issue #227 closed by commit trailer

## Follow-ups (out of scope)

- Combat resource display optimizations (visual polish)
- Additional combat skills requiring resource tuning
- Resource persistence between encounters (separate spec decision needed)