/**
 * Hermetic E2E Tests — Loot-cache encounter ("The Reliquary") store
 * flow. Drives caches through the store action layer: begin → intro
 * → delve/probe/seal → cards → outcome → claim, and verifies the
 * claim maps kept refs back to real items, lands currency, settles
 * the bite (vitae floors at 1), and banks keepsake flags. Seeded;
 * no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, Item, LootCacheSession } from 'axiomancer-mechanics';
import { createLootCacheSession, LOOT_CACHE_TUNING } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { CACHE_KEEPSAKE_FLAG_PREFIX } from '@/state/cache/store-actions';
import { selectCacheVM } from '@/state/presenters/cache.engine';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_CACHE_SEED__?: number }).__AXM_CACHE_SEED__;
});

const LOOT: Item[] = [
    {
        id: 'test-compass',
        name: 'Tarnished Compass',
        description: 'Points somewhere. Insists.',
        category: 'material',
        quantity: 1,
    } as Item,
];

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): LootCacheSession {
    const s = store.getState().cache.session;
    if (!s) throw new Error('expected an active cache session');
    return s;
}

/** Finds a seed whose three layer fates match (null = any). */
function seedWithFates(lid: boolean | null, mid: boolean | null, deep: boolean | null): number {
    for (let seed = 1; seed < 3000; seed++) {
        const probe = createLootCacheSession(seed, [], 10);
        const [a, b, c] = probe.layers.map(l => l.trapped);
        if (lid !== null && a !== lid) continue;
        if (mid !== null && b !== mid) continue;
        if (deep !== null && c !== deep) continue;
        return seed;
    }
    throw new Error('no seed matches the fate pattern');
}

describe('cache store flow', () => {
    it('emptying a dud-fated cache claims items, coin, and the keepsake', () => {
        const { store, actions } = makeStoreAndActions();
        const seed = seedWithFates(false, false, false);
        const before = store.getState() as unknown as GameState;
        const beforeCurrency = before.player.currency;
        const beforeInventory = before.player.inventory.length;
        const beforeHealth = before.player.health;

        expect(actions.beginLootCache({ items: LOOT, currency: 10, seed })).toBe(true);
        expect(actions.beginLootCache({ seed })).toBe(false); // one cache at a time
        expect(session(store).phase).toBe('intro');
        actions.startLootCacheDelving();

        for (let i = 0; i < 3; i++) {
            actions.delveLootCache();
            expect(session(store).phase).toBe('card');
            actions.continueLootCacheCard();
        }
        expect(session(store).phase).toBe('outcome');
        const vm = selectCacheVM(store.getState());
        expect(vm.outcome!.tier).toBe('emptied');

        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);
        expect(result.itemsAdded).toBe(1);
        expect(result.bittenVitae).toBe(0);
        expect(result.keepsakes).toHaveLength(1);

        const after = store.getState() as unknown as GameState;
        expect(after.player.inventory.length).toBe(beforeInventory + 1);
        expect(after.player.inventory.map(i => i.name)).toContain('Tarnished Compass');
        expect(after.player.currency).toBe(beforeCurrency + result.currency);
        expect(after.player.health).toBe(beforeHealth);
        const flags = after.flags ?? [];
        expect(flags.some(f => f.startsWith(CACHE_KEEPSAKE_FLAG_PREFIX))).toBe(true);
        expect(store.getState().cache.session).toBeNull();
    });

    it('a sprung trap stings: bite settles at claim with a floor of 1 vitae', () => {
        const { store, actions } = makeStoreAndActions();
        const seed = seedWithFates(false, true, null);
        const before = store.getState() as unknown as GameState;
        // Wound the player to prove the floor.
        store.setState({ player: { ...before.player, health: 2 } } as never);

        actions.beginLootCache({ items: LOOT, currency: 10, seed });
        actions.startLootCacheDelving();
        actions.delveLootCache();           // the lid — clean
        actions.continueLootCacheCard();
        actions.delveLootCache();           // the false bottom — live trap
        const vmCard = selectCacheVM(store.getState());
        expect(vmCard.card!.slammed).toBe(true);
        actions.continueLootCacheCard();    // slams to outcome

        const vm = selectCacheVM(store.getState());
        expect(vm.outcome!.tier).toBe('stung');
        expect(vm.outcome!.bittenVitae).toBe(LOOT_CACHE_TUNING.trapBite[1]);

        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);
        // The lid's loot still came home.
        expect(result.itemsAdded).toBe(1);
        const after = store.getState() as unknown as GameState;
        // 2 health − 2 bite floors at 1: the cache maims, it does not kill.
        expect(after.player.health).toBe(1);
    });

    it('the probe reveals a live fate without opening the layer', () => {
        const { store, actions } = makeStoreAndActions();
        const seed = seedWithFates(false, true, null);
        actions.beginLootCache({ items: LOOT, currency: 10, seed });
        actions.startLootCacheDelving();
        actions.delveLootCache();
        actions.continueLootCacheCard();

        // Before the probe, the presenter hides the fate.
        let vm = selectCacheVM(store.getState());
        expect(vm.layers[1].reading).toBe('sealed');

        actions.probeLootCache();
        actions.continueLootCacheCard();
        vm = selectCacheVM(store.getState());
        expect(vm.layers[1].reading).toBe('live');
        expect(vm.layers[1].opened).toBe(false);
        expect(vm.canProbe).toBe(false); // the knife is spent

        // Informed, seal instead: prudent... almost — bite never landed.
        actions.sealLootCache();
        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);
        expect(result.bittenVitae).toBe(0);
        expect(result.tier).toBe('prudent');
    });

    it('abandon clears the cache without loot or bites', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        actions.beginLootCache({ items: LOOT, currency: 10, seed: 7 });
        actions.abandonLootCache();
        expect(store.getState().cache.session).toBeNull();
        const after = store.getState() as unknown as GameState;
        expect(after.player.inventory.length).toBe(before.player.inventory.length);
        expect(after.player.currency).toBe(before.player.currency);
    });
});
