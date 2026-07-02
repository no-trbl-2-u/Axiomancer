/**
 * Hermetic e2e for the 2026-06-07 content drop (20 mid/late-game skills).
 *
 * Data-only assertions (no combat resolution required):
 *   - Every new skill id resolves via `getCardById`.
 *   - Every referenced `combatEffects[].effectId` is a non-empty string.
 *   - Tiers are within the 1-3 range.
 *   - Counts per tier / philosophicalAspect match the intended spread.
 */

import { describe, expect, it } from 'vitest';
import type { CardTier, StatType } from '../types';
import { getCardById } from '../cards.library';

const NEW_SKILL_IDS = [
    // Tier 1 (5)
    'hasty-generalization',
    'red-herring',
    'wishful-thinking',
    'arrow-paradox',
    'heap-of-doubt',
    // Tier 2 (8)
    'slippery-slope',
    'appeal-to-authority',
    'tu-quoque',
    'barbers-paradox',
    'raven-paradox',
    'stoic-bulwark',
    'equivocation-cascade',
    'sunk-cost-momentum',
    // Tier 3 (7)
    'omnipotence-paradox',
    'gamblers-ruin',
    'gamblers-fallacy',
    'buridans-impasse',
    'eternal-recurrence',
    'grandfather-paradox',
    'apophatic-aegis',
] as const;

const VALID_TIERS: ReadonlyArray<CardTier> = [1, 2, 3];
const VALID_ASPECTS: ReadonlyArray<StatType> = ['body', 'mind', 'heart'];

describe('2026-06-07 content drop — new skills', () => {
    it('adds exactly 20 new skills', () => {
        expect(NEW_SKILL_IDS.length).toBe(20);
    });

    it('every new skill id resolves via getCardById', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id);
            expect(skill, `skill ${id} missing from library`).toBeDefined();
            expect(skill!.id).toBe(id);
        }
    });

    it('every new skill is tagged addedIn 2026-06-07 with non-empty tags', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id)!;
            expect(skill.addedIn, `skill ${id} missing addedIn`).toBe('2026-06-07');
            expect(Array.isArray(skill.tags), `skill ${id} missing tags`).toBe(true);
            expect(skill.tags!.length, `skill ${id} has empty tags`).toBeGreaterThan(0);
        }
    });

    it('every referenced combatEffects effectId is a non-empty string', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id)!;
            for (const ce of skill.combatEffects ?? []) {
                expect(typeof ce.effectId, `skill ${id} effectId not a string`).toBe('string');
                expect(ce.effectId.length, `skill ${id} has empty effectId`).toBeGreaterThan(0);
                expect(['self', 'opponent']).toContain(ce.appliedTo);
            }
        }
    });

    it('every new skill tier is within 1-3', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id)!;
            expect(VALID_TIERS, `skill ${id} has invalid tier ${skill.tier}`).toContain(skill.tier);
        }
    });

    it('every new skill philosophicalAspect and scalingStat are valid', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id)!;
            expect(VALID_ASPECTS).toContain(skill.philosophicalAspect);
            expect(VALID_ASPECTS).toContain(skill.scalingStat);
        }
    });

    it('every new skill category is fallacy or paradox', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id)!;
            expect(['fallacy', 'paradox']).toContain(skill.category);
        }
    });

    it('learning requirements scale up toward late-game for tier 3', () => {
        for (const id of NEW_SKILL_IDS) {
            const skill = getCardById(id)!;
            if (skill.tier === 3) {
                expect(skill.learningRequirement?.level, `tier 3 skill ${id} missing level gate`)
                    .toBeGreaterThanOrEqual(30);
            }
        }
    });

    it('prerequisite skills resolve within the library', () => {
        for (const id of NEW_SKILL_IDS) {
            const prereq = getCardById(id)!.learningRequirement?.prerequisiteSkill;
            if (prereq) {
                expect(getCardById(prereq), `prereq ${prereq} for ${id} missing`).toBeDefined();
            }
        }
    });

    it('spans the intended tier spread (5 / 8 / 7)', () => {
        const skills = NEW_SKILL_IDS.map(id => getCardById(id)!);
        const byTier = (t: CardTier) => skills.filter(s => s.tier === t).length;
        expect(byTier(1)).toBe(5);
        expect(byTier(2)).toBe(8);
        expect(byTier(3)).toBe(7);
    });

    it('spans all three philosophical aspects', () => {
        const skills = NEW_SKILL_IDS.map(id => getCardById(id)!);
        for (const aspect of VALID_ASPECTS) {
            expect(skills.some(s => s.philosophicalAspect === aspect),
                `no new skill for aspect ${aspect}`).toBe(true);
        }
    });
});
