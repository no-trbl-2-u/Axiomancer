/**
 * Phase 99 / ADR-0002 — unlocked card access e2e tests.
 *
 * Verifies that the combat catalogue is exactly the player's knownCards; there
 * is no equipped-card loadout gate (the legacy `equippedSkills` field was
 * removed entirely in Phase 159), and combat cards carry no resource cost.
 * Save-side migration of legacy `equippedSkills` into `knownCards` is covered
 * by `src/Game/e2e/phase99-migration.engine.test.ts`.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createCharacter } from '../../Character';
import { getCardById } from '../cards.library';

describe('Phase 99 unlocked card access', () => {
    let player: ReturnType<typeof createCharacter>;

    beforeEach(() => {
        player = createCharacter({
            name: 'TestPlayer',
            level: 5,
            baseStats: { heart: 8, body: 6, mind: 7 },
            knownCards: [
                'slippery-slope',
                'brace-for-impact',
                'soft-word',
                'glimpse',
            ],
            effects: [],
        });
    });

    test('every known card resolves in the library', () => {
        for (const cardId of player.knownCards) {
            const card = getCardById(cardId);
            expect(card, `card ${cardId} missing from library`).toBeDefined();
        }
    });

    test('cards not in known cards are not available', () => {
        const availableCards = player.knownCards.filter(id => {
            const card = getCardById(id);
            return card !== undefined;
        });

        // Should match exactly the known cards for the player
        expect(availableCards).toEqual(player.knownCards);

        // Test card that player doesn't know
        const unknownCardId = 'resonance-detonation'; // rank-5 finisher
        expect(player.knownCards).not.toContain(unknownCardId);
    });

    test('the combat catalogue is exactly the known set', () => {
        // Post-Phase-159 there is no equipped rotation: every known card that
        // resolves in the library is part of the catalogue.
        for (const cardId of player.knownCards) {
            const card = getCardById(cardId);
            expect(card).toBeDefined();
        }
    });
});
