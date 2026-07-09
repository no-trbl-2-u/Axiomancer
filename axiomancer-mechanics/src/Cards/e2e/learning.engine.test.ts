/**
 * Hermetic e2e — card learning (revised 2026-07-08).
 *
 * Drives `getAvailableCards` and `learnCard` through the public Cards barrel.
 * No I/O, no RNG. The learning-requirement gate (level / stat / prerequisite /
 * alignment) was REMOVED 2026-07-08 — every card is learnable unconditionally,
 * so these tests assert only library membership and idempotence.
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character';
import { getAvailableCards, learnCard } from '../card.engine';
import { cardLibrary } from '../cards.library';

const buildPlayer = (knownCards: string[] = []) => createCharacter({
    name: 'Learner',
    level: 1,
    baseStats: { heart: 5, body: 5, mind: 5 },
    knownCards,
});

describe('getAvailableCards', () => {
    it('returns every library card the character does not already know', () => {
        const available = getAvailableCards(buildPlayer());
        expect(available.length).toBe(cardLibrary.length);
        expect(available.length).toBeGreaterThan(0);
    });

    it('omits already-known cards from the result', () => {
        const ch = buildPlayer(cardLibrary.map(s => s.id));
        expect(getAvailableCards(ch)).toEqual([]);
    });

    it('preserves library order so the UI list is stable', () => {
        const available = getAvailableCards(buildPlayer()).map(s => s.id);
        expect(available).toEqual(cardLibrary.map(s => s.id));
    });
});

describe('learnCard', () => {
    it('appends the id to knownCards — every card is learnable', () => {
        const ch = buildPlayer();
        const anyCard = cardLibrary[0];
        const after = learnCard(ch, anyCard.id);
        expect(after.knownCards).toContain(anyCard.id);
        expect(after.knownCards.length).toBe(ch.knownCards.length + 1);
    });

    it('is a no-op (same reference) when the card is already known', () => {
        const anyCard = cardLibrary[0];
        const ch = buildPlayer([anyCard.id]);
        expect(learnCard(ch, anyCard.id)).toBe(ch);
    });

    it('is a no-op when the card id is unknown to the library', () => {
        const ch = buildPlayer();
        expect(learnCard(ch, 'no-such-card')).toBe(ch);
    });
});
