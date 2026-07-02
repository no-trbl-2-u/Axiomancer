# Phase 94 — Tier 3 synergy / content expansion (mirror Phase 66 for Tier 3)

## Outcome

Ship 5 Tier 3 synergy skills with `SkillSynergy` clauses, mirroring Phase 66's Tier 2 pattern but with higher-tier mechanics, rewards, and resource costs.

## Source spec

References existing Phase 66 implementation as the canonical pattern. No separate spec required — this is a content expansion following established synergy mechanics from `src/Skills/types.ts` `SkillSynergy` interface.

## Implementation units

### Unit 1: Engine extension (if needed)
- **File:** `src/Skills/types.ts`, `src/Skills/skill.engine.ts`
- **Types:** No new types — reuse existing `SkillSynergy`, `SynergyPredicate`
- **Logic:** Verify synergy engine handles Tier 3 skills correctly (should work as-is)
- **Pattern:** Check existing synergy resolution in `executeSkill` for any Tier-specific limitations

### Unit 2: Tier 3 synergy skills library  
- **File:** `src/Skills/skill.library.ts`
- **Types:** 5 new `Skill` objects with `tier: 3`, `synergy` clauses
- **Logic:** Each skill targets different synergy patterns:
  1. **Paradox Convergence** (paradox/mind) — consume multiple Tier 3 effects simultaneously, scaling damage
  2. **Metaphysical Drain** (paradox/heart) — consume opponent buffs to fuel self-healing
  3. **Logical Recursion** (fallacy/mind) — self-referential loop consuming own debuffs for damage amplification
  4. **Existential Collapse** (fallacy/body) — clear all effects + massive damage proportional to cleared count
  5. **Transcendent Synthesis** (paradox/heart) — combine multiple effect types into new compound effect
- **Pattern:** Each requires `level: 10`, costs include tier-3 resources (`paradox`/`fallacy`), `learningRequirement` consistent with existing Tier 3 skills

### Unit 3: Library registration and hermetic e2e
- **File:** `src/Skills/skill.library.ts` (skillLibrary array), `src/Skills/e2e/tier3-synergy-skills.engine.test.ts` (new file)
- **Types:** No new types — test cases verify synergy mechanics
- **Logic:** 
  - Append 5 new skills to `skillLibrary` export in Tier 3 section
  - Hermetic e2e with 10+ test cases: registration check + per-skill predicate match/miss + synergy damage validation + side-effect verification
- **Pattern:** Mirror `src/Skills/e2e/synergy-skills.engine.test.ts` structure but for Tier 3 complexity

## Decisions made upfront — DO NOT ASK

**D1**: Tier 3 synergy skills require `level: 10` (matching existing Tier 3 skills) and cost tier-3 resources (`paradox` and/or `fallacy` tokens).

**D2**: Skills follow philosophical balance — 3 paradox aspect, 2 fallacy aspect — mirroring the existing tier distribution in the library.

**D3**: Synergy mechanics increase in complexity over Tier 2 — multi-effect predicates, compound side effects, resource scaling that exceeds Tier 2 bonuses.

**D4**: No new engine primitives needed — existing `SkillSynergy` interface supports all required mechanics.

**D5**: Skill IDs use philosophical naming convention: `paradox-convergence`, `metaphysical-drain`, `logical-recursion`, `existential-collapse`, `transcendent-synthesis`.

**D6**: Each skill's `basePower` ranges 12-20 to reflect Tier 3 power level (higher than Tier 2 synergy's 0-5 range).

**D7**: Learning requirements mirror existing Tier 3 — `{ level: 10 }` only, no alignment gates (saves that complexity for specific content phases).

## Verify gate

- `npm run type-check` — TypeScript compilation
- `npm test` — all existing + new hermetic e2e cases
- `npm run build` — dist generation

## Commit body template

```
feat(skills): phase 94 — tier 3 synergy skills (5 patterns)

- Paradox Convergence: multi-effect consumption scaling
- Metaphysical Drain: opponent-buff-to-self-heal conversion
- Logical Recursion: self-debuff recursive amplification
- Existential Collapse: clear-all with count-proportional damage
- Transcendent Synthesis: compound effect creation

Decisions:
- Level 10 requirement matching existing Tier 3 skills
- Tier 3 resource costs (paradox/fallacy tokens)
- Reused SkillSynergy interface — no engine changes needed
- Philosophical balance: 3 paradox, 2 fallacy skills

Closes #<phase-issue-number>
```

## Definition of Done

- [ ] 5 new Tier 3 skills with `synergy` clauses authored in `skill.library.ts`
- [ ] Skills registered in `skillLibrary` export array
- [ ] Hermetic e2e test file covers all 5 skills' synergy mechanics
- [ ] Skills use tier-3 resources and `level: 10` learning requirement
- [ ] Skills follow philosophical naming and balance conventions
- [ ] All synergy mechanics validated: predicate matching, damage calculation, side effects
- [ ] Type-check, test, and build verify gates pass
- [ ] `src/index.ts` exports updated (if new engine primitives added)
- [ ] `docs/skills.md` updated with Tier 3 synergy section

## Follow-ups (out of scope)

- Tier 3 synergy skills with alignment gates (similar to Phase 46 pattern)
- Cross-tier synergy skills (Tier 2 consuming Tier 1 effects, etc.)
- Synergy skills that interact with equipment set bonuses
- UI-specific skill descriptions for synergy conditions