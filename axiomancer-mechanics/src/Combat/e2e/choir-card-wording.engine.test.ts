/**
 * Card-face projection smoke over the seated canon.
 *
 * The Pale Choir wording pins (PLEA, SOUL, REAP, QUARTER, the vigil reflect
 * cards) went with the card purge (P1, 2026-09-27): those cards no longer
 * exist. What survives is the projection smoke — every card a preset seats
 * projects to a face — so a seated card can never be unprojectable.
 */
import { describe, expect, it } from 'vitest';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';
import { buildPresetDeck, COMBAT_DECK_PRESET_ORDER } from '../combat.starter-deck-presets';

/** Every unique card the presets seat, derived from the presets themselves
 *  rather than a hand-copied list. */
const PRESET_CARD_IDS = [...new Set(
    COMBAT_DECK_PRESET_ORDER.flatMap(id => buildPresetDeck(id)),
)];

describe('projection smoke — the seated canon', () => {
    it('projects every unique card the presets seat', () => {
        expect(PRESET_CARD_IDS.length).toBeGreaterThan(0);
        for (const cardId of PRESET_CARD_IDS) {
            expect(toCombatCard(cardId, getCardById, lookupEffect), cardId).not.toBeNull();
        }
    });
});
