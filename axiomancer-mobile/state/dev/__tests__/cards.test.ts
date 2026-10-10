/**
 * Hermetic tests — dev card-lane helpers (the `/dev` CARDS section).
 *
 * Pins:
 *   - `listLanes` mirrors the engine registry.
 *   - `setLaneDeck` deals the lane's test deck as the whole deck, clears
 *     earned reward cards, and saves.
 *   - `setRewardPool` saves the checked lanes on the player, drops unknown
 *     ids, clears the override when nothing valid is checked, and the live
 *     reward roll draws only from those lanes.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { CARD_LANES, GREY_LANE, rollCombatCardRewards } from '@mechanics';

import { getRewardLaneIds, listLanes, setLaneDeck, setRewardPool } from '@/state/dev/cards';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const makeStore = () => createAppStore({ adapter: createMemoryAdapter() });

afterEach(() => {
    jest.restoreAllMocks();
});

describe('listLanes', () => {
    it('lists every registered lane with its sizes', () => {
        expect(listLanes().map((l) => l.id)).toEqual(CARD_LANES.map((l) => l.id));
        const grey = listLanes().find((l) => l.id === 'grey');
        expect(grey).toEqual({ id: 'grey', name: GREY_LANE.name, cardCount: GREY_LANE.cardIds.length, deckSize: GREY_LANE.testDeck.length });
    });
});

describe('setLaneDeck', () => {
    it('replaces the whole deck with the lane deck and saves', () => {
        const store = makeStore();
        const player = store.getState().player;
        store.setState({ player: { ...player, knownCards: ['grey-word'], combatRewardCards: ['grey-strike', 'grey-ward'] } });
        const save = jest.spyOn(store.getState(), 'save');
        const line = setLaneDeck(store, 'grey');
        expect(store.getState().player.knownCards).toEqual([...GREY_LANE.testDeck]);
        expect(store.getState().player.combatRewardCards).toEqual([]);
        expect(line).toBe(`deck · ${GREY_LANE.name} · ${GREY_LANE.testDeck.length} cards`);
        expect(save).toHaveBeenCalled();
    });

    it('leaves the deck alone for an unknown lane', () => {
        const store = makeStore();
        const before = store.getState().player.knownCards;
        expect(setLaneDeck(store, 'nope')).toBe("no lane 'nope'");
        expect(store.getState().player.knownCards).toBe(before);
    });
});

describe('setRewardPool', () => {
    it('saves the checked lanes and the roll draws only from them', () => {
        const store = makeStore();
        expect(getRewardLaneIds(store)).toEqual([]);
        expect(setRewardPool(store, ['grey', 'nope'])).toBe(`reward pool · ${GREY_LANE.name}`);
        expect(store.getState().player.devRewardLaneIds).toEqual(['grey']);
        const offers = rollCombatCardRewards(store.getState().player, () => 0.3, 3);
        for (const id of offers) expect(GREY_LANE.cardIds).toContain(id);
    });

    it('clears the override when nothing valid is checked', () => {
        const store = makeStore();
        setRewardPool(store, ['grey']);
        expect(setRewardPool(store, [])).toBe('reward pool · whole library');
        expect('devRewardLaneIds' in store.getState().player).toBe(false);
        setRewardPool(store, ['grey']);
        setRewardPool(store, ['nope']);
        expect(getRewardLaneIds(store)).toEqual([]);
    });
});
