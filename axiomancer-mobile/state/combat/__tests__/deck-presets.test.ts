import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, STARTING_SKILL_IDS, getCard } from '@mechanics';

import {
    applyCombatDeckPresetAction,
    COMBAT_DECK_PRESETS,
    randomizeCombatDeckAction,
} from '@/state/combat/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const expectedPresetIds = [
    'starter-baseline',
    'bleed',
    'poison',
    'confusion',
    'dread',
    'guard',
    'sustain',
    'gold-showcase',
];

const FULL_POOL = new Set([...STARTING_SKILL_IDS, ...COMBAT_REWARD_POOL]);

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

describe('Combat deck presets', () => {
    it('exposes the eight strategy presets in stable order', () => {
        expect(COMBAT_DECK_PRESETS.map((preset) => preset.id)).toEqual(expectedPresetIds);
    });

    it('every preset is a non-empty selection drawn only from engine card ids', () => {
        for (const preset of COMBAT_DECK_PRESETS) {
            expect(preset.cardIds.length).toBeGreaterThan(0);
            for (const id of preset.cardIds) {
                expect(FULL_POOL.has(id)).toBe(true);
            }
        }
    });

    it('applying a preset replaces knownSkills with the deck and clears reward cards', () => {
        const store = makeStore();
        store.setState({
            player: {
                ...store.getState().player,
                knownSkills: ['some-old-skill'],
                combatRewardCards: ['some-reward'],
            },
        } as never);

        const result = applyCombatDeckPresetAction(store, 'bleed');

        expect(result.presetId).toBe('bleed');
        expect(result.cardIds.length).toBeGreaterThan(0);
        expect(store.getState().player.knownSkills).toEqual(result.cardIds);
        expect(store.getState().player.combatRewardCards).toEqual([]);
    });

    it('is deterministic — the same preset yields the same deck every time', () => {
        const first = applyCombatDeckPresetAction(makeStore(), 'gold-showcase');
        const second = applyCombatDeckPresetAction(makeStore(), 'gold-showcase');
        expect(first.cardIds).toEqual(second.cardIds);
    });

    it('starter-baseline restores the default five-card starter deck', () => {
        const result = applyCombatDeckPresetAction(makeStore(), 'starter-baseline');
        expect(result.cardIds).toEqual([
            'ad-hominem-strike',
            'brace-for-impact',
            'false-dilemma',
            'suspend-judgment',
            'ship-of-theseus',
        ]);
    });

    it('groups by shared keyword, not by stance colour', () => {
        const byId = Object.fromEntries(COMBAT_DECK_PRESETS.map((p) => [p.id, p]));
        const every = (id: string, pred: (effectId: string, verbClass: string) => boolean) =>
            byId[id]!.cardIds.every((c) => {
                const card = getCard(c);
                return !!card && pred(card.primaryEffectId ?? '', card.verbClass);
            });

        // Effect-keyword decks: every card literally applies the keyword.
        expect(every('bleed', (e) => e.includes('bleed') || e.includes('hemorrhage'))).toBe(true);
        expect(every('poison', (e) => e.includes('poison') || e.includes('septic'))).toBe(true);
        expect(every('confusion', (e) => e.includes('confusion'))).toBe(true);
        expect(every('dread', (e) => e.includes('fear') || e.includes('despair'))).toBe(true);
        // Role-keyword decks: every card shares the combat role.
        expect(every('guard', (_e, v) => v === 'defend')).toBe(true);
        expect(every('sustain', (_e, v) => v === 'buff-self')).toBe(true);

        // No preset is a single-stance ("colour") deck — every keyword deck
        // spans more than one stance OR is defined purely by keyword, never by
        // a `stance ===` filter. Guard against a colour regression: the bleed
        // deck must draw from multiple stances (body + mind + heart bleeders).
        const bleedStances = new Set(byId['bleed']!.cardIds.map((c) => getCard(c)?.stance));
        expect(bleedStances.size).toBeGreaterThan(1);
    });

    it('randomizer deals unique cards from the full pool into knownSkills', () => {
        const store = makeStore();
        store.setState({
            player: { ...store.getState().player, combatRewardCards: ['stale'] },
        } as never);

        const granted = randomizeCombatDeckAction(store);

        expect(granted.length).toBeGreaterThan(0);
        expect(new Set(granted).size).toBe(granted.length); // no duplicates
        expect(granted.every((id) => FULL_POOL.has(id))).toBe(true);
        expect(store.getState().player.knownSkills).toEqual(granted);
        expect(store.getState().player.combatRewardCards).toEqual([]);
    });
});
