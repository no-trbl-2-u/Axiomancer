/**
 * Hermetic e2e — Phase 30 unit 3 (Spec 06 Q7).
 *
 * Drives the LEARN_SKILL action through the public game-store surface
 * to verify the reducer + store wiring. The underlying eligibility
 * filter (`getAvailableSkills`, `meetsLearningRequirement`) is tested
 * by `src/Cards/e2e/learning.engine.test.ts`; this suite focuses on
 * the action-level path (already-known no-op, eligible-learn appends,
 * requirement-blocked no-op).
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character';
import { createGameStore } from '../store';
import { createNewGameState } from '../game.reducer';
import { nullAdapter } from '../persistence/null.adapter';
import { cardLibrary } from '../../Cards/cards.library';

function buildStore(level: number, knownSkills: string[] = []) {
    const player = createCharacter({
        name: 'Learner',
        level,
        baseStats: { heart: 5, body: 5, mind: 5 },
        knownSkills,
    });
    const state = { ...createNewGameState(), player };
    return createGameStore(nullAdapter, state);
}

describe('LEARN_SKILL action — Phase 30 unit 3', () => {
    it('appends an eligible skill id to knownSkills', () => {
        const t1 = cardLibrary.find(s => s.tier === 1)!;
        const store = buildStore(1, []);
        const before = store.getState().player.knownSkills.length;
        store.getState().learnSkill(t1.id);
        const after = store.getState().player.knownSkills;
        expect(after).toContain(t1.id);
        expect(after.length).toBe(before + 1);
    });

    it('is a no-op when the skill is already known', () => {
        const t1 = cardLibrary.find(s => s.tier === 1)!;
        const store = buildStore(1, [t1.id]);
        const before = store.getState().player.knownSkills.slice();
        store.getState().learnSkill(t1.id);
        const after = store.getState().player.knownSkills;
        expect(after).toEqual(before);
    });

    it('is a no-op when the learning requirement is not met', () => {
        // T3 default level minimum is 10; level-5 character is below the gate.
        const t3 = cardLibrary.find(s => s.tier === 3)!;
        const store = buildStore(5, []);
        const before = store.getState().player.knownSkills.slice();
        store.getState().learnSkill(t3.id);
        const after = store.getState().player.knownSkills;
        expect(after).toEqual(before);
        expect(after).not.toContain(t3.id);
    });

    it('is a no-op for an unknown skill id', () => {
        const store = buildStore(15, []);
        const before = store.getState().player.knownSkills.slice();
        store.getState().learnSkill('no-such-skill');
        expect(store.getState().player.knownSkills).toEqual(before);
    });
});
