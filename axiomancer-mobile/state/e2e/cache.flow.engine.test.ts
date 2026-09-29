/**
 * Hermetic E2E Tests — Loot-cache-choice encounter ("The Reliquary", Phase
 * 63, replacing the retired Pick Pool minigame) store flow. Drives caches
 * through the store action layer: begin → offer → outcome → claim, for
 * each of the three offers (card / item / sacrifice), and verifies the
 * claim applies the right grant (or none, for sacrifice) to the real
 * GameState.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from '@mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_CACHE_SEED__?: number }).__AXM_CACHE_SEED__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

describe('cache store flow (three-offer choice)', () => {
    it('begins in the offer phase; a second begin while active is a no-op', () => {
        const { store, actions } = makeStoreAndActions();
        expect(actions.beginLootCacheChoice({ tier: 'modest', currency: 10, seed: 7 })).toBe(true);
        expect(actions.beginLootCacheChoice({ tier: 'modest', currency: 10, seed: 7 })).toBe(false);
        expect(store.getState().cache?.session?.phase).toBe('offer');
    });

    it('card offer: outcome names a candidate; claim appends it to the deck', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const beforeRewards = (before.player.combatRewardCards ?? []).length;

        actions.beginLootCacheChoice({ tier: 'modest', currency: 10, seed: 7 });
        actions.chooseLootCacheChoiceOffer('card');
        expect(store.getState().cache?.session?.phase).toBe('outcome');
        const outcome = store.getState().cache!.session!.outcome!;
        expect(outcome.chosen).toBe('card');
        expect(outcome.rewardCardId).not.toBeNull();

        const result = actions.claimLootCacheChoiceOutcome();
        expect(result.applied).toBe(true);
        expect(result.outcome?.chosen).toBe('card');

        const after = store.getState() as unknown as GameState;
        expect((after.player.combatRewardCards ?? []).length).toBe(beforeRewards + 1);
        expect(after.player.combatRewardCards).toContain(outcome.rewardCardId);
        expect(store.getState().cache?.session).toBeNull();
    });

    it('item offer: outcome carries the rolled items + currency; claim grants both', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const beforeInventory = before.player.inventory.length;
        const beforeCurrency = before.player.currency;

        actions.beginLootCacheChoice({ tier: 'rich', currency: 12, seed: 7 });
        actions.chooseLootCacheChoiceOffer('item');
        const outcome = store.getState().cache!.session!.outcome!;
        expect(outcome.chosen).toBe('item');
        expect(outcome.currency).toBe(12);

        const result = actions.claimLootCacheChoiceOutcome();
        expect(result.applied).toBe(true);

        const after = store.getState() as unknown as GameState;
        expect(after.player.inventory.length).toBe(beforeInventory + outcome.items.length);
        expect(after.player.currency).toBe(beforeCurrency + 12);
    });

    it('sacrifice offer: grants nothing and clears the slice', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const beforeInventory = before.player.inventory.length;
        const beforeCurrency = before.player.currency;

        actions.beginLootCacheChoice({ tier: 'modest', currency: 25, seed: 7 });
        actions.chooseLootCacheChoiceOffer('sacrifice');
        const outcome = store.getState().cache!.session!.outcome!;
        expect(outcome.sacrificed).toBe(true);

        const result = actions.claimLootCacheChoiceOutcome();
        expect(result.applied).toBe(true);

        const after = store.getState() as unknown as GameState;
        expect(after.player.inventory.length).toBe(beforeInventory);
        expect(after.player.currency).toBe(beforeCurrency);
        expect(store.getState().cache?.session).toBeNull();
    });

    it('cannot claim before an offer is chosen', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCacheChoice({ tier: 'modest', seed: 7 });
        const result = actions.claimLootCacheChoiceOutcome();
        expect(result.applied).toBe(false);
        expect(store.getState().cache?.session).not.toBeNull();
    });
});
