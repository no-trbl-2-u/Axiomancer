/**
 * Card-face projection smoke over the seated canon.
 *
 * The Pale Choir wording pins (PLEA, SOUL, REAP, QUARTER, the vigil reflect
 * cards) went with the card purge (P1, 2026-09-27): those cards no longer
 * exist. What survives is the projection smoke — every card the grey deck
 * seats projects to a face — so a seated card can never be unprojectable.
 */
import { describe, expect, it } from 'vitest';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';
import { STARTING_CARD_IDS } from '../combat.rewards';

/** Every unique card the grey deck seats, derived from the deck itself
 *  rather than a hand-copied list. */
const PRESET_CARD_IDS = [...new Set(STARTING_CARD_IDS)];

describe('projection smoke — the seated canon', () => {
    it('projects every unique card the grey deck seats', () => {
        expect(PRESET_CARD_IDS.length).toBeGreaterThan(0);
        for (const cardId of PRESET_CARD_IDS) {
            expect(toCombatCard(cardId, getCardById, lookupEffect), cardId).not.toBeNull();
        }
    });
});
