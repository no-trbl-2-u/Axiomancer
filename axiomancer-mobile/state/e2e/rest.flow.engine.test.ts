/**
 * Hermetic E2E Tests — Rest encounter ("The Night Watch") store flow.
 *
 * Drives full nights through the store action layer: begin → posture
 * → three watches → outcome → claim, and verifies the claim applies
 * the heal / cleanse / keepsake flags to the live engine state.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { ActiveEffect, GameState, RestSession } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { REST_KEEPSAKE_FLAG_PREFIX } from '@/state/rest/store-actions';
import { selectRestVM } from '@/state/presenters/rest.engine';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_REST_SEED__?: number }).__AXM_REST_SEED__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): RestSession {
    const s = store.getState().rest.session;
    if (!s) throw new Error('expected an active rest session');
    return s;
}

/**
 * Drives the night to dawn. `prefer` picks options by id when present
 * (e.g. 'hold' to keep dream keepsakes, 'feed' to keep the fire fat).
 */
function playToDawn(store: AppStore, actions: AppActions, prefer: string[] = []): void {
    for (let i = 0; i < 30; i++) {
        const s = session(store);
        if (s.phase === 'outcome') return;
        if (s.phase !== 'watch' || s.pending === null) throw new Error(`unexpected phase ${s.phase}`);
        if (s.pending.result === null) {
            const enabled = s.pending.options.filter(o => !o.disabledReason);
            const pick = enabled.find(o => prefer.includes(o.id)) ?? enabled[0];
            actions.chooseRestOption(pick.id);
        } else {
            actions.continueRestWatch();
        }
    }
    throw new Error('no dawn after 30 steps');
}

describe('rest store flow', () => {
    it('begin → posture → watches → dawn → claim applies the heal', () => {
        const { store, actions } = makeStoreAndActions();
        // Wound the player so the heal is observable.
        const before = store.getState() as unknown as GameState;
        store.setState({ player: { ...before.player, health: 1 } } as never);

        expect(actions.beginRest({ seed: 7 })).toBe(true);
        expect(actions.beginRest({ seed: 8 })).toBe(false); // one night at a time
        expect(session(store).phase).toBe('posture');

        const vm = selectRestVM(store.getState());
        expect(vm.active).toBe(true);
        expect(vm.postures).toHaveLength(3);

        actions.chooseRestPosture('deep');
        expect(session(store).phase).toBe('watch');
        expect(session(store).watch).toBe(1);

        playToDawn(store, actions, ['feed', 'fade']);
        const outcome = session(store).outcome!;
        expect(outcome.healFraction).toBeGreaterThan(0);

        const result = actions.claimRestOutcome();
        expect(result.applied).toBe(true);
        expect(result.healed).toBeGreaterThan(0);
        expect(result.tier).toBe(outcome.tier);

        const after = store.getState() as unknown as GameState;
        expect(after.player.health).toBe(1 + result.healed);
        expect(after.player.health).toBeLessThanOrEqual(after.player.maxHealth);
        expect(store.getState().rest.session).toBeNull();
    });

    it('held dreams bank keepsake flags at claim', () => {
        const { store, actions } = makeStoreAndActions();
        // Scan seeds for a night that deals at least one dream.
        for (let seed = 1; seed < 200; seed++) {
            actions.beginRest({ seed });
            if (!session(store).watchPlan.includes('dream')) {
                actions.abandonRest();
                continue;
            }
            actions.chooseRestPosture('doze');
            playToDawn(store, actions, ['hold', 'spare']);
            const outcome = session(store).outcome!;
            if (outcome.keepsakes.length === 0) {
                actions.abandonRest();
                continue;
            }
            const result = actions.claimRestOutcome();
            expect(result.keepsakes.length).toBeGreaterThan(0);
            const flags = (store.getState() as unknown as GameState).flags ?? [];
            for (const keepsake of result.keepsakes) {
                expect(flags).toContain(`${REST_KEEPSAKE_FLAG_PREFIX}${keepsake}`);
            }
            return;
        }
        throw new Error('no dream-dealing seed found');
    });

    it('a held fire cleanses lingering effects at claim', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const fakeEffect = { effectId: 'debuff_test', name: 'Test Ail' } as unknown as ActiveEffect;
        store.setState({
            player: { ...before.player, health: 1, effects: [fakeEffect] },
        } as never);

        // Find a night that ends cleansed under a feed-everything policy.
        for (let seed = 1; seed < 300; seed++) {
            actions.beginRest({ seed });
            actions.chooseRestPosture('watch');
            playToDawn(store, actions, ['feed', 'fade']);
            const outcome = session(store).outcome!;
            if (!outcome.cleansed) {
                actions.abandonRest();
                continue;
            }
            const result = actions.claimRestOutcome();
            expect(result.cleansed).toBe(true);
            const after = store.getState() as unknown as GameState;
            expect(after.player.effects).toHaveLength(0);
            return;
        }
        throw new Error('no cleansing night found');
    });

    it('the night never harms: health is monotonically ≥ pre-rest at claim', () => {
        const { store, actions } = makeStoreAndActions();
        for (const seed of [1, 7, 13, 42]) {
            const before = (store.getState() as unknown as GameState).player.health;
            actions.beginRest({ seed });
            actions.chooseRestPosture('deep');
            playToDawn(store, actions, ['spare', 'fade']); // worst-case policy
            const result = actions.claimRestOutcome();
            expect(result.applied).toBe(true);
            const after = (store.getState() as unknown as GameState).player.health;
            expect(after).toBeGreaterThanOrEqual(before);
        }
    });

    it('abandon clears the night without a heal', () => {
        const { store, actions } = makeStoreAndActions();
        const before = (store.getState() as unknown as GameState).player.health;
        actions.beginRest({ seed: 7 });
        actions.abandonRest();
        expect(store.getState().rest.session).toBeNull();
        expect((store.getState() as unknown as GameState).player.health).toBe(before);
    });
});
