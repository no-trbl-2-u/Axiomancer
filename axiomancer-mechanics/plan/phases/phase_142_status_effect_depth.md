# Phase 142 — Status-effect depth (doctrine-central)

## Outcome

Status-effect play is deepened along breadth/synergy axis with strengthened effect interactions on the existing kit, closing engagement-without-resolution gaps from Phases 126/130 where STRATEGIST status play is heavily engaged but cells still timeout.

## Source spec

Filed via oversight 2026-06-13 (Q1: T pick — "File status-effect depth phase"). **Doctrine-load-bearing** per CLAUDE.md: status effects are the MAIN fun in combat encounters; low engagement is a balance failure. References existing Specs 01 (effects engine), 03 (tier 2/3 procs), and the established Phase 66/94 synergy systems. Pre-resolved open questions based on Phase 126/130 evidence and current tuning ledger state.

## Implementation units

### Unit 1: Enhanced status effect interactions
- File: `src/Effects/interactions.ts`
- Types: `EffectInteraction`, `InteractionTrigger`, `InteractionResult` interfaces
- Logic: New effect-on-effect interactions that trigger when specific combinations are present
- Pattern: Pure interaction resolver that checks active effects and applies synergy bonuses

### Unit 2: Extended synergy predicate support
- File: `src/Skills/synergy-predicates.ts`
- Types: Extend `SynergyPredicate` with multi-effect requirements and stack conditions
- Logic: Support for "requires any 2 debuffs", "requires buff+debuff combo", etc.
- Pattern: Follow Phase 66 synergy pattern with enhanced predicate matching

### Unit 3: Status effect amplification registry
- File: `src/Effects/amplification.registry.ts`
- Types: `EffectAmplification` for intensity/duration multipliers based on combos
- Logic: Registry of effect ID combinations that trigger amplified application
- Pattern: JSON-loadable registry similar to existing effect libraries

### Unit 4: Resolution threshold fine-tuning
- File: `src/Combat/resolution.constants.ts`
- Types: Extract resolution constants from current hardcoded values
- Logic: Centralize and make tunable the resolution thresholds based on matrix evidence
- Pattern: Constants file with clear documentation of threshold rationale

### Unit 5: Hermetic e2e coverage
- File: `src/Effects/e2e/status-depth.engine.test.ts`
- Types: Test scenarios for new interaction systems
- Logic: Drive combinations that should trigger enhanced effects and prove resolution
- Pattern: Existing e2e test pattern with stubbed RNG

## Decisions made upfront — DO NOT ASK

1. **Scope boundary**: Focus on breadth/synergy within existing effect kit, no new core `outcome` union members per brief constraint
2. **Synergy approach**: Extend Phase 66/94 predicate system rather than create separate interaction engine
3. **Resolution mechanism**: Use Phase 125/126/130 threshold system, tune values based on matrix evidence
4. **Effect interactions**: Trigger on effect combinations present simultaneously, not sequential application
5. **Performance**: Keep interaction checks O(n) by limiting to active effects only
6. **Tuning integration**: Make new amplification values registry-tunable for mechanics-tuning loop
7. **Regression prevention**: Ensure STRATEGIST engagement stays ≥40% floor throughout changes
8. **Testing strategy**: Focus on timeout cell scenarios that currently show high engagement but zero resolution

## Verify gate

- `npm run type-check` (TypeScript compilation)
- `npm test` (including new hermetic e2e tests)
- `npm run verify` (full gate: type-check + lint + test + build)
- `npm run deploy:check` (package publishability)
- Manual spot-check against previous timeout cells if evidence shows improvement

## Commit body template

```
feat(effects): phase 142 — status-effect depth via interaction breadth

- Add effect-on-effect interaction system for combination synergies
- Extend synergy predicates to support multi-effect requirements
- Create amplification registry for combo-triggered intensity bonuses
- Extract and tune resolution thresholds based on matrix evidence
- Comprehensive e2e coverage for status-effect combination scenarios

Decisions:
- Extended Phase 66/94 synergy pattern over separate interaction engine
- Registry-tunable amplification values for mechanics-tuning compatibility
- Focus on breadth/synergy within existing kit per doctrine priority
- Resolution threshold tuning based on current matrix timeout evidence

Addresses: Status-effect engagement-without-resolution gaps from Phase 126/130
```

## Definition of Done

- [ ] Effect-on-effect interaction system implemented and tested
- [ ] Extended synergy predicates support multi-effect combo requirements
- [ ] Amplification registry provides tunable intensity/duration multipliers
- [ ] Resolution threshold constants extracted and tuned per matrix evidence
- [ ] STRATEGIST status-effect engagement maintained ≥40% of rounds (doctrine floor)
- [ ] Previous timeout cells show resolution improvement without engagement collapse
- [ ] Hermetic e2e tests prove status-effect combinations trigger expected synergies
- [ ] All verify gates pass (type-check, lint, test, build, deploy-check)
- [ ] Registry values are mechanics-tuning compatible for future balance iteration

## Follow-ups (out of scope)

- New status effects beyond existing kit (separate content phase)
- Core resolution formula rewrites (escalate to T if current levers insufficient)
- Basic-attack vs status-effect balance rewrite (separate tuning phase)
- Enemy AI adaptation to new interaction patterns (follows after player system)