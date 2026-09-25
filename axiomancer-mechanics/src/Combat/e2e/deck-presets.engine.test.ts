/**
 * Unit tests — the CAMPAIGN presets.
 *
 * The 18/30/45 size pins, the ≤4-copies MTG rule, and the LINEAGE multiset
 * equality assertion were repealed 2026-09-02 (big-numbers overhaul §3 L19,
 * §10) — preset sizes are open. What survives (§2.1, the ONLY kept preset
 * law): every preset splits into exact aspect thirds by
 * `philosophicalAspect`, no curse cards in any preset, valves seat
 * same-aspect in the built deck, the builder appends no escape-hatch
 * card, and a preset deck drives a real encounter end to end.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    PRESET_DICE_VALVES, buildUpgradeableDicePresetDeck,
    listDeckPresets, getDeckPreset, buildPresetDeck,
    PILGRIM_REMOVED, APOSTATE_REMOVED,
} from '../combat.starter-deck-presets';
import { getCardById } from '../../Cards/cards.library';
import { initializeCombatEncounter, rollEncounterDice } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';

const SPEC_PRESET_IDS = ['threadbare', 'pilgrim', 'apostate'];

/** Multiset view of a card-id list. */
function counts(ids: readonly string[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
}

describe('campaign presets — the evolving deck', () => {
    it('exactly the three campaign presets, in campaign order', () => {
        expect([...COMBAT_DECK_PRESET_ORDER]).toEqual(SPEC_PRESET_IDS);
        expect(COMBAT_DECK_PRESET_ORDER.length).toBe(Object.keys(COMBAT_DECK_PRESETS).length);
        for (const id of COMBAT_DECK_PRESET_ORDER) expect(COMBAT_DECK_PRESETS[id]).toBeDefined();
        expect(listDeckPresets().map(p => p.id)).toEqual([...COMBAT_DECK_PRESET_ORDER]);
        expect(listDeckPresets().map(p => p.stage)).toEqual(['early', 'mid', 'late']);
    });

    it('every preset card resolves in the library and is never a curse', () => {
        for (const id of SPEC_PRESET_IDS) {
            for (const cardId of getDeckPreset(id)!.cardIds) {
                const card = getCardById(cardId);
                expect(card, `${id}: ${cardId}`).toBeDefined();
                expect(card!.theme, `${id}: ${cardId} is enemy-injected junk`).not.toBe('curse');
            }
        }
    });

    it('exact aspect thirds per preset (the generalized color law)', () => {
        for (const id of SPEC_PRESET_IDS) {
            const preset = getDeckPreset(id)!;
            const byAspect = { body: 0, mind: 0, heart: 0 };
            for (const cardId of preset.cardIds) {
                const aspect = getCardById(cardId)!.philosophicalAspect;
                // Phase 104 — the grey office is starter-only; a preset carrying
                // one would be a real regression, not a type-narrowing formality.
                expect(aspect, `${id}: ${cardId} is a grey card in a preset`).not.toBe('any');
                byAspect[aspect as 'body' | 'mind' | 'heart'] += 1;
            }
            const third = preset.cardIds.length / 3;
            expect(byAspect, id).toEqual({ body: third, mind: third, heart: third });
        }
    });

    it('almost none of the Threadbare Office survives into the Apostate\'s Canon', () => {
        const starters = new Set(getDeckPreset('threadbare')!.cardIds);
        const apostate = getDeckPreset('apostate')!.cardIds;
        const survivors = apostate.filter(id => starters.has(id));
        // The heirloom psalter, one spadeful, and the thumbprick oaths — 4 of 45.
        expect(survivors.length).toBeLessThanOrEqual(5);
        expect(survivors).toContain('grandmothers-psalter');
    });

    it('the removal story is real: each stage cuts starters, never rewards', () => {
        const starters = new Set(getDeckPreset('threadbare')!.cardIds);
        for (const removed of [PILGRIM_REMOVED, APOSTATE_REMOVED]) {
            for (const id of Object.keys(removed)) {
                expect(starters.has(id), `${id} removed but never was a starter`).toBe(true);
            }
        }
    });

    it('buildPresetDeck is the valve-seated recipe with no escape-hatch card', () => {
        for (const id of SPEC_PRESET_IDS) {
            const deck = buildPresetDeck(id);
            expect(deck).toEqual(buildUpgradeableDicePresetDeck(id));
            expect(deck).not.toContain('retreat');
        }
        expect(buildPresetDeck('unknown-preset')).toEqual([]);
    });

    it('D8 valve law: every preset seats a same-aspect dice valve in the built deck', () => {
        for (const id of SPEC_PRESET_IDS) {
            const seat = PRESET_DICE_VALVES[id];
            expect(seat, id).toBeDefined();
            const valve = getCardById(seat.valveId)!;
            const source = getCardById(seat.replacesId)!;
            expect(valve.tags).toEqual(expect.arrayContaining(['dice', 'valve']));
            expect(valve.philosophicalAspect).toBe(source.philosophicalAspect);
            const deck = buildUpgradeableDicePresetDeck(id);
            expect(deck.length).toBe(getDeckPreset(id)!.cardIds.length);
            expect(deck.filter(c => c === seat.valveId)).toHaveLength(1);
            // One instance swapped: the source loses exactly one copy.
            const recipe = counts(getDeckPreset(id)!.cardIds);
            const built = counts(deck);
            expect(built.get(seat.replacesId) ?? 0).toBe((recipe.get(seat.replacesId) ?? 0) - 1);
        }
    });

    it('the three valves cover all three aspects across the campaign', () => {
        const aspects = SPEC_PRESET_IDS
            .map(id => getCardById(PRESET_DICE_VALVES[id].valveId)!.philosophicalAspect)
            .sort();
        expect(aspects).toEqual(['body', 'heart', 'mind']);
    });

    it('a preset deck drives a real encounter end to end', () => {
        const player = deepClone(Player);
        player.knownCards = [...new Set(getDeckPreset('threadbare')!.cardIds)];
        const enemy = deepClone(GraveLarva);
        let state = initializeCombatEncounter(player, enemy, buildPresetDeck('threadbare'));
        state = rollEncounterDice(state).state;
        expect(state.hand.length).toBeGreaterThan(0);
        expect(state.drawPile.length + state.hand.length + state.discard.length)
            .toBe(getDeckPreset('threadbare')!.cardIds.length);
    });
});
