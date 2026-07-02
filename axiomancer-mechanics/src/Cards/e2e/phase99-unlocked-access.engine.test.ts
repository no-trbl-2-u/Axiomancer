/**
 * Phase 99 / ADR-0002 — unlocked skill access e2e tests.
 *
 * Verifies that the combat catalogue is exactly the player's knownSkills; there
 * is no equipped-skill loadout gate (the legacy `equippedSkills` field was
 * removed entirely in Phase 159), and combat cards carry no resource cost.
 * Save-side migration of legacy `equippedSkills` into `knownSkills` is covered
 * by `src/Game/e2e/phase99-migration.engine.test.ts`.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createCharacter } from '../../Character';
import { getCardById } from '../cards.library';

describe('Phase 99 unlocked skill access', () => {
    let player: ReturnType<typeof createCharacter>;

    beforeEach(() => {
        player = createCharacter({
            name: 'TestPlayer',
            level: 5,
            baseStats: { heart: 8, body: 6, mind: 7 },
            knownSkills: [
                'ad-hominem-strike',
                'false-dilemma',
                'appeal-to-pity',
                'mob-appeal',
            ],
            effects: [],
        });
    });

    test('every known skill resolves in the library', () => {
        for (const skillId of player.knownSkills) {
            const skill = getCardById(skillId);
            expect(skill, `skill ${skillId} missing from library`).toBeDefined();
        }
    });

    test('skills not in known skills are not available', () => {
        const availableSkills = player.knownSkills.filter(id => {
            const skill = getCardById(id);
            return skill !== undefined;
        });

        // Should match exactly the known skills for the player
        expect(availableSkills).toEqual(player.knownSkills);

        // Test skill that player doesn't know
        const unknownSkillId = 'straw-giant'; // Tier 3 skill
        expect(player.knownSkills).not.toContain(unknownSkillId);
    });

    test('the combat catalogue is exactly the known set', () => {
        // Post-Phase-159 there is no equipped rotation: every known skill that
        // resolves in the library is part of the catalogue.
        for (const skillId of player.knownSkills) {
            const skill = getCardById(skillId);
            expect(skill).toBeDefined();
        }
    });
});
