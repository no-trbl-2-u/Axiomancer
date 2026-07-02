# Phase 97 — Combat correctness (token accrual + re-trigger + skill-equip)

## Outcome

**Fix three blocking combat bugs:** (a) Token resource system never accumulates — fix presenter to read engine's per-round `combatResources` instead of static placeholder, (b) Combat cannot be re-triggered after victory — fix trigger logic, (c) Learned skills blocked as "not equipped" — surface only currently-usable skills. All fixes read engine state rather than local placeholders.

## Why

Three user-spotted blocking bugs on the engine↔presenter boundary, bundled per oversight scope decision. References issues #226/#227. Without token accumulation no skills can be cast. Combat re-trigger is broken after victory. Skill system shows unusable skills as blocked. All are presenter-layer fixes that need to properly read engine state.

## Surface / Routes

**No route changes.** Fixes are in:
- `app/(tabs)/combat.tsx` 
- `components/combat/` components
- `state/presenters/combat.engine.ts`

## Design inputs

- Current combat screen implementation
- `axiomancer-mechanics` engine API for combat resources and skills
- Issues #226/#227 user reports
- AUDIT findings from combat token accumulation
- CRITIQUE [HIGH] findings for re-trigger and skill equip

## Content / data reads

**Engine state reads (fix placeholder reads):**
- `combatResources` from engine per-round state (not static value)
- Combat re-trigger availability from engine victory state
- Available/equipped skills from engine skill system state

## Components / handlers

**Modified components:**
- Combat HUD token display (fix resource accumulation read)
- Combat modal trigger logic (fix post-victory re-trigger)
- Skill selection UI (filter to equipped/usable only)
- Combat presenter layer `combat.engine.ts`

**No new components** — fixes to existing presenter logic.

## Cross-links

**Verify existing combat cross-links still work** after fixes.

## SEO / metadata

**Not applicable.** Internal combat state fixes.

## Hero / body / sub-section composition

**Combat modal sections affected:**
- Token/resource display area (fix accumulation)
- Skill selection area (filter unusable)
- Combat trigger button/logic (fix re-trigger)

## Empty / loading / error states

**Preserve existing error states.** Ensure fixes don't break error handling for:
- Missing combat state
- Invalid skill data
- Resource calculation errors

## Decisions made upfront — DO NOT ASK

- **Engine authority:** All state reads come from engine, no local calculations
- **Presenter contract:** Fix reads in presenter layer, don't modify engine
- **Skill filtering:** Show only currently usable skills, hide equipped but unusable
- **Token display:** Real-time engine resource values, not cached/static values
- **Re-trigger logic:** Check engine victory state for re-trigger availability

## Mobile reflow / responsive / paginate / output limits

**No layout changes.** Preserve existing combat modal responsive behavior.

## Pages × tests matrix

**Test coverage:**
- `combat.engine.test.ts` — presenter layer fixes
- `Combat.test.tsx` — component integration tests
- Combat e2e tests — verify token accumulation, re-trigger, skill filtering work end-to-end

## Verify gate

```bash
npm test -- combat
npm run type-check
npm run e2e -- combat
```

All existing tests pass + new test cases for the three fixed bugs.

## Commit body template

```
fix: combat correctness — token accrual + re-trigger + skill-equip

- Token system reads engine combatResources per-round (not static placeholder)
- Combat re-trigger works after victory (checks engine victory state)
- Skills filtered to currently-usable only (reads engine skill availability)

Fixes three blocking bugs on engine↔presenter boundary.
Engine logic unchanged — presenter now reads real engine state.

References #226, #227

Closes #<phase-issue>
```

## DoD

- [ ] Token accumulation displays real engine `combatResources` values
- [ ] Combat can be re-triggered after victory
- [ ] Skill selection shows only equipped and currently-usable skills
- [ ] All fixes read engine state, no local calculations
- [ ] Tests pass for all three bug fixes
- [ ] No regression in existing combat functionality

## Follow-ups (out of scope)

- Combat UX improvements (Phase 98 terminology implementation)
- Additional combat feature development
- Performance optimization of engine state reads