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
import type { Item } from 'axiomancer-mechanics';

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
        gathering?: { seed?: number; siteId?: string; site?: string };
        rest?: { seed?: number };
        cache?: { seed?: number };
        quest?: { seed?: number; boardId?: string; board?: string };
    };
    __AXM_HAZARD_SEED__?: number;
    __AXM_HAZARD_ID__?: string;
    __AXM_GATHER_SEED__?: number;
    __AXM_GATHER_SITE__?: string;
    __AXM_REST_SEED__?: number;
    __AXM_CACHE_SEED__?: number;
    __AXM_QUEST_SEED__?: number;
    __AXM_QUEST_BOARD__?: string;
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
    delete g.__AXM_GATHER_SEED__;
    delete g.__AXM_GATHER_SITE__;
    delete g.__AXM_REST_SEED__;
    delete g.__AXM_CACHE_SEED__;
    delete g.__AXM_QUEST_SEED__;
    delete g.__AXM_QUEST_BOARD__;
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
            gathering: { seed: 333, siteId: 'weeping-pines' },
            quest: { seed: 444, boardId: 'build-the-boat' },
        };
        g.__AXM_HAZARD_SEED__ = 111;
        g.__AXM_HAZARD_ID__ = 'flooded-undercroft';
        g.__AXM_GATHER_SEED__ = 112;
        g.__AXM_GATHER_SITE__ = 'bone-orchard';
        g.__AXM_QUEST_SEED__ = 113;

        const { store, actions } = makeStoreAndActions();

        expect(actions.beginHazard({ seed: 1, hazardId: 'cracked-cliff' })).toBe(true);
        expect(store.getState().hazard.session?.seed).toBe(1);
        expect(store.getState().hazard.session?.hazardId).toBe('cracked-cliff');

        expect(actions.beginGathering({ seed: 2, siteId: 'mire-mint' })).toBe(true);
        expect(store.getState().gathering.session?.seed).toBe(2);
        expect(store.getState().gathering.session?.siteId).toBe('mire-mint');

        expect(actions.beginQuestBoard({ seed: 3, boardId: 'build-the-boat' })).toBe(true);
        expect(store.getState().quest.session?.seed).toBe(3);
        expect(store.getState().quest.session?.boardId).toBe('build-the-boat');
    });

    it('unified globals outrank legacy globals for all five minigames', () => {
        const g = globalThis as SeedGlobals;
        g.__AXM_MINIGAME_SEEDS__ = {
            hazard: { seed: 201, hazardId: 'cracked-cliff' },
            gathering: { seed: 202, siteId: 'mire-mint' },
            rest: { seed: 203 },
            cache: { seed: 204 },
            quest: { seed: 205, boardId: 'build-the-boat' },
        };
        g.__AXM_HAZARD_SEED__ = 101;
        g.__AXM_HAZARD_ID__ = 'flooded-undercroft';
        g.__AXM_GATHER_SEED__ = 102;
        g.__AXM_GATHER_SITE__ = 'bone-orchard';
        g.__AXM_REST_SEED__ = 103;
        g.__AXM_CACHE_SEED__ = 104;
        g.__AXM_QUEST_SEED__ = 105;

        const { store, actions } = makeStoreAndActions();

        actions.beginHazard();
        expect(store.getState().hazard.session?.seed).toBe(201);
        expect(store.getState().hazard.session?.hazardId).toBe('cracked-cliff');

        actions.beginGathering();
        expect(store.getState().gathering.session?.seed).toBe(202);
        expect(store.getState().gathering.session?.siteId).toBe('mire-mint');

        actions.beginRest();
        expect(store.getState().rest.session?.seed).toBe(203);

        actions.beginLootCache({ items: LOOT, currency: 5 });
        expect(store.getState().cache.session?.seed).toBe(204);

        actions.beginQuestBoard();
        expect(store.getState().quest.session?.seed).toBe(205);
        expect(store.getState().quest.session?.boardId).toBe('build-the-boat');
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
