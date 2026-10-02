/**
 * Hermetic engine test — the v31 → v32 hop: the hazard deck reset.
 *
 * The hazard deck is the prototype's ten cards and there is no reward-card
 * pool. An acquired card
 * rides the save as `hazard-card:<id>:<n>`; the hop drops every one whose
 * card is gone and keeps the core cards, CRACK and every other flag.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { HAZARD_CRACK_CARD, HAZARD_DECK } from '../../World/Hazard/hazard.content';
import { decodeAcquiredCards } from '../../World/Hazard/hazard.deck-flags';
import type { GameState } from '../types';

const KEPT_FLAGS = [
    'combat-tutorial-done',
    'hazard-card:grip:1',
    'hazard-card:crack:1',
    'hazard-scar:5',
    'hazard-card:oath:1',
    'hazard-card:grip:2',
];

/** A v31 save holding deleted reward cards and starters beside kept ones. */
function v31WithHazardDeck(): Record<string, unknown> {
    const fresh = createNewGameState({ startMap: 'breakwater' });
    const flags = [
        'combat-tutorial-done',
        'hazard-card:grip:1',
        'hazard-card:r_pivot:1',
        'hazard-card:crack:1',
        'hazard-card:x_shoulder:1',
        'hazard-scar:5',
        'hazard-card:oath:1',
        'hazard-card:steadied:1',
        'hazard-card:r_pivot:2',
        'hazard-card:grip:2',
    ];
    return { ...fresh, flags, version: 31 };
}

const hop32 = (raw: Record<string, unknown>): GameState => migrate(raw, 31, 32);

describe('migrate v31 → v32 (THE REVAMP R6b / D52: the minimal hazard deck)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(32);
        expect(hop32(v31WithHazardDeck()).version).toBe(32);
    });

    it('drops deleted deck cards and keeps core cards, CRACK and other flags in order', () => {
        expect(hop32(v31WithHazardDeck()).flags).toEqual(KEPT_FLAGS);
    });

    it('leaves only cards the live deck can resolve', () => {
        const live = new Set([...HAZARD_DECK.map(c => c.id), HAZARD_CRACK_CARD.id]);
        for (const id of decodeAcquiredCards(hop32(v31WithHazardDeck()).flags)) {
            expect(live.has(id)).toBe(true);
        }
    });

    it('is idempotent', () => {
        const once = hop32(v31WithHazardDeck());
        const twice = migrate({ ...once, version: 31 } as unknown as Record<string, unknown>, 31, 32);
        expect(twice.flags).toEqual(once.flags);
    });

    it('chains from v30', () => {
        const migrated = migrate({ ...v31WithHazardDeck(), version: 30 }, 30, 32);
        expect(migrated.flags).toEqual(KEPT_FLAGS);
    });
});
