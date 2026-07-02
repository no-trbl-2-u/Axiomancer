# Phase 91 — `incrementsFriendship?: number` skill payload + 2-3 calming skills

> Adds a new typed field on Skill to allow friendship increments without
> defend-stance requirement. Ships 2-3 authored calming skills that use this
> mechanism. Closes oversight-22 friendship gap.

## Outcome

The Skill type gains an optional `incrementsFriendship?: number` field. The
`executeSkill` function is extended to process this field after damage/effects
but before resource spending, calling `incrementFriendship(state)` N times where
N is the field value. 2-3 new calming skills are authored that use this mechanism
to provide alternative friendship paths beyond defend-stance.

## Source spec

Phase 91 row in `plan/steps/01_build_plan.md`. This closes the oversight-22
promotion gap around friendship mechanics that currently require defend-stance
positioning. No existing spec covers this — this is a net-new friendship
surface extension.

## Implementation units

### Unit 1 — Extend Skill type and executeSkill

**File:** `src/Skills/types.ts`
- Add `incrementsFriendship?: number` field to the `Skill` interface after
  the `synergy?: SkillSynergy` field.
- JSDoc: `/** Optional friendship counter increment. When present, executeSkill
  increments the combat friendship counter by this amount after damage/effects
  but before resource costs. Does not require defend stance. */`

**File:** `src/Skills/skill.engine.ts`  
- In `executeSkill`, after the `specialMechanics` loop (around line 510) but 
  before resource spending (line 517), add friendship processing:
```typescript
// Phase 91 — friendship increment processing
let nextState = {
    ...state,
    player: nextPlayer,
    enemy: nextEnemy,
    combatResources: nextResources,
};
if (skill.incrementsFriendship && skill.incrementsFriendship > 0) {
    for (let i = 0; i < skill.incrementsFriendship; i++) {
        nextState = incrementFriendship(nextState);
    }
    events.push({ 
        kind: 'friendship-incremented', 
        skillId, 
        amount: skill.incrementsFriendship 
    });
}
```
- Import `incrementFriendship` from `'../Combat/combat.reducer'`
- Extend `SkillEvent` type with new `friendship-incremented` variant

### Unit 2 — SkillEvent extension

**File:** `src/Skills/types.ts`
- Add new event type to the `SkillEvent` union:
```typescript
| { kind: 'friendship-incremented'; skillId: string; amount: number }
```

### Unit 3 — Author 2-3 calming skills

**File:** `src/Skills/skill.library.ts`
- Add 3 new skills to the `skillLibrary` array:

**"Soothing Words"** (Tier 1 heart fallacy):
```typescript
{
    id: 'soothing-words',
    name: 'Soothing Words',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'Gentle words that calm tensions without requiring defensive posture.',
    tier: 1,
    resourceCost: { heart: 2 },
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    incrementsFriendship: 1,
}
```

**"Peaceful Gesture"** (Tier 1 body fallacy):
```typescript
{
    id: 'peaceful-gesture',
    name: 'Peaceful Gesture',
    category: 'fallacy', 
    philosophicalAspect: 'body',
    description: 'A calming physical gesture that builds trust through non-threatening movement.',
    tier: 1,
    resourceCost: { body: 2 },
    targetType: 'self',
    basePower: 0,
    scalingStat: 'body',
    incrementsFriendship: 1,
}
```

**"Empathetic Understanding"** (Tier 2 mind paradox):
```typescript
{
    id: 'empathetic-understanding',
    name: 'Empathetic Understanding',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description: 'Deep understanding that transcends conflict, building stronger bonds.',
    tier: 2,
    resourceCost: { mind: 3, heart: 1 },
    targetType: 'self', 
    basePower: 0,
    scalingStat: 'mind',
    incrementsFriendship: 2,
}
```

## Decisions made upfront — DO NOT ASK

1. **Field placement:** `incrementsFriendship` goes after `synergy` to group
   optional behavioral modifiers together.
2. **Processing order:** Friendship increments happen after damage/effects but
   before resource spending so they're committed even if resource edge-cases
   fail.
3. **Event emission:** One `friendship-incremented` event per skill cast (not
   per increment loop) to avoid log spam.
4. **Skill targeting:** All calming skills target `'self'` since they represent
   the caster's calming actions, not effects applied to the enemy.
5. **Resource costs:** Tier 1 skills cost 2 of their primary stat; Tier 2 costs
   3 primary + 1 heart to reflect increased effectiveness.
6. **Philosophical aspects:** Cover all three aspects (heart, body, mind) to
   provide calming options regardless of character build.

## Verify gate

`npm run verify` (type-check + test + build) must pass. The new skills should
be discoverable via `getSkillById` and the friendship increment should fire
during skill execution.

## Commit body template

```
feat(skills): phase 91 — friendship increment skill payload

- Add `incrementsFriendship?: number` field to Skill interface
- Extend executeSkill to process friendship increments after effects
- Add `friendship-incremented` SkillEvent variant
- Author 3 calming skills: Soothing Words, Peaceful Gesture, Empathetic Understanding

Provides friendship progression paths beyond defend-stance requirement.
```

## Definition of Done

- [ ] `Skill` interface has `incrementsFriendship?: number` field
- [ ] `executeSkill` processes `incrementsFriendship` field correctly  
- [ ] `SkillEvent` union includes `friendship-incremented` variant
- [ ] 3 calming skills authored in skill library
- [ ] All skills discoverable via `getSkillById`
- [ ] `npm run verify` passes
- [ ] Hermetic e2e test covers friendship increment mechanics

## Follow-ups (out of scope)

- UI indicators for friendship-incrementing skills (Phase 92+ consideration)
- Balancing review of friendship rates vs defend-stance (post-ship iteration)
- Integration with difficulty meter friendship scaling (Phase 92 scope)