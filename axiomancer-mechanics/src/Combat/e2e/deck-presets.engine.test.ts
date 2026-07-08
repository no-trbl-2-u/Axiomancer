/**
 * Unit tests — the TEN themed preset decks (spec 32 v3 §8).
 *
 * Verifies every preset is well-formed against the owner recipe (4 copies × 2
 * unique commons, 2 copies × 2 unique uncommons, 1 copy × 3 unique rares —
 * rare spell + enchantment + disenchant = 15 cards), themes are strictly
 * self-contained (zero cross-preset card overlap), each deck leans on the
 * lever it advertises, the builder appends no escape-hatch card (no
 * in-combat retreat exists), and a preset deck drives a real encounter end
 * to end.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from '../combat.deck-presets';
import { SYNTHETIC_CARD_IDS, classifyVerbClass } from '../combat.cards';
import { getCardById } from '../../Cards/cards.library';
import { rankToRarity } from '../../Cards/types';
import { lookupEffect } from '../../Effects';
import { initializeCombatEncounter, rollEncounterDice } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { CombatVerbClass } from '../combat.encounter.types';

/** The verb-classes that count toward each coarse focus lever (v3 map). */
const FOCUS_CLASSES: Record<string, CombatVerbClass[]> = {
    dot: ['direct-dot'],
    control: ['direct-control', 'stat-debuff'],
    utility: ['buff-self', 'defend', 'befriend'],
    damage: ['direct-damage'],
    // Tithe's identity: churn short afflictions into Souls, then REAP —
    // fast DoT/exposure application feeding a direct-damage payoff.
    'rush-execute': ['direct-dot', 'stat-debuff', 'direct-damage'],
};

function verbClassOf(cardId: string): CombatVerbClass | null {
    const skill = getCardById(cardId);
    return skill ? classifyVerbClass(skill, lookupEffect).verbClass : null;
}

const SPEC_PRESET_IDS = [
    'erosion', 'oratory', 'foundry', 'penitent', 'standstill',
    'augury', 'tithe', 'grace', 'bastion', 'refrain',
];

describe('preset combat decks (spec 32 v3 §8)', () => {
    it('exactly the ten spec preset ids, in spec table order', () => {
        expect([...COMBAT_DECK_PRESET_ORDER]).toEqual(SPEC_PRESET_IDS);
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

    it('every preset follows the owner recipe: C1×4 C2×4 U1×2 U2×2 + 3 rares (spell/enchant/disenchant)', () => {
        for (const preset of listDeckPresets()) {
            expect(preset.cardIds.length, preset.id).toBe(15);
            const counts = new Map<string, number>();
            for (const id of preset.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
            expect(counts.size, `${preset.id} must carry 7 uniques`).toBe(7);

            const byRarity = { common: [] as string[], uncommon: [] as string[], rare: [] as string[] };
            for (const [id, n] of counts) {
                const skill = getCardById(id)!;
                const rarity = rankToRarity(skill.rank);
                byRarity[rarity].push(id);
                const expectedCopies = rarity === 'common' ? 4 : rarity === 'uncommon' ? 2 : 1;
                expect(n, `${preset.id} → ${id} copies`).toBe(expectedCopies);
            }
            expect(byRarity.common.length, `${preset.id} commons`).toBe(2);
            expect(byRarity.uncommon.length, `${preset.id} uncommons`).toBe(2);
            expect(byRarity.rare.length, `${preset.id} rares`).toBe(3);

            // The three rares: one spell finisher, one enchantment, one disenchant.
            const rareTypes = byRarity.rare.map(id => getCardById(id)!.cardType).sort();
            expect(rareTypes, preset.id).toEqual(['disenchant', 'enchantment', 'spell']);
        }
    });

    it('themes are strictly self-contained — zero cross-preset card overlap', () => {
        const seen = new Map<string, string>();
        for (const preset of listDeckPresets()) {
            for (const id of new Set(preset.cardIds)) {
                expect(seen.has(id), `${id} appears in both ${seen.get(id)} and ${preset.id}`).toBe(false);
                seen.set(id, preset.id);
            }
        }
        // 10 presets × 7 uniques = the whole 70-card library.
        expect(seen.size).toBe(70);
    });

    it('a focused preset carries at least a full common playset on the lever it advertises', () => {
        for (const preset of listDeckPresets()) {
            if (preset.focus === 'balanced') continue; // balanced is intentionally even
            const wanted = FOCUS_CLASSES[preset.focus];
            const onFocus = preset.cardIds.filter(id => {
                const vc = verbClassOf(id);
                return vc !== null && wanted.includes(vc);
            });
            expect(onFocus.length, `${preset.id} only ${onFocus.length} on-focus cards`)
                .toBeGreaterThanOrEqual(4);
        }
    });

    it('buildPresetDeck appends no escape-hatch card (no in-combat retreat exists)', () => {
        expect(SYNTHETIC_CARD_IDS.length).toBe(0);
        for (const id of COMBAT_DECK_PRESET_ORDER) {
            const deck = buildPresetDeck(id);
            // 15 recipe cards, no synthetic baseline.
            expect(deck.length).toBe(15);
        }
    });

    it('buildPresetDeck returns [] for an unknown preset id', () => {
        expect(buildPresetDeck('no-such-preset')).toEqual([]);
        expect(getDeckPreset('no-such-preset')).toBeUndefined();
    });

    it('a preset deck drives a real encounter (opening hand drawn from it)', () => {
        const player = deepClone(Player);
        const enemy = deepClone(GraveLarva);
        const deck = buildPresetDeck('erosion');
        let state = initializeCombatEncounter(player, enemy, deck, 7);
        expect(state.deck).toEqual(deck);
        expect(state.hand.length).toBeGreaterThan(0);
        // Every dealt card belongs to the preset deck.
        for (const h of state.hand) expect(deck).toContain(h.cardId);
        state = rollEncounterDice(state).state;
        expect(state.phase).toBe('phase-play');
    });
});
