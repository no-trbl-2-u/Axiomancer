# Phase 93 — Damage-resist primitive (Phase 80 direction (a) damage-side follow-up)

> **Direction (a) completion.** Phase 80 shipped the effect-side of 
> direction (a) pure split (effects always land); this phase completes 
> the damage-side ("damage rolls separately + applies its own resistance").
> Score 3.0 (medium impact, medium ease).

## Outcome

`src/Skills/skill.engine.ts:calculateSkillDamage` is extended to support
damage resistance, and a new `src/Combat/damage-resist.ts` module provides
the damage resistance primitive. Skills that deal damage now have their
damage reduced by the target's resistance stats before being applied.

## Source spec

Phase 80 direction (a) follow-up as described in 
`plan/phases/phase_80_skills_always_land_pure_split.md` D1 and D10. 
The damage-resist primitive enables skills' damage output to be reduced
by target resistance, completing the "damage rolls separately + applies 
resistance" part of direction (a).

## Implementation units

### Unit 1 — Damage resistance primitive (`src/Combat/damage-resist.ts`)

New module providing the damage resistance calculation:

```typescript
import type { Combatant } from './types';

/**
 * Calculates damage reduction based on target's resistance stats.
 * Direction (a) damage-side primitive: damage applies resistance
 * separately from effect application.
 */
export function calculateDamageResistance(
    target: Combatant,
    baseDamage: number,
    damageType: 'physical' | 'mental' | 'emotional',
): number {
    // Map damage types to resistance stats
    const resistanceStat = damageType === 'physical' ? target.baseStats.body
        : damageType === 'mental' ? target.baseStats.mind
        : target.baseStats.heart;
    
    // Simple linear resistance: every point reduces damage by 1
    const resistance = Math.max(0, resistanceStat);
    const finalDamage = Math.max(1, baseDamage - resistance); // Min 1 damage
    
    return finalDamage;
}

/**
 * Determines damage type based on skill's scaling stat.
 */
export function getSkillDamageType(scalingStat: 'body' | 'mind' | 'heart'): 'physical' | 'mental' | 'emotional' {
    return scalingStat === 'body' ? 'physical'
        : scalingStat === 'mind' ? 'mental' 
        : 'emotional';
}
```

### Unit 2 — Integrate resistance into skill damage calculation

Update `src/Skills/skill.engine.ts:calculateSkillDamage` to accept a target
and apply resistance:

```typescript
export function calculateSkillDamage(
    actor: Combatant, 
    skill: Skill,
    target?: Combatant,
): number {
    const multiplier = skill.scalingMultiplier ?? 1;
    const baseDamage = Math.max(
        0,
        Math.round(
            skill.basePower
            + actor.baseStats[skill.scalingStat] * SKILL_STAT_MULTIPLIER * multiplier,
        ),
    );
    
    // Phase 93: Apply damage resistance if target provided
    if (target && baseDamage > 0) {
        const damageType = getSkillDamageType(skill.scalingStat);
        return calculateDamageResistance(target, baseDamage, damageType);
    }
    
    return baseDamage;
}
```

### Unit 3 — Update skill execution call sites

Update callers in `src/Skills/skill.engine.ts:executeSkill` to pass the 
target when calculating damage:

- Modify damage calculation to use the new signature
- Ensure backward compatibility where target is unavailable

### Unit 4 — Hermetic e2e test

Add `src/Combat/e2e/damage-resist.engine.test.ts` testing:
- Damage reduction by target resistance stats
- Different damage types (physical/mental/emotional)
- Minimum damage of 1
- Integration with skill execution

### Unit 5 — Docs and exports

- Update `src/index.ts` to export new damage resistance functions
- Update `docs/combat.md` with damage resistance explanation
- Update `CHANGELOG.md [unreleased] ### Added` with damage resistance feature

## Decisions made upfront — DO NOT ASK

- **D1 — Linear resistance model.** Each point of resistance stat reduces
  damage by 1 point. Simple, predictable, easy to balance. More complex
  models (percentage, diminishing returns) deferred to combat tuning phases.

- **D2 — Damage type mapping.** Body stat → physical damage, Mind stat → 
  mental damage, Heart stat → emotional damage. Maps directly to skill
  scaling stat for simplicity.

- **D3 — Minimum 1 damage.** Prevents complete damage negation which would 
  break combat flow. High resistance reduces but never eliminates damage.

- **D4 — Optional target parameter.** `calculateSkillDamage` gains optional
  target param for backward compatibility. Existing callers without target
  get original behavior (no resistance applied).

- **D5 — No effect on DoTs.** Damage resistance applies only to initial
  skill damage, not to damage-over-time effects. DoT resistance is a
  separate concern for future phases.

- **D6 — Single-commit ship.** All units are tightly coupled; ships as one
  commit.

## Verify gate

`npm run verify` (type-check + test + build). No breaking changes expected
since target parameter is optional and new exports are additive.

## Commit body template

```
feat(combat): phase 93 — damage-resist primitive (direction (a) completion)

- New src/Combat/damage-resist.ts module:
  - calculateDamageResistance(): linear resistance model (1 stat = 1 damage reduction)
  - getSkillDamageType(): maps skill scaling stat to damage type
  - Damage types: physical (body), mental (mind), emotional (heart)
- calculateSkillDamage() gains optional target parameter for resistance application
- executeSkill() updated to pass target for damage calculation  
- Minimum 1 damage prevents complete negation
- Hermetic e2e test covers resistance mechanics + skill integration
- No effect on DoTs (initial damage only)
- Backward compatible: existing callers without target get original behavior

Decisions:
- D1: linear resistance (1 stat point = 1 damage reduction)
- D2: damage type maps to skill scaling stat
- D3: minimum 1 damage (no complete negation) 
- D4: optional target parameter (backward compatibility)
- D5: no DoT resistance (future phase)
- D6: single-commit ship

Completes Phase 80 direction (a) damage-side implementation.
```

## Definition of Done

- [ ] `src/Combat/damage-resist.ts` created with resistance functions.
- [ ] `calculateSkillDamage` updated with optional target parameter.
- [ ] Skill execution updated to pass target for damage calculations.
- [ ] Hermetic e2e test in `src/Combat/e2e/damage-resist.engine.test.ts`.
- [ ] `src/index.ts` exports new damage resistance functions.
- [ ] `docs/combat.md` updated with damage resistance documentation.
- [ ] `CHANGELOG.md [unreleased] ### Added` entry.
- [ ] `npm run verify` passes.
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- **DoT damage resistance** — separate primitive for damage-over-time effects.
- **Non-linear resistance models** — percentage-based, diminishing returns.
- **Armor/equipment resistance modifiers** — equipment-based resistance bonuses.
- **Combat tuning** — balance testing with new damage resistance system.