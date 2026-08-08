/**
 * Unit tests — the CAMPAIGN presets (the Profane Canon rework, 2026-08-08).
 *
 * The three presets are snapshots of ONE deck evolving (early → mid → late).
 * Pins the rework's deck laws:
 *   - exactly three presets in campaign order (threadbare / pilgrim / apostate);
 *   - sizes 18 / 30 / 45, all under the 50-card hard cap;
 *   - exact aspect thirds per preset (every die color always live);
 *   - ≤ 4 copies of any card in any deck (the MTG copy law);
 *   - the LINEAGE LAW: each later preset equals its predecessor minus the
 *     documented removals plus the documented additions (multiset equality);
 *   - almost none of the Threadbare Office survives into the Apostate's Canon;
 *   - no curse cards in any preset; valves seat same-aspect under the dice
 *     flag; the builder appends no escape-hatch card; a preset deck drives a
 *     real encounter end to end.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER, PRESET_LINEAGE,
    PRESET_DICE_VALVES, buildUpgradeableDicePresetDeck, DECK_SIZE_HARD_CAP,
    listDeckPresets, getDeckPreset, buildPresetDeck,
    PILGRIM_REMOVED, PILGRIM_ADDED, APOSTATE_REMOVED, APOSTATE_ADDED,
} from '../combat.starter-deck-presets';
import { setUpgradeableDice, isUpgradeableDiceEnabled } from '../combat.upgradeable-dice';
import { cardLibrary, getCardById } from '../../Cards/cards.library';
import { initializeCombatEncounter, rollEncounterDice } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';

const SPEC_PRESET_IDS = ['threadbare', 'pilgrim', 'apostate'];
const EXPECTED_SIZES: Record<string, number> = { threadbare: 18, pilgrim: 30, apostate: 45 };

/** Multiset view of a card-id list. */
function counts(ids: readonly string[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
}

/** Applies a removed/added lineage step to a multiset. */
function evolve(
    base: Map<string, number>,
    removed: Record<string, number>,
    added: Record<string, number>,
): Map<string, number> {
    const next = new Map(base);
    for (const [id, n] of Object.entries(removed)) {
        const left = (next.get(id) ?? 0) - n;
        expect(left, `lineage removes more '${id}' than the predecessor holds`).toBeGreaterThanOrEqual(0);
        if (left === 0) next.delete(id); else next.set(id, left);
    }
    for (const [id, n] of Object.entries(added)) next.set(id, (next.get(id) ?? 0) + n);
    return next;
}

describe('campaign presets — the evolving deck', () => {
    it('exactly the three campaign presets, in campaign order', () => {
        expect([...COMBAT_DECK_PRESET_ORDER]).toEqual(SPEC_PRESET_IDS);
        expect(COMBAT_DECK_PRESET_ORDER.length).toBe(Object.keys(COMBAT_DECK_PRESETS).length);
        for (const id of COMBAT_DECK_PRESET_ORDER) expect(COMBAT_DECK_PRESETS[id]).toBeDefined();
        expect(listDeckPresets().map(p => p.id)).toEqual([...COMBAT_DECK_PRESET_ORDER]);
        expect(listDeckPresets().map(p => p.stage)).toEqual(['early', 'mid', 'late']);
    });

    it('sizes 18 / 30 / 45, all within the 50-card hard cap', () => {
        for (const id of SPEC_PRESET_IDS) {
            const preset = getDeckPreset(id)!;
            expect(preset.cardIds.length, id).toBe(EXPECTED_SIZES[id]);
            expect(preset.cardIds.length).toBeLessThanOrEqual(DECK_SIZE_HARD_CAP);
        }
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
                byAspect[getCardById(cardId)!.philosophicalAspect] += 1;
            }
            const third = preset.cardIds.length / 3;
            expect(byAspect, id).toEqual({ body: third, mind: third, heart: third });
        }
    });

    it('no card exceeds 4 copies in any preset (the MTG copy law)', () => {
        for (const id of SPEC_PRESET_IDS) {
            for (const [cardId, n] of counts(getDeckPreset(id)!.cardIds)) {
                expect(n, `${id}: ${cardId}`).toBeLessThanOrEqual(4);
            }
        }
    });

    it('THE LINEAGE LAW: pilgrim and apostate are exact evolutions of their predecessors', () => {
        const threadbare = counts(getDeckPreset('threadbare')!.cardIds);
        const pilgrim = counts(getDeckPreset('pilgrim')!.cardIds);
        const apostate = counts(getDeckPreset('apostate')!.cardIds);
        expect(pilgrim).toEqual(evolve(threadbare, PILGRIM_REMOVED, PILGRIM_ADDED));
        expect(apostate).toEqual(evolve(pilgrim, APOSTATE_REMOVED, APOSTATE_ADDED));
        // The exported lineage doc agrees with the deck data.
        expect(counts(getDeckPreset('threadbare')!.cardIds))
            .toEqual(counts(Object.entries(PRESET_LINEAGE.threadbare.base)
                .flatMap(([id, n]) => Array.from({ length: n }, () => id))));
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

    it('buildPresetDeck returns the recipe with no escape-hatch card (flag off)', () => {
        const prior = isUpgradeableDiceEnabled();
        setUpgradeableDice(false);
        try {
            for (const id of SPEC_PRESET_IDS) {
                const deck = buildPresetDeck(id);
                expect(deck).toEqual([...getDeckPreset(id)!.cardIds]);
                expect(deck).not.toContain('retreat');
            }
            expect(buildPresetDeck('unknown-preset')).toEqual([]);
        } finally {
            setUpgradeableDice(prior);
        }
    });

    it('D8 valve law: every preset seats a same-aspect dice valve under the flag', () => {
        for (const id of SPEC_PRESET_IDS) {
            const seat = PRESET_DICE_VALVES[id];
            expect(seat, id).toBeDefined();
            const valve = getCardById(seat.valveId)!;
            const source = getCardById(seat.replacesId)!;
            expect(valve.tags).toEqual(expect.arrayContaining(['dice', 'valve']));
            expect(valve.philosophicalAspect).toBe(source.philosophicalAspect);
            const deck = buildUpgradeableDicePresetDeck(id);
            expect(deck.length).toBe(EXPECTED_SIZES[id]);
            expect(deck.filter(c => c === seat.valveId)).toHaveLength(1);
            // One instance swapped: the source loses exactly one copy.
            const flagOff = counts(getDeckPreset(id)!.cardIds);
            const flagOn = counts(deck);
            expect(flagOn.get(seat.replacesId) ?? 0).toBe((flagOff.get(seat.replacesId) ?? 0) - 1);
        }
    });

    it('the three valves cover all three aspects across the campaign', () => {
        const aspects = SPEC_PRESET_IDS
            .map(id => getCardById(PRESET_DICE_VALVES[id].valveId)!.philosophicalAspect)
            .sort();
        expect(aspects).toEqual(['body', 'heart', 'mind']);
    });

    it('the library is exactly the profane canon: 57 cards, unique ids', () => {
        expect(cardLibrary.length).toBe(57);
        expect(new Set(cardLibrary.map(c => c.id)).size).toBe(57);
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
