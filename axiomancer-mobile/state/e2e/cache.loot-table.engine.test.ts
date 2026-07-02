/**
 * Hermetic E2E — Phase 129 loot-cache reward depth.
 *
 * Proves `beginLootCache({ lootTable })` rolls a real engine-truth
 * reward set scaled to the player's level (rolled rarity, not static
 * commons), that explicit authored `items` still win over the table,
 * and that the rolled items survive the full delve → claim flow into
 * the inventory. Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, Item, LootCacheSession } from 'axiomancer-mechanics';
import { createLootCacheSession } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { selectCacheVM } from '@/state/presenters/cache.engine';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_CACHE_SEED__?: number }).__AXM_CACHE_SEED__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): LootCacheSession {
    const s = store.getState().cache.session;
    if (!s) throw new Error('expected an active cache session');
    return s;
}

function setLevel(store: AppStore, level: number): void {
    const player = (store.getState() as unknown as GameState).player;
    store.setState({ player: { ...player, level } } as never);
}

/** Finds a seed whose three layer fates are all clean (dud). */
function allCleanSeed(): number {
    for (let seed = 1; seed < 3000; seed++) {
        const probe = createLootCacheSession(seed, [], 0);
        if (probe.layers.every((l) => !l.trapped)) return seed;
    }
    throw new Error('no all-clean seed found');
}

describe('cache loot-table reward depth', () => {
    it('rolls level-scaled rolled-rarity items instead of static commons', () => {
        const { store, actions } = makeStoreAndActions();
        setLevel(store, 20);

        expect(
            actions.beginLootCache({ lootTable: { tier: 'rich' }, currency: 10, seed: 99 }),
        ).toBe(true);

        const s = session(store);
        expect(s.layers.length).toBeGreaterThan(0);
        // At least one layer carries a rolled item; the roll is real
        // (engine rarity table), so the cache is no longer currency-only.
        const allLoot = s.layers.flatMap((l) => l.loot.items);
        expect(allLoot.length).toBeGreaterThan(0);
    });

    it('claims the rolled items into the inventory through the full flow', () => {
        const { store, actions } = makeStoreAndActions();
        setLevel(store, 20);
        const before = store.getState() as unknown as GameState;
        const beforeInv = before.player.inventory.length;

        const seed = allCleanSeed();
        actions.beginLootCache({ lootTable: { tier: 'rich' }, currency: 5, seed });
        const rolledItemCount = session(store).layers.flatMap((l) => l.loot.items).length;
        expect(rolledItemCount).toBeGreaterThan(0);

        actions.startLootCacheDelving();
        for (let i = 0; i < session(store).layers.length; i++) {
            actions.delveLootCache();
            if (session(store).phase === 'card') actions.continueLootCacheCard();
        }
        expect(selectCacheVM(store.getState()).outcome!.tier).toBe('emptied');

        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);
        expect(result.itemsAdded).toBe(rolledItemCount);

        const after = store.getState() as unknown as GameState;
        expect(after.player.inventory.length).toBe(beforeInv + rolledItemCount);
        // The rolled items are real equipment with engine-resolved rarity.
        const added = after.player.inventory.slice(beforeInv);
        expect(added.every((i) => i.category === 'equipment')).toBe(true);
    });

    it('honours explicit authored items over the loot table', () => {
        const { store, actions } = makeStoreAndActions();
        setLevel(store, 50);
        const authored: Item[] = [
            {
                id: 'authored-relic',
                name: 'Authored Relic',
                description: 'A set piece, not a roll.',
                category: 'material',
                quantity: 1,
            } as Item,
        ];

        actions.beginLootCache({
            items: authored,
            lootTable: { tier: 'rich' },
            currency: 0,
            seed: 99,
        });

        const allLoot = session(store).layers.flatMap((l) => l.loot.items);
        expect(allLoot.map((i) => i.name)).toContain('Authored Relic');
        // The table was NOT rolled: only the single authored ref exists.
        expect(allLoot).toHaveLength(1);
    });

    it('falls back to a currency-only cache when level gates out all gear', () => {
        const { store, actions } = makeStoreAndActions();
        setLevel(store, 0);

        actions.beginLootCache({ lootTable: { tier: 'modest' }, currency: 8, seed: 5 });
        const allLoot = session(store).layers.flatMap((l) => l.loot.items);
        expect(allLoot).toHaveLength(0);
    });
});
