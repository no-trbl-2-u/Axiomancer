/**
 * Unit tests — the TEN themed preset decks (spec 32 v3 §8).
 *
 * Verifies every preset is well-formed against the owner recipe (4 copies × 2
 * unique commons, 2 copies × 2 unique uncommons, 1 copy × 3 unique rares —
 * rare spell + enchantment + disenchant = 15 cards), the 5/5/5 color law
 * (spec 32 §12 item 9: exactly 5 body / 5 mind / 5 heart per recipe), that
 * cross-preset overlap and off-theme cards are exactly the documented
 * color-law borrows, each deck leans on the lever it advertises, the builder
 * appends no escape-hatch card (no in-combat retreat exists), and a preset
 * deck drives a real encounter end to end.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER, PRESET_COLOR_BORROWS,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from '../combat.deck-presets';
import { classifyVerbClass } from '../combat.cards';
import { cardLibrary, getCardById } from '../../Cards/cards.library';
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
    const card = getCardById(cardId);
    return card ? classifyVerbClass(card, lookupEffect).verbClass : null;
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

    it('every card id in every preset resolves to a real card', () => {
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
                const card = getCardById(id)!;
                const rarity = rankToRarity(card.rank);
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

    // ── THE 5/5/5 COLOR LAW (owner directive 2026-07-12; spec 32 §12 item 9) ──

    it('every preset carries exactly 5 body / 5 mind / 5 heart cards', () => {
        for (const preset of listDeckPresets()) {
            const counts = { body: 0, mind: 0, heart: 0 };
            for (const id of preset.cardIds) {
                counts[getCardById(id)!.philosophicalAspect] += 1;
            }
            expect(counts, `${preset.id} must be 5/5/5 by philosophicalAspect`)
                .toEqual({ body: 5, mind: 5, heart: 5 });
        }
    });

    it('off-theme cards in a preset are exactly its documented color-law borrows', () => {
        for (const preset of listDeckPresets()) {
            const offTheme = [...new Set(preset.cardIds)]
                .filter(id => getCardById(id)!.theme !== preset.theme)
                .sort();
            const documented = [...(PRESET_COLOR_BORROWS[preset.id] ?? [])].sort();
            expect(offTheme, `${preset.id} off-theme cards must match PRESET_COLOR_BORROWS`)
                .toEqual(documented);
        }
    });

    it('cross-preset overlap exists only through documented borrows; every other card sits in one preset', () => {
        const seats = new Map<string, string[]>();
        for (const preset of listDeckPresets()) {
            for (const id of new Set(preset.cardIds)) {
                seats.set(id, [...(seats.get(id) ?? []), preset.id]);
            }
        }
        const allBorrows = new Set(Object.values(PRESET_COLOR_BORROWS).flat());
        for (const [id, presetIds] of seats) {
            if (presetIds.length > 1) {
                expect(allBorrows.has(id), `${id} overlaps (${presetIds.join(', ')}) without being a documented borrow`).toBe(true);
            }
        }
    });

    it('the color law squeezes exactly the documented ten cards out of the starter pool (reward-only)', () => {
        // These 10 cards lost every recipe seat to the 5/5/5 partition (each
        // theme's colors cannot all fit; the borrows displace the weakest
        // standalone cards). They REMAIN in the 70-card reward pool — this is
        // the pinned, intentional consequence, not an accident.
        const REWARD_ONLY = [
            'achilles-and-the-tortoise', // control m-ench — rainbow law forces it out of standstill (rs is mind)
            'ad-nauseam',                // echo m-unc — refrain's uncommons must go body
            'captive-audience',          // peroration h-dis — premise-gated, no premise deck has a heart dis slot
            'entropy-tax',               // forge m-dis — foundry's mind slots are full (anvil keeps the ench seat)
            'fated-course',              // oracle m-dis — augury's rainbow needs a body dis
            'heart-of-the-matter',       // charm h-rs — grace keeps soft-word + irresistible on the heart budget
            'memento-mori',              // harvest m-common — tithe's commons must go body+heart
            'practiced-cadence',         // peroration h-ench — oratory's rainbow needs a body ench
            'straw-mans-jab',            // affliction b-common — 8 body commons, 7 seats; erosion's heart slot displaced it
            'the-tithe',                 // harvest m-dis — tithe's rainbow needs a heart dis
        ];
        const seated = new Set<string>();
        for (const preset of listDeckPresets()) for (const id of preset.cardIds) seated.add(id);
        const actual = cardLibrary.map(c => c.id).filter(id => !seated.has(id)).sort();
        expect(actual).toEqual([...REWARD_ONLY].sort());
        // And the seated set + reward-only set is the whole library.
        expect(seated.size + actual.length).toBe(70);
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
