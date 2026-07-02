import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, STARTING_SKILL_IDS } from 'axiomancer-mechanics';

import {
    applyCombatDeckPresetAction,
    COMBAT_DECK_PRESETS,
    randomizeCombatDeckAction,
} from '@/state/combat/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const expectedPresetIds = [
    'starter-baseline',
    'body-force',
    'mind-logic',
    'heart-will',
    'aggression',
    'attrition',
    'control-guard',
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

        const result = applyCombatDeckPresetAction(store, 'body-force');

        expect(result.presetId).toBe('body-force');
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
