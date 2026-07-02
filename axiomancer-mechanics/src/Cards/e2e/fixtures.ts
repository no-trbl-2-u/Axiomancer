/**
 * Hermetic e2e fixtures for the Skills module (Spec 04b).
 *
 * `SkillTestPlayer` is a stable, predictable character used by the
 * `skill-resource-system.engine.test.ts` suite to exercise the resource
 * build-up → skill firing → philosophical token chain. Its base stats are
 * tuned so the canonical damage formula
 *
 *     damage = basePower + baseStats[scalingStat] × SKILL_STAT_MULTIPLIER × (mult ?? 1)
 *
 * lands on round numbers: Ad Hominem Strike (`basePower 8`, `scalingStat body`)
 * with `body: 10` deals exactly `8 + 10 × 0.5 = 13` damage.
 *
 * Equipped skills are intentionally a small subset of the full library so the
 * test does not depend on every skill being learnable / equipped — only the
 * skills it explicitly exercises (`ad-hominem-strike` happy path,
 * `straw-giant` Tier 3 gate, `achilles-gambit` / `sorites-cascade` for shape).
 */

import { Character } from '../../Character/types';
import { createCharacter } from '../../Character';

/**
 * Stable hermetic player used by the skill e2e suite. Do NOT import this
 * into runtime code — it lives under `e2e/` and is fixture data only.
 */
export const SkillTestPlayer: Character = createCharacter({
    name: 'Card Test Player',
    level: 1,
    baseStats: { body: 10, mind: 8, heart: 6 },
    knownSkills: [
        'ad-hominem-strike',
        'achilles-gambit',
        'sorites-cascade',
        'straw-giant',
    ],
});
