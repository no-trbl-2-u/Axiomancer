/**
 * Unit tests — the deck presets.
 *
 * The card purge (P1, 2026-09-27; D36) repealed the three campaign presets,
 * their lineage (removal story, valve seats) and the 5/5/5 aspect-thirds law
 * with the cards they dealt; those tests were deleted with them. What
 * survives is the preset API itself — one preset, the grey deck every fresh
 * run opens with — and the laws that still bind any preset a guided session
 * seats here again: every card resolves, no curse, the builder appends no
 * escape-hatch card, and a preset deck drives a real encounter end to end.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from '../combat.starter-deck-presets';
import { STARTING_CARD_IDS } from '../combat.rewards';
import { getCardById } from '../../Cards/cards.library';
import { initializeCombatEncounter, rollEncounterDice } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';

describe('deck presets — the grey deck', () => {
    it('exactly the grey preset, and the roster helpers agree with the table', () => {
        expect([...COMBAT_DECK_PRESET_ORDER]).toEqual(['grey']);
        expect(COMBAT_DECK_PRESET_ORDER.length).toBe(Object.keys(COMBAT_DECK_PRESETS).length);
        expect(listDeckPresets().map(p => p.id)).toEqual([...COMBAT_DECK_PRESET_ORDER]);
        expect(getDeckPreset('grey')!.cardIds).toEqual([...STARTING_CARD_IDS]);
        expect(getDeckPreset('threadbare')).toBeUndefined();
    });

    it('every preset card resolves in the library and is never a curse', () => {
        for (const preset of listDeckPresets()) {
            for (const cardId of preset.cardIds) {
                const card = getCardById(cardId);
                expect(card, `${preset.id}: ${cardId}`).toBeDefined();
                expect(card!.theme, `${preset.id}: ${cardId} is enemy-injected junk`).not.toBe('curse');
            }
        }
    });

    it('buildPresetDeck is the recipe with no escape-hatch card; unknown ids build nothing', () => {
        for (const preset of listDeckPresets()) {
            const deck = buildPresetDeck(preset.id);
            expect(deck).toEqual([...preset.cardIds]);
            expect(deck).not.toContain('retreat');
        }
        expect(buildPresetDeck('unknown-preset')).toEqual([]);
    });

    it('a preset deck drives a real encounter end to end', () => {
        const player = deepClone(Player);
        player.knownCards = [...new Set(getDeckPreset('grey')!.cardIds)];
        const enemy = deepClone(GraveLarva);
        let state = initializeCombatEncounter(player, enemy, buildPresetDeck('grey'));
        state = rollEncounterDice(state).state;
        expect(state.hand.length).toBeGreaterThan(0);
        expect(state.drawPile.length + state.hand.length + state.discard.length)
            .toBe(getDeckPreset('grey')!.cardIds.length);
    });
});
