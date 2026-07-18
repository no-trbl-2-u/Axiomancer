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
    PRESET_DICE_VALVES, buildUpgradeableDicePresetDeck,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from '../combat.starter-deck-presets';
import { setUpgradeableDice, isUpgradeableDiceEnabled } from '../combat.upgradeable-dice';
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

    it('exactly the ten dice valves sit outside the flag-off starter pool (flag-on-seated)', () => {
        // Phase D8 ten-in/ten-out: the old reward-only ten (zero plays in
        // 345,600 measured encounters — see the 2026-07-18 metrics
        // accumulation) were retired from the library, and the ten promoted
        // dice valves took their place. Valves are seated ONLY in the flag-on
        // derived decks, so from the flag-off recipe truth they are the
        // library's unseated set — the pinned, intentional consequence.
        const REWARD_ONLY = [
            'bank-the-yield',      // harvest h-unc — tithe's flag-on valve
            'bleed-for-it',        // akrasia b-unc — penitent's flag-on valve
            'break-the-tempo',     // control m-unc — standstill's flag-on valve
            'change-of-heart',     // charm h-unc — grace's flag-on valve
            'forge-masters-stamp', // forge m-ench — foundry's flag-on valve
            'hold-the-line',       // bulwark b-common — bastion's flag-on valve
            'recurring-symptom',   // affliction b-unc — erosion's flag-on valve
            'restate-the-point',   // peroration h-unc — oratory's flag-on valve
            'second-sight',        // oracle m-unc — augury's flag-on valve
            'second-take',         // echo m-common — refrain's flag-on valve
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

    // ── PHASE D8 — the flag-on dice-valve law (spec 33 §4 valve 3) ──────────
    // Under Upgradeable Dice every preset's built deck is "14 inherited cards
    // + one singleton valve": exactly one same-aspect card INSTANCE replaced
    // by the theme's dice-interaction card. Flag-off decks stay byte-identical
    // to their pre-D8 snapshots (pinned below), and the curated library stays
    // exactly 70 through the ten-in/ten-out promotion ledger.

    /** The pre-D8 flag-off recipes, pinned byte-for-byte. */
    const FLAG_OFF_SNAPSHOT: Record<string, string[]> = {
        erosion: [
            'slippery-slope', 'slippery-slope', 'slippery-slope', 'slippery-slope',
            'opening-statement', 'opening-statement', 'opening-statement', 'opening-statement',
            'festering-argument', 'festering-argument', 'currys-conversion', 'currys-conversion',
            'resonance-detonation', 'venom-and-vein', 'suppurating-curse',
        ],
        oratory: [
            'exordium', 'exordium', 'exordium', 'exordium',
            'brace-for-impact', 'brace-for-impact', 'brace-for-impact', 'brace-for-impact',
            'mounting-case', 'mounting-case', 'peroratio-interrupta', 'peroratio-interrupta',
            'the-closing-word', 'venom-and-vein', 'quagmire-of-doubt',
        ],
        foundry: [
            'signs-and-portents', 'signs-and-portents', 'signs-and-portents', 'signs-and-portents',
            'half-step', 'half-step', 'half-step', 'half-step',
            'bootstrap-loop', 'bootstrap-loop', 'ex-nihilo', 'ex-nihilo',
            'the-overtake', 'anvil-of-form', 'mirror-of-longing',
        ],
        penitent: [
            'against-my-judgment', 'against-my-judgment', 'against-my-judgment', 'against-my-judgment',
            'sweet-poison', 'sweet-poison', 'sweet-poison', 'sweet-poison',
            'undistributed-middle', 'undistributed-middle', 'delphic-ambiguity', 'delphic-ambiguity',
            'pact-of-akrasia', 'crown-of-thorns', 'mirror-of-guilt',
        ],
        standstill: [
            'zenos-half-step', 'zenos-half-step', 'zenos-half-step', 'zenos-half-step',
            'red-herring', 'red-herring', 'red-herring', 'red-herring',
            'cassandras-burden', 'cassandras-burden', 'fallen-grace', 'fallen-grace',
            'turnabout', 'hedgehogs-dilemma', 'mirror-of-longing',
        ],
        augury: [
            'glimpse', 'glimpse', 'glimpse', 'glimpse',
            'signs-and-portents', 'signs-and-portents', 'signs-and-portents', 'signs-and-portents',
            'arrow-paradox', 'arrow-paradox', 'self-flagellant', 'self-flagellant',
            'prophecy-fulfilled', 'the-oracles-eye', 'crumbling-resolve',
        ],
        tithe: [
            'brief-candle', 'brief-candle', 'brief-candle', 'brief-candle',
            'disarming-smile', 'disarming-smile', 'disarming-smile', 'disarming-smile',
            'the-gleaners-due', 'the-gleaners-due', 'circular-reasoning', 'circular-reasoning',
            'the-reaping', 'bone-orchard', 'stuck-in-their-head',
        ],
        grace: [
            'soft-word', 'soft-word', 'soft-word', 'soft-word',
            'second-thoughts', 'second-thoughts', 'second-thoughts', 'second-thoughts',
            'the-olive-branch', 'the-olive-branch', 'measured-answer', 'measured-answer',
            'ouroboros', 'irresistible-grace', 'crumbling-resolve',
        ],
        bastion: [
            'nettle-cloak', 'nettle-cloak', 'nettle-cloak', 'nettle-cloak',
            'sketch-of-a-thought', 'sketch-of-a-thought', 'sketch-of-a-thought', 'sketch-of-a-thought',
            'tu-quoque', 'tu-quoque', 'common-ground', 'common-ground',
            'the-adamant-wall', 'resonant-chamber', 'mirror-of-longing',
        ],
        refrain: [
            'refrain', 'refrain', 'refrain', 'refrain',
            'opening-statement', 'opening-statement', 'opening-statement', 'opening-statement',
            'winnowing', 'winnowing', 'self-flagellant', 'self-flagellant',
            'ouroboros', 'venom-and-vein', 'stuck-in-their-head',
        ],
    };

    const isValveCard = (id: string): boolean => {
        const tags = getCardById(id)?.tags ?? [];
        return tags.includes('dice') && tags.includes('valve');
    };

    describe('phase D8 — flag-on dice valves', () => {
        it('flag-off decks are byte-identical to their pre-D8 snapshots', () => {
            expect(isUpgradeableDiceEnabled()).toBe(false);
            for (const id of COMBAT_DECK_PRESET_ORDER) {
                expect(buildPresetDeck(id), id).toEqual(FLAG_OFF_SNAPSHOT[id]);
                // And no valve leaks into flag-off truth.
                expect(buildPresetDeck(id).some(isValveCard), `${id} flag-off must carry no valve`).toBe(false);
            }
        });

        it('every preset has a documented valve seat whose cards resolve', () => {
            for (const id of COMBAT_DECK_PRESET_ORDER) {
                const seat = PRESET_DICE_VALVES[id];
                expect(seat, `${id} needs a valve seat`).toBeDefined();
                expect(getCardById(seat.valveId), `${id} valve ${seat.valveId}`).toBeDefined();
                expect(getCardById(seat.replacesId), `${id} source ${seat.replacesId}`).toBeDefined();
                expect(isValveCard(seat.valveId), `${seat.valveId} must be tagged dice+valve`).toBe(true);
            }
        });

        it('flag-on: 15 cards, 5/5/5, exactly one same-aspect singleton valve per preset', () => {
            setUpgradeableDice(true);
            try {
                for (const id of COMBAT_DECK_PRESET_ORDER) {
                    const deck = buildPresetDeck(id);
                    const seat = PRESET_DICE_VALVES[id];
                    expect(deck.length, id).toBe(15);

                    const counts = { body: 0, mind: 0, heart: 0 };
                    for (const cardId of deck) counts[getCardById(cardId)!.philosophicalAspect] += 1;
                    expect(counts, `${id} flag-on must stay 5/5/5`).toEqual({ body: 5, mind: 5, heart: 5 });

                    const valves = deck.filter(isValveCard);
                    expect(valves, `${id} must carry exactly one valve instance`).toEqual([seat.valveId]);

                    // Same-aspect replacement of exactly one source instance.
                    expect(getCardById(seat.valveId)!.philosophicalAspect, `${id} valve aspect`)
                        .toBe(getCardById(seat.replacesId)!.philosophicalAspect);
                    const flagOff = FLAG_OFF_SNAPSHOT[id];
                    const sourceCopiesOff = flagOff.filter(c => c === seat.replacesId).length;
                    const sourceCopiesOn = deck.filter(c => c === seat.replacesId).length;
                    expect(sourceCopiesOn, `${id} must displace exactly one ${seat.replacesId}`)
                        .toBe(sourceCopiesOff - 1);
                    // Everything else inherits unchanged (multiset equality).
                    const strip = (cards: readonly string[], drop: string, n: number) => {
                        const out = [...cards].sort();
                        for (let i = 0; i < n; i += 1) out.splice(out.indexOf(drop), 1);
                        return out;
                    };
                    expect(strip(deck, seat.valveId, 1), `${id} inherited 14`)
                        .toEqual(strip(flagOff, seat.replacesId, 1));
                }
            } finally {
                setUpgradeableDice(false);
            }
        });

        it('buildUpgradeableDicePresetDeck fails loudly on corrupt seats', () => {
            expect(() => buildUpgradeableDicePresetDeck('erosion', {
                erosion: { valveId: 'no-such-valve', replacesId: 'slippery-slope' },
            })).toThrow();
            expect(() => buildUpgradeableDicePresetDeck('erosion', {
                erosion: { valveId: PRESET_DICE_VALVES.erosion.valveId, replacesId: 'no-such-card' },
            })).toThrow();
            expect(() => buildUpgradeableDicePresetDeck('erosion', {
                erosion: { valveId: PRESET_DICE_VALVES.erosion.valveId, replacesId: 'exordium' },
            })).toThrow(); // source not in this preset
            expect(() => buildUpgradeableDicePresetDeck('erosion', {})).toThrow(); // seat missing
        });

        it('the curated library stays exactly 70 through the ten-in/ten-out ledger', () => {
            expect(cardLibrary.length).toBe(70);
            // All ten promoted valves are library cards…
            for (const id of COMBAT_DECK_PRESET_ORDER) {
                expect(getCardById(PRESET_DICE_VALVES[id].valveId)).toBeDefined();
            }
            // …and each valve id is unique (ten distinct cards).
            const valveIds = new Set(COMBAT_DECK_PRESET_ORDER.map(id => PRESET_DICE_VALVES[id].valveId));
            expect(valveIds.size).toBe(10);
        });
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
