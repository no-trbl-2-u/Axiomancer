import { describe, expect, it } from '@jest/globals';
import { decodeAcquiredCards } from 'axiomancer-mechanics';

import {
    applyHazardDeckPresetAction,
    HAZARD_DECK_PRESETS,
    randomizeHazardDeckAction,
} from '@/state/hazard/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const expectedPresetIds = [
    'starter-baseline',
    'early-straightforward',
    'late-straightforward',
    'early-enchantment',
    'late-enchantment',
    'early-utility',
    'late-utility',
];

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

describe('Hazard deck presets', () => {
    it('exposes the seven Kid strategy playtest presets in stable order', () => {
        expect(HAZARD_DECK_PRESETS.map((preset) => preset.id)).toEqual(expectedPresetIds);
    });

    it('baseline clears acquired hazard cards and leaves other flags intact', () => {
        const store = makeStore();
        store.setState({ flags: ['hazard-card:r_grip:1', 'hazard-token-banked:test'] } as never);

        const result = applyHazardDeckPresetAction(store, 'starter-baseline');

        expect(result.presetId).toBe('starter-baseline');
        expect(result.cardIds).toEqual([]);
        expect(store.getState().flags).toEqual(['hazard-token-banked:test']);
    });

    it('applies deterministic acquired cards for early and late straightforward presets', () => {
        const early = makeStore();
        const late = makeStore();

        const earlyResult = applyHazardDeckPresetAction(early, 'early-straightforward');
        const earlyAgain = applyHazardDeckPresetAction(makeStore(), 'early-straightforward');
        const lateResult = applyHazardDeckPresetAction(late, 'late-straightforward');

        expect(earlyResult.cardIds).toEqual(earlyAgain.cardIds);
        expect(earlyResult.cardIds.length).toBeGreaterThan(0);
        expect(lateResult.cardIds.length).toBeGreaterThan(earlyResult.cardIds.length);
        expect(decodeAcquiredCards(early.getState().flags)).toEqual(earlyResult.cardIds);
        expect(decodeAcquiredCards(late.getState().flags)).toEqual(lateResult.cardIds);
    });

    it('gives late enchantment and utility presets larger strategic decks than their early pairs', () => {
        const earlyEnchant = applyHazardDeckPresetAction(makeStore(), 'early-enchantment');
        const lateEnchant = applyHazardDeckPresetAction(makeStore(), 'late-enchantment');
        const earlyUtility = applyHazardDeckPresetAction(makeStore(), 'early-utility');
        const lateUtility = applyHazardDeckPresetAction(makeStore(), 'late-utility');

        expect(lateEnchant.cardIds.length).toBeGreaterThan(earlyEnchant.cardIds.length);
        expect(lateUtility.cardIds.length).toBeGreaterThan(earlyUtility.cardIds.length);
    });

    it('randomizer still writes acquired hazard-card flags', () => {
        const store = makeStore();
        const granted = randomizeHazardDeckAction(store);

        expect(granted.length).toBeGreaterThan(0);
        // 0.36.0 seeds a curated combat-loadout flag in fresh state, so not every
        // flag is a hazard-card flag. Assert the randomizer recorded an acquired
        // hazard-card flag for each granted card (the test's actual intent).
        const acquired = decodeAcquiredCards(store.getState().flags);
        for (const id of granted) expect(acquired).toContain(id);
    });
});
