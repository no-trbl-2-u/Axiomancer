/**
 * Skills barrel — Master Spec §3.
 *
 * Skills are NOT cards: a separate, always-available ability system funded by
 * `CombatResources` tokens, independent of the drawn hand. See `skills.types.ts`
 * for the full doctrine note.
 */

export type {
    SkillCost, SkillEffect, SkillLimit, SkillDefinition,
} from './skills.types';

export {
    SKILLS_LIBRARY, lookupSkill, getAllSkillIds,
} from './skills.library';

export { getKnownSkills } from './known-skills';

export {
    canAffordSkill, spendSkillCost, triggerSkill,
} from './skill-trigger.engine';
export type {
    SkillTriggerContext, SkillTriggerResult, SkillEngineHandoff,
} from './skill-trigger.engine';
