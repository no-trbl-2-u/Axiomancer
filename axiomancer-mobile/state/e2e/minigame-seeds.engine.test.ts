/**
 * Hermetic E2E Tests — mobile minigame deterministic seeding.
 *
 * Pins the shared seed precedence across every mobile minigame begin
 * action: explicit begin options > unified global playtest seed config >
 * legacy per-minigame globals > authored/default fallback.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import type { Item } from '@mechanics';

const LOOT: Item[] = [
    {
        id: 'seed-test-trinket',
        name: 'Seed Test Trinket',
        description: 'A deterministic bauble.',
        category: 'material',
        quantity: 1,
    } as Item,
];

type SeedGlobals = typeof globalThis & {
    __AXM_MINIGAME_SEEDS__?: {
        hazard?: { seed?: number; hazardId?: string; id?: string };
        rest?: { seed?: number };
        cache?: { seed?: number };
    };
    __AXM_HAZARD_SEED__?: number;
    __AXM_HAZARD_ID__?: string;
    __AXM_REST_SEED__?: number;
    __AXM_CACHE_SEED__?: number;
};

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function clearSeedGlobals(): void {
    const g = globalThis as SeedGlobals;
    delete g.__AXM_MINIGAME_SEEDS__;
    delete g.__AXM_HAZARD_SEED__;
    delete g.__AXM_HAZARD_ID__;
    delete g.__AXM_REST_SEED__;
    delete g.__AXM_CACHE_SEED__;
}

afterEach(() => {
    jest.restoreAllMocks();
    clearSeedGlobals();
});

describe('minigame seed resolver precedence', () => {
    it('explicit begin options outrank unified and legacy globals for keyed minigames', () => {
        const g = globalThis as SeedGlobals;
        g.__AXM_MINIGAME_SEEDS__ = {
            hazard: { seed: 222, hazardId: 'flooded-undercroft' },
        };
        g.__AXM_HAZARD_SEED__ = 111;
        g.__AXM_HAZARD_ID__ = 'flooded-undercroft';

        const { store, actions } = makeStoreAndActions();

        expect(actions.beginHazard({ seed: 1, hazardId: 'cracked-cliff' })).toBe(true);
        expect(store.getState().hazard.session?.seed).toBe(1);
        expect(store.getState().hazard.session?.hazardId).toBe('cracked-cliff');
    });

    it('unified globals outrank legacy globals for every minigame', () => {
        const g = globalThis as SeedGlobals;
        g.__AXM_MINIGAME_SEEDS__ = {
            hazard: { seed: 201, hazardId: 'cracked-cliff' },
            rest: { seed: 203 },
            cache: { seed: 204 },
        };
        g.__AXM_HAZARD_SEED__ = 101;
        g.__AXM_HAZARD_ID__ = 'flooded-undercroft';
        g.__AXM_REST_SEED__ = 103;
        g.__AXM_CACHE_SEED__ = 104;

        const { store, actions } = makeStoreAndActions();

        actions.beginHazard();
        expect(store.getState().hazard.session?.seed).toBe(201);
        expect(store.getState().hazard.session?.hazardId).toBe('cracked-cliff');

        actions.beginRest();
        expect(store.getState().rest.session?.seed).toBe(203);

        actions.beginLootCache({ items: LOOT, currency: 5 });
        expect(store.getState().cache.session?.seed).toBe(204);
    });

    it('legacy globals are still honored when the unified config omits a minigame', () => {
        const g = globalThis as SeedGlobals;
        g.__AXM_MINIGAME_SEEDS__ = {};
        g.__AXM_REST_SEED__ = 303;
        g.__AXM_CACHE_SEED__ = 304;

        const { store, actions } = makeStoreAndActions();
        actions.beginRest();
        actions.beginLootCache({ items: LOOT, currency: 5 });

        expect(store.getState().rest.session?.seed).toBe(303);
        expect(store.getState().cache.session?.seed).toBe(304);
    });

    it('falls back to the nondeterministic host seed only after explicit, unified, and legacy are absent', () => {
        jest.spyOn(Date, 'now').mockReturnValue(0x12345678);
        jest.spyOn(Math, 'random').mockReturnValue(0);
        const { store, actions } = makeStoreAndActions();

        actions.beginRest();

        expect(store.getState().rest.session?.seed).toBe(0x12345678);
    });
});
