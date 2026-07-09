/**
 * Hermetic e2e — Phase 30 unit 3 (Spec 06 Q7).
 *
 * Drives the LEARN_CARD action through the public game-store surface
 * to verify the reducer + store wiring. The underlying eligibility
 * filter (`getAvailableCards`, `meetsLearningRequirement`) is tested
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

function buildStore(level: number, knownCards: string[] = []) {
    const player = createCharacter({
        name: 'Learner',
        level,
        baseStats: { heart: 5, body: 5, mind: 5 },
        knownCards,
    });
    const state = { ...createNewGameState(), player };
    return createGameStore(nullAdapter, state);
}

describe('LEARN_CARD action — Phase 30 unit 3', () => {
    it('appends an eligible skill id to knownCards', () => {
        const t1 = cardLibrary.find(s => s.rank === 1)!; // Doxa cards gate at level 1
        const store = buildStore(1, []);
        const before = store.getState().player.knownCards.length;
        store.getState().learnCard(t1.id);
        const after = store.getState().player.knownCards;
        expect(after).toContain(t1.id);
        expect(after.length).toBe(before + 1);
    });

    it('is a no-op when the skill is already known', () => {
        const t1 = cardLibrary.find(s => s.rank === 1)!;
        const store = buildStore(1, [t1.id]);
        const before = store.getState().player.knownCards.slice();
        store.getState().learnCard(t1.id);
        const after = store.getState().player.knownCards;
        expect(after).toEqual(before);
    });

    it('is a no-op when the learning requirement is not met', () => {
        // Axiom (rank 5) cards gate at level 10; level-5 character is below it.
        const t3 = cardLibrary.find(s => s.rank === 5)!;
        const store = buildStore(5, []);
        const before = store.getState().player.knownCards.slice();
        store.getState().learnCard(t3.id);
        const after = store.getState().player.knownCards;
        expect(after).toEqual(before);
        expect(after).not.toContain(t3.id);
    });

    it('is a no-op for an unknown skill id', () => {
        const store = buildStore(15, []);
        const before = store.getState().player.knownCards.slice();
        store.getState().learnCard('no-such-skill');
        expect(store.getState().player.knownCards).toEqual(before);
    });
});
