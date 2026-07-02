/**
 * Hermetic unit tests — combat-skills adapter (Phase 16).
 *
 * Pins the mapping contract from the engine's `Skill` to the
 * mobile `CombatSkill` row: shape coverage, name uppercased,
 * category + stance literal-union safety.
 */

import { describe, expect, it } from '@jest/globals';
import { skillLibrary } from 'axiomancer-mechanics';

import {
    COMBAT_SKILLS,
    getCombatSkillById,
    type CombatSkill,
} from '@/state/selectors/combat-skills';

describe('COMBAT_SKILLS: library coverage', () => {
    it('mirrors the engine library length 1:1', () => {
        expect(COMBAT_SKILLS).toHaveLength(skillLibrary.length);
    });

    it('every entry has a non-empty id, name, description', () => {
        for (const skill of COMBAT_SKILLS) {
            expect(skill.id.length).toBeGreaterThan(0);
            expect(skill.name.length).toBeGreaterThan(0);
            expect(skill.description.length).toBeGreaterThan(0);
        }
    });

    it('every name is uppercase', () => {
        for (const skill of COMBAT_SKILLS) {
            expect(skill.name).toBe(skill.name.toUpperCase());
        }
    });

    it('every category is a known SkillCategoryKey literal', () => {
        const known: ReadonlyArray<CombatSkill['category']> = ['fallacy', 'paradox'];
        for (const skill of COMBAT_SKILLS) {
            expect(known).toContain(skill.category);
        }
    });

    it('every stance is a known StanceKey literal', () => {
        const known: ReadonlyArray<CombatSkill['stance']> = ['heart', 'body', 'mind'];
        for (const skill of COMBAT_SKILLS) {
            expect(known).toContain(skill.stance);
        }
    });
});

describe('getCombatSkillById: resolution', () => {
    it('returns the mapped row for a known engine id', () => {
        const first = COMBAT_SKILLS[0];
        const found = getCombatSkillById(first.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(first.id);
        expect(found!.name).toBe(first.name);
    });

    it('returns null for an unknown id (e.g. legacy pre-Phase-16 ids)', () => {
        expect(getCombatSkillById('not-a-real-skill')).toBeNull();
        // Legacy mock id from the fixture that did NOT match an engine id.
        expect(getCombatSkillById('ad-hominem')).toBeNull();
    });

    it('round-trips: every COMBAT_SKILLS entry resolves via id', () => {
        for (const skill of COMBAT_SKILLS) {
            const resolved = getCombatSkillById(skill.id);
            expect(resolved).toEqual(skill);
        }
    });
});
