/**
 * Known-Skills Seam — Master Spec §3.4.
 *
 * `getKnownSkills()` is the ONLY place a future race/class/equipment gate
 * needs to change: today it returns every `SkillDefinition.id` in the
 * catalogue where `requiresUnlock === null` (which, for now, is all of
 * them — "design so all skills are available for testing" per the product
 * owner's locked decision). The trigger engine only ever asks "is this id in
 * the known set" — it never inspects `requiresUnlock` itself.
 */

import { SKILLS_LIBRARY } from './skills.library';

/** Every skill id currently available to the player. No character/equipment
 *  parameter yet — this is the seam a future gating pass will thread through
 *  without touching the trigger engine. */
export function getKnownSkills(): string[] {
    return SKILLS_LIBRARY.filter(skill => skill.requiresUnlock === null).map(skill => skill.id);
}
