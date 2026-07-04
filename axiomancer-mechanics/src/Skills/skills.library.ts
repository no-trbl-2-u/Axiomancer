/**
 * Skills Library — Master Spec §3.3.
 *
 * The 7 skills below are the full catalogue: a separate, always-available
 * ability system funded by `CombatResources` tokens (heart/body/mind/fallacy/
 * paradox) — independent of the drawn hand (Skills are NOT cards, doctrine
 * §3.2). All reference real effect ids already present in
 * `Effects/buffs.library.json` / `Effects/debuffs.library.json`.
 *
 * Naming collision note (Master Spec §3.3 RESOLUTION): skill #3 is named
 * "Sorites' Retreat" (id `sorites-retreat`) rather than "Regress ad Infinitum"
 * to avoid a duplicate display name with the card `regress-ad-infinitum`
 * (`Cards/cards.library.ts`) — same paradox, two distinct systems.
 *
 * `requiresUnlock` is `null` on every entry today (product-owner decision:
 * "design so all skills are available for testing"); a future race/class/
 * equipment gating pass populates it without touching this shape.
 */

import type { SkillDefinition } from './skills.types';

/** The full skill catalogue. */
export const SKILLS_LIBRARY: SkillDefinition[] = [
    {
        id: 'ad-hoc-rescue',
        name: 'Ad Hoc Rescue',
        description: 'A cheap, spammable patch-job: mend yourself with a minor '
            + 'regeneration tick to keep the fight going.',
        aspect: 'heart',
        cost: { heart: 2 },
        effect: { kind: 'apply_effect', effectId: 'buff_regeneration', target: 'self', intensity: 1 },
        requiresUnlock: null,
    },
    {
        id: 'sunk-cost-surge',
        name: 'The Sunk-Cost Surge',
        description: 'Burn your entire Body bank in one aggressive payoff — the '
            + 'more you had banked, the harder it lands on the enemy.',
        aspect: 'body',
        cost: { body: 2, fallacy: 1 },
        effect: { kind: 'consume_bank_burst', resource: 'body', pctPerToken: 4 },
        requiresUnlock: null,
    },
    {
        id: 'sorites-retreat',
        name: "Sorites' Retreat",
        description: 'Walk the heap back down: clears two of your own stacked '
            + 'debuffs before they compound into something worse.',
        aspect: 'mind',
        cost: { mind: 3 },
        effect: { kind: 'cleanse_self', count: 2, category: 'debuff' },
        requiresUnlock: null,
    },
    {
        id: 'petitio-principii',
        name: 'Petitio Principii',
        description: 'A cheap cross-aspect disruption: assumes the conclusion and '
            + 'strips one buff the enemy was relying on.',
        aspect: 'mixed',
        cost: { mind: 1, heart: 1 },
        effect: { kind: 'strip_enemy_buff', count: 1 },
        requiresUnlock: null,
    },
    {
        id: 'sorites-reckoning',
        name: "Sorites' Reckoning",
        description: 'The doctrine execute/finisher payoff for Skills: once per '
            + "combat, detonate the enemy's stacked debuffs (3+ distinct) for a "
            + 'burst proportional to how many are heaped on.',
        aspect: 'mixed',
        cost: { paradox: 2 },
        effect: { kind: 'detonate_stacks', minDistinctDebuffs: 3, perDebuffPct: 8 },
        limit: { kind: 'once_per_combat' },
        requiresUnlock: null,
    },
    {
        id: 'unfalsifiable-ward',
        name: 'Unfalsifiable Ward',
        description: 'A tri-cost generalist utility: raises a modest, persistent '
            + 'barrier that soaks the next hits regardless of aspect.',
        aspect: 'mixed',
        cost: { body: 1, mind: 1, heart: 1 },
        effect: { kind: 'grant_barrier', amount: 8 },
        requiresUnlock: null,
    },
    {
        id: 'analysts-regress',
        name: "The Analyst's Regress",
        description: 'A cooldown-gated Fallacy-token sink: needles the enemy with '
            + 'confusion, muddling its next telegraphed action.',
        aspect: 'mixed',
        cost: { fallacy: 2 },
        effect: { kind: 'apply_effect', effectId: 'debuff_confusion', target: 'enemy', intensity: 1 },
        limit: { kind: 'cooldown', rounds: 3 },
        requiresUnlock: null,
    },
];

const skillRegistry = new Map<string, SkillDefinition>();
SKILLS_LIBRARY.forEach(skill => skillRegistry.set(skill.id, skill));

/** O(1) lookup by skill ID. */
export const lookupSkill = (skillId: string): SkillDefinition | undefined =>
    skillRegistry.get(skillId);

/** All skill ids in the catalogue, in declaration order. */
export const getAllSkillIds = (): string[] => SKILLS_LIBRARY.map(skill => skill.id);
