/**
 * The post-combat card draft, store side (audit findings 4a + 4b).
 *
 * Two bugs this pins shut:
 *   4a — the pick was appended to the character but NEVER SAVED, so it lived
 *        only until some unrelated `save()` happened to run.
 *   4b — the offer lived in `CombatEncounterPanel`'s own React state, so a
 *        remount mid-draft silently threw away an already-earned reward.
 *
 * Plus the draft's own contract: rolled once (never rerolled under the
 * player), claimed exactly once, cleared for the next encounter.
 */

import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, getCardById, type GameState } from '@mechanics';

import {
    COMBAT_REWARD_OFFER_COUNT,
    claimCombatRewardAction,
    resetCombatRewardAction,
    rollCombatRewardAction,
} from '@/state/combat/store-actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

const playerOf = (store: AppStore): NonNullable<GameState['player']> =>
    (store.getState() as unknown as GameState).player!;

/** A store with a loaded character carrying a themed deck. */
function storeWithPlayer(): AppStore {
    const store = makeStore();
    const player = playerOf(store);
    store.setState({
        player: { ...player, knownCards: [...COMBAT_REWARD_POOL.slice(0, 6)], combatRewardCards: [] },
    } as never);
    return store;
}

describe('combat reward draft — store actions', () => {
    it('starts with an empty, unclaimed slice', () => {
        const store = makeStore();
        expect(store.getState().combatReward).toEqual({ offers: [], claimed: false });
    });

    it('rolls three distinct, resolvable, never-cursed offers into the store', () => {
        const store = storeWithPlayer();
        const offers = rollCombatRewardAction(store);
        expect(offers.length).toBe(COMBAT_REWARD_OFFER_COUNT);
        expect(new Set(offers).size).toBe(COMBAT_REWARD_OFFER_COUNT);
        for (const id of offers) {
            const card = getCardById(id);
            expect(card).toBeTruthy();
            expect(card?.theme).not.toBe('curse');
        }
        expect(store.getState().combatReward.offers).toEqual(offers);
        expect(store.getState().combatReward.claimed).toBe(false);
    });

    // 4b — the offer must OUTLIVE the panel. Re-entering the roll (what a
    // remount does) has to hand back the same three cards, not reroll them.
    it('is idempotent: a second roll returns the SAME offer, never a reroll', () => {
        const store = storeWithPlayer();
        const first = rollCombatRewardAction(store);
        const second = rollCombatRewardAction(store);
        expect(second).toEqual(first);
        expect(store.getState().combatReward.offers).toEqual(first);
    });

    it('never re-opens a draft that was already claimed', () => {
        const store = storeWithPlayer();
        rollCombatRewardAction(store);
        claimCombatRewardAction(store, null);
        expect(rollCombatRewardAction(store)).toEqual([]);
        expect(store.getState().combatReward).toEqual({ offers: [], claimed: true });
    });

    it('no-ops with no player loaded', () => {
        const store = makeStore();
        store.setState({ player: null } as never);
        expect(rollCombatRewardAction(store)).toEqual([]);
        expect(store.getState().combatReward.offers).toEqual([]);
    });

    // 4a — the claim must PERSIST, not wait on an unrelated save.
    it('claiming a card appends it to combatRewardCards AND persists', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const player = playerOf(store);
        store.setState({ player: { ...player, knownCards: [...COMBAT_REWARD_POOL.slice(0, 6)], combatRewardCards: [] } } as never);
        const offers = rollCombatRewardAction(store);

        claimCombatRewardAction(store, offers[0]);

        expect(playerOf(store).combatRewardCards).toEqual([offers[0]]);
        expect(store.getState().combatReward).toEqual({ offers: [], claimed: true });
        // The save actually reached the adapter — a reload sees the card.
        const saved = adapter.load() as GameState | null;
        expect(saved?.player?.combatRewardCards).toEqual([offers[0]]);
    });

    it('a second claim stacks a second copy onto the collection', () => {
        const store = storeWithPlayer();
        const first = rollCombatRewardAction(store);
        claimCombatRewardAction(store, first[0]);
        resetCombatRewardAction(store);
        const second = rollCombatRewardAction(store);
        claimCombatRewardAction(store, second[0]);
        expect(playerOf(store).combatRewardCards).toEqual([first[0], second[0]]);
    });

    // The SKIP path: claimed, nothing added, still persisted.
    it('skipping claims the draft and adds nothing', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const player = playerOf(store);
        store.setState({ player: { ...player, knownCards: [...COMBAT_REWARD_POOL.slice(0, 6)], combatRewardCards: [] } } as never);
        rollCombatRewardAction(store);

        claimCombatRewardAction(store, null);

        expect(playerOf(store).combatRewardCards).toEqual([]);
        expect(store.getState().combatReward.claimed).toBe(true);
        expect((adapter.load() as GameState | null)?.player?.combatRewardCards).toEqual([]);
    });

    it('reset clears the slate so the next encounter can draft again', () => {
        const store = storeWithPlayer();
        rollCombatRewardAction(store);
        claimCombatRewardAction(store, null);
        resetCombatRewardAction(store);
        expect(store.getState().combatReward).toEqual({ offers: [], claimed: false });
        expect(rollCombatRewardAction(store).length).toBe(COMBAT_REWARD_OFFER_COUNT);
    });

    // The draft reads the deck the player is ACTUALLY playing — so the earned
    // reward cards feed back into what gets offered next.
    it('the roll reads earned reward cards as part of the deck', () => {
        const store = storeWithPlayer();
        rollCombatRewardAction(store);
        const offers = store.getState().combatReward.offers;
        claimCombatRewardAction(store, offers[0]);
        expect(playerOf(store).combatRewardCards).toContain(offers[0]);
        resetCombatRewardAction(store);
        // The next draft still produces a legal screen with the grown deck.
        const next = rollCombatRewardAction(store);
        expect(new Set(next).size).toBe(COMBAT_REWARD_OFFER_COUNT);
    });
});
