/**
 * Unit tests — preset combat decks (Spec 26b deckbuilder).
 *
 * Verifies every preset is well-formed (real cards, focus matches its dominant
 * lever, a GUARD card present), the builder appends the synthetic baseline, and a
 * preset deck drives a real encounter end to end.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from '../combat.deck-presets';
import { SYNTHETIC_CARD_IDS, classifyVerbClass } from '../combat.cards';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { initializeCombatEncounter, rollEncounterDice } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { CombatVerbClass } from '../combat.encounter.types';

/** The verb-classes that count toward each focus (a focus's "dominant lever"). */
const FOCUS_CLASSES: Record<string, CombatVerbClass[]> = {
    dot: ['direct-dot'],
    control: ['direct-control', 'stat-debuff'],
    utility: ['buff-self', 'defend', 'befriend'],
    damage: ['direct-damage'],
};

function verbClassOf(cardId: string): CombatVerbClass | null {
    const skill = getCardById(cardId);
    return skill ? classifyVerbClass(skill, lookupEffect).verbClass : null;
}

describe('preset combat decks', () => {
    it('the order list and the roster agree (no dangling ids)', () => {
        expect(COMBAT_DECK_PRESET_ORDER.length).toBe(Object.keys(COMBAT_DECK_PRESETS).length);
        for (const id of COMBAT_DECK_PRESET_ORDER) expect(COMBAT_DECK_PRESETS[id]).toBeDefined();
        expect(listDeckPresets().map(p => p.id)).toEqual([...COMBAT_DECK_PRESET_ORDER]);
    });

    it('every card id in every preset resolves to a real skill', () => {
        for (const preset of listDeckPresets()) {
            for (const id of preset.cardIds) {
                expect(getCardById(id), `${preset.id} → ${id}`).toBeDefined();
            }
        }
    });

    it('each preset carries a GUARD (defense) card so it can brace from turn one', () => {
        for (const preset of listDeckPresets()) {
            const hasGuard = preset.cardIds.some(id => verbClassOf(id) === 'defend');
            expect(hasGuard, `${preset.id} has no GUARD card`).toBe(true);
        }
    });

    it('a focused preset leans on the lever it advertises (its dominant verb-class)', () => {
        for (const preset of listDeckPresets()) {
            if (preset.focus === 'balanced') continue; // balanced is intentionally even
            const wanted = FOCUS_CLASSES[preset.focus];
            const onFocus = preset.cardIds.filter(id => {
                const vc = verbClassOf(id);
                return vc !== null && wanted.includes(vc);
            });
            // A clear plurality of the deck advances the advertised lever.
            expect(onFocus.length, `${preset.id} only ${onFocus.length} on-focus cards`)
                .toBeGreaterThanOrEqual(Math.ceil(preset.cardIds.length / 2));
        }
    });

    it('buildPresetDeck appends the synthetic baseline (Retreat) exactly once', () => {
        for (const id of COMBAT_DECK_PRESET_ORDER) {
            const deck = buildPresetDeck(id);
            for (const synth of SYNTHETIC_CARD_IDS) {
                expect(deck.filter(c => c === synth).length, `${id} → ${synth}`).toBe(1);
            }
            // The curated cards are preserved (a deck is bigger than just Retreat).
            expect(deck.length).toBeGreaterThan(SYNTHETIC_CARD_IDS.length);
        }
    });

    it('buildPresetDeck returns [] for an unknown preset id', () => {
        expect(buildPresetDeck('no-such-preset')).toEqual([]);
        expect(getDeckPreset('no-such-preset')).toBeUndefined();
    });

    it('a preset deck drives a real encounter (opening hand drawn from it)', () => {
        const player = deepClone(Player);
        const enemy = deepClone(TidepoolCrab);
        const deck = buildPresetDeck('dot-erosion');
        let state = initializeCombatEncounter(player, enemy, deck, 7);
        expect(state.deck).toEqual(deck);
        expect(state.hand.length).toBeGreaterThan(0);
        // Every dealt card belongs to the preset deck.
        for (const h of state.hand) expect(deck).toContain(h.cardId);
        state = rollEncounterDice(state).state;
        expect(state.phase).toBe('phase-play');
    });
});
