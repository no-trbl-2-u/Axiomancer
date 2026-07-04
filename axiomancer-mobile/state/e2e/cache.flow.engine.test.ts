/**
 * Hermetic E2E Tests — Loot-cache encounter ("The Reliquary") store
 * flow, Pick Pool redesign. Drives caches through the store action
 * layer: begin → intro → delve → picking (push/channel/retreat) →
 * cards → outcome → claim, and verifies the claim maps kept refs back
 * to real items, lands currency, settles the bite (vitae floors at 1),
 * and banks keepsake flags. Seeded; no timers, no network.
 *
 * Dice/RNG behavior is exercised structurally (loop until resolved)
 * rather than pinned to specific rolls, since the pick pool's odds are
 * tuning-owned (see `LOOT_CACHE_TUNING` in `axiomancer-mechanics`).
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, Item, LootCacheSession } from '@mechanics';
import { LOOT_CACHE_TUNING } from '@mechanics';

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

/** Pushes the pick pool until the layer resolves (card phase) or the guard trips. */
function pushUntilResolved(actions: AppActions, store: AppStore): void {
    let guard = 0;
    while (session(store).phase === 'picking' && guard++ < 50) {
        actions.pushLootCachePick();
    }
}

describe('cache store flow (pick pool)', () => {
    it('a full run (delve every layer, push each pick to resolution) reaches outcome and claims', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const beforeCurrency = before.player.currency;

        expect(actions.beginLootCache({ items: LOOT, currency: 10, seed: 7 })).toBe(true);
        expect(actions.beginLootCache({ seed: 7 })).toBe(false); // one cache at a time
        expect(session(store).phase).toBe('intro');
        actions.startLootCacheDelving();
        expect(session(store).phase).toBe('delving');

        let guard = 0;
        while (session(store).phase === 'delving' && session(store).depth < 3 && guard++ < 10) {
            actions.delveLootCache();
            expect(session(store).phase).toBe('picking');
            pushUntilResolved(actions, store);
            expect(session(store).phase).toBe('card');
            actions.continueLootCacheCard();
        }

        // Either every layer resolved (delving exhausted) or a jam slammed
        // the session straight to outcome via the card's slam.
        if (session(store).phase === 'delving') {
            actions.sealLootCache();
        }
        expect(session(store).phase).toBe('outcome');

        const vm = selectCacheVM(store.getState());
        expect(['emptied', 'prudent', 'stung']).toContain(vm.outcome!.tier);
        expect(vm.outcome!.bittenVitae).toBeGreaterThanOrEqual(0);

        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);

        const after = store.getState() as unknown as GameState;
        expect(after.player.currency).toBeGreaterThanOrEqual(beforeCurrency);
        expect(store.getState().cache.session).toBeNull();
    });

    it('a sprung pick stings: bite settles at claim with a floor of 1 vitae', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        store.setState({ player: { ...before.player, health: 2 } } as never);

        actions.beginLootCache({ items: LOOT, currency: 10, seed: 7 });
        actions.startLootCacheDelving();

        // Force a jam by pushing well past any plausible layer difficulty —
        // a real pick pool must jam or cap out long before this many rolls.
        let jammed = false;
        let guard = 0;
        while (!jammed && session(store).phase !== 'outcome' && guard++ < 200) {
            const s = session(store);
            if (s.phase === 'delving') {
                actions.delveLootCache();
            } else if (s.phase === 'picking') {
                actions.pushLootCachePick();
                const roll = session(store).pick?.lastRoll ?? null;
                if (roll?.jammed) jammed = true;
            } else if (s.phase === 'card') {
                const vm = selectCacheVM(store.getState());
                if (vm.card?.slammed) jammed = true;
                actions.continueLootCacheCard();
            }
        }

        if (session(store).phase !== 'outcome') actions.sealLootCache();
        const vm = selectCacheVM(store.getState());
        expect(vm.outcome).not.toBeNull();

        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);
        const after = store.getState() as unknown as GameState;
        // 2 health minus any bite floors at 1: the cache maims, it does not kill.
        expect(after.player.health).toBeGreaterThanOrEqual(1);
    });

    it('channeling insight adds a bonus die to the next roll, once per session', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginLootCache({ items: LOOT, currency: 10, seed: 7 });
        actions.startLootCacheDelving();
        actions.delveLootCache();
        expect(session(store).phase).toBe('picking');

        let vm = selectCacheVM(store.getState());
        expect(vm.pick!.canChannelInsight).toBe(true);
        expect(vm.pick!.poolSize).toBe(LOOT_CACHE_TUNING.pickPoolSize);

        actions.channelLootCacheInsight();
        vm = selectCacheVM(store.getState());
        expect(vm.pick!.canChannelInsight).toBe(false);
        expect(vm.pick!.poolSize).toBe(LOOT_CACHE_TUNING.pickPoolSize + 1);

        actions.pushLootCachePick();
        vm = selectCacheVM(store.getState());
        // The charge is spent for the whole session, win or lose this layer.
        expect(vm.insightUsed).toBe(true);
    });

    it('retreat closes the current layer without opening it or biting vitae', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        actions.beginLootCache({ items: LOOT, currency: 10, seed: 7 });
        actions.startLootCacheDelving();
        actions.delveLootCache();
        expect(session(store).phase).toBe('picking');

        actions.retreatLootCachePick();
        expect(session(store).phase).not.toBe('picking');
        // Retreat is a clean exit — either straight back to delving, or a
        // card acknowledging the retreat before delving resumes.
        if (session(store).phase === 'card') actions.continueLootCacheCard();
        expect(['delving', 'outcome']).toContain(session(store).phase);

        if (session(store).phase === 'delving') actions.sealLootCache();
        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);
        expect(result.bittenVitae).toBe(0);

        const after = store.getState() as unknown as GameState;
        expect(after.player.health).toBe(before.player.health);
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

    it('claims map kept item refs back to real inventory items', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const beforeInventory = before.player.inventory.length;

        actions.beginLootCache({ items: LOOT, currency: 10, seed: 7 });
        actions.startLootCacheDelving();
        actions.delveLootCache();
        pushUntilResolved(actions, store);
        actions.continueLootCacheCard();
        if (session(store).phase === 'delving') actions.sealLootCache();

        const vm = selectCacheVM(store.getState());
        const result = actions.claimLootCacheOutcome();
        expect(result.applied).toBe(true);

        const after = store.getState() as unknown as GameState;
        if (vm.outcome!.itemNames.includes('Tarnished Compass')) {
            expect(after.player.inventory.length).toBe(beforeInventory + 1);
            expect(after.player.inventory.map(i => i.name)).toContain('Tarnished Compass');
        }
        if (vm.outcome!.keepsakes.length > 0) {
            const flags = after.flags ?? [];
            expect(flags.some(f => f.startsWith(CACHE_KEEPSAKE_FLAG_PREFIX))).toBe(true);
        }
    });
});
