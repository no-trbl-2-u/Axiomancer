/**
 * Hermetic e2e tests for navigation.engine.ts presenters.
 *
 * Covers selectActiveTab, selectTabBadges, and selectNavigationViewModel
 * against various game states.
 */

import { createGameStore, createEnemy } from 'axiomancer-mechanics';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    createAppStore,
    EMPTY_EVENT_SLICE,
    DEFAULT_NOTIFICATIONS_SLICE,
    type AppStore,
} from '@/state/store';
import {
    selectActiveTab,
    selectTabBadges,
    selectNavigationViewModel,
} from '../presenters/navigation.engine';

function makeEnemy() {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Foe',
        description: 'A test enemy for navigation tests.',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
        mapName: 'test-map' as never,
        logic: 'random' as never,
    });
}

describe('navigation.engine', () => {
    describe('selectActiveTab', () => {
        it('returns combat-encounter when in combat', () => {
            const store = createGameStore(createMemoryAdapter());
            
            // Start combat to set combat state
            store.getState().startCombat(makeEnemy());
            
            const result = selectActiveTab(store.getState());
            expect(result).toBe('combat-encounter');
        });

        it('returns exploration when not in combat and no active event', () => {
            const store = createGameStore(createMemoryAdapter());
            
            const result = selectActiveTab(store.getState());
            expect(result).toBe('exploration');
        });

        it('returns exploration when combat ends', () => {
            const store = createGameStore(createMemoryAdapter());
            
            // Start then end combat (engine `endCombat` now requires an outcome)
            store.getState().startCombat(makeEnemy());
            store.getState().endCombat('victory');
            
            const result = selectActiveTab(store.getState());
            expect(result).toBe('exploration');
        });
    });

    describe('selectTabBadges', () => {
        it('returns empty badges for fresh game state', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });

            const result = selectTabBadges(store.getState());

            expect(result).toEqual({
                exploration: null,
                character: null,
                memoir: null,
                inventory: null,
            });
        });

        it('returns the same EMPTY_BADGES reference on consecutive calls in steady state', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });

            const result1 = selectTabBadges(store.getState());
            const result2 = selectTabBadges(store.getState());

            // Reference equality — required to keep zustand `useStore` from
            // looping over identity churn on the steady-state path.
            expect(result1).toBe(result2);
        });

        it('surfaces an "event" badge on the character tab when an event is pending', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });
            store.setState({
                event: {
                    ...EMPTY_EVENT_SLICE,
                    pending: {
                        state: undefined as never,
                        event: { kind: 'rest', healed: 1, healFraction: 1 },
                    },
                },
            });

            const result = selectTabBadges(store.getState());

            expect(result.character).toEqual({ text: '!', kind: 'event' });
            expect(result.exploration).toBeNull();
            expect(result.inventory).toBeNull();
        });

        it('surfaces a "levelup" badge on the character tab when XP-ready AND not acknowledged', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });
            const player = store.getState().player;
            store.setState({
                player: {
                    ...player,
                    experience: player.experienceToNextLevel ?? 100,
                    experienceToNextLevel: player.experienceToNextLevel ?? 100,
                } as never,
                notifications: { ...DEFAULT_NOTIFICATIONS_SLICE, levelUpAcknowledged: false },
            });

            const result = selectTabBadges(store.getState());

            expect(result.character).toEqual({ text: '↑', kind: 'levelup' });
        });

        it('hides the levelup badge when XP-ready but already acknowledged (Phase 29)', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });
            const player = store.getState().player;
            store.setState({
                player: {
                    ...player,
                    experience: player.experienceToNextLevel ?? 100,
                    experienceToNextLevel: player.experienceToNextLevel ?? 100,
                } as never,
                notifications: { ...DEFAULT_NOTIFICATIONS_SLICE, levelUpAcknowledged: true },
            });

            const result = selectTabBadges(store.getState());

            // Acknowledged: no badge.
            expect(result.character).toBeNull();
        });

        it('re-arms the levelup badge when character:levelup fires after acknowledgment (Phase 29)', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });
            const player = store.getState().player;
            store.setState({
                player: {
                    ...player,
                    experience: player.experienceToNextLevel ?? 100,
                    experienceToNextLevel: player.experienceToNextLevel ?? 100,
                } as never,
                notifications: { ...DEFAULT_NOTIFICATIONS_SLICE, levelUpAcknowledged: true },
            });
            // No badge yet (acknowledged).
            expect(selectTabBadges(store.getState()).character).toBeNull();

            // Fire engine character:levelup via the emitter.
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { getEmitterForStore } = require('@/state/store');
            const emitter = getEmitterForStore(store);
            emitter.emit({ type: 'character:levelup', payload: { state: store.getState() } });

            // Now badge re-armed.
            expect(selectTabBadges(store.getState()).character?.kind).toBe('levelup');
        });

        it('prefers level-up over event badge when both fire simultaneously', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });
            const player = store.getState().player;
            store.setState({
                player: {
                    ...player,
                    experience: player.experienceToNextLevel ?? 100,
                    experienceToNextLevel: player.experienceToNextLevel ?? 100,
                } as never,
                event: {
                    ...EMPTY_EVENT_SLICE,
                    pending: {
                        state: undefined as never,
                        event: { kind: 'rest', healed: 1, healFraction: 1 },
                    },
                },
                notifications: { ...DEFAULT_NOTIFICATIONS_SLICE, levelUpAcknowledged: false },
            });

            const result = selectTabBadges(store.getState());

            expect(result.character?.kind).toBe('levelup');
        });

        // The former "suppresses the event badge while combat is active"
        // test pinned `selectHasActiveEvent`'s short-circuit on the legacy
        // `state.combat` slice, removed from the engine in mechanics 0.37.0.
        // With no turn-based combat slice, mid-combat event suppression is
        // no longer a concept, so the test was retired.
    });

    describe('selectNavigationViewModel', () => {
        // Phase 60e — `selectNavigationViewModel(state: AppStoreState)`
        // expects the mobile-only slice composition. Previously
        // these tests used `createGameStore` (engine-level) and
        // passed plain GameState; works on engine 0.10.0 with
        // permissive types but would fail under 0.10.2 strict.
        // Switched to `createAppStore` so the type alignment is
        // honest and the lockfile bump (Phase 60f) is a no-op
        // here.

        it('combines active tab and badges correctly', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });

            const result = selectNavigationViewModel(store.getState());

            expect(result).toMatchObject({
                activeTab: 'exploration',
                badges: expect.objectContaining({
                    exploration: null,
                    character: null,
                    memoir: null,
                    inventory: null,
                }),
            });
        });

        it('reflects combat state in active route', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });

            // Start combat
            store.getState().startCombat(makeEnemy());

            const result = selectNavigationViewModel(store.getState());
            expect(result.activeTab).toBe('combat-encounter');
        });

        it('is frozen in development', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });

            const result = selectNavigationViewModel(store.getState());

            expect(Object.isFrozen(result)).toBe(true);
            expect(Object.isFrozen(result.badges)).toBe(true);
        });

        it('maintains referential stability for same input', () => {
            const store: AppStore = createAppStore({ adapter: createMemoryAdapter() });
            const state = store.getState();

            const result1 = selectNavigationViewModel(state);
            const result2 = selectNavigationViewModel(state);

            expect(result1.activeTab).toBe(result2.activeTab);
            expect(result1.badges).toEqual(result2.badges);
        });
    });
});