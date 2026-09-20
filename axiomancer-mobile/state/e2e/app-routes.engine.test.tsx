/**
 * Hermetic E2E Tests — App route components
 *
 * Tests the root app routes (index.tsx, _layout.tsx) that lack comprehensive
 * e2e coverage under state/e2e/. Drives route mounting and navigation logic
 * through their public entry points with mocked dependencies.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { render, act, fireEvent } from '@testing-library/react-native';
import React from 'react';

// Mock expo-router and related navigation modules
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
    Redirect: ({ href }: { href: string }) => {
        const mockReact = require('react');
        return mockReact.createElement('view', { testID: `redirect-${href}` });
    },
    Stack: ({ children }: { children: any }) => {
        const mockReact = require('react');
        return mockReact.createElement('view', { children });
    },
}));

// Mock font loading to return loaded state immediately
jest.mock('expo-font', () => ({
    useFonts: () => [true], // Always return loaded = true
}));

// Mock expo modules that the root layout uses
jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
}));

jest.mock('expo-navigation-bar', () => ({
    setVisibilityAsync: jest.fn(),
}));

jest.mock('react-native-gesture-handler', () => ({
    GestureHandlerRootView: ({ children, style }: any) => {
        const mockReact = require('react');
        return mockReact.createElement('view', { style, children });
    },
}));

// Font sources are local `.ttf` requires as of phase 47c (no more
// `@expo-google-fonts/*` packages to mock) — jest-expo's asset
// transformer already returns a mock value for those, same as any
// other bundled image/font asset.

// Mock TitleScreen component
jest.mock('@/components/TitleScreen', () => ({
    TitleScreen: ({ onContinue }: { onContinue: () => void }) => {
        const mockReact = require('react');
        return mockReact.createElement('view', {
            testID: 'title-screen',
            onPress: onContinue
        }, 'Title Screen');
    },
}));

import { mockFixedRng } from '@/test-utils/rng';
import { AestheticModeProvider } from '@/state/aesthetic-mode';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { chosenStarterBundle } from '@/state/combat/store-actions';

// Import the route components
import IndexScreen from '@/app/index';
// Note: RootLayout testing is complex due to many dependencies
// Focus on index route for this phase

afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

function makeStore(): AppStore {
    mockFixedRng(0.5);
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProviders(
    store: AppStore,
    children: React.ReactNode
): React.ReactElement {
    return (
        <AestheticModeProvider skipHydration>
            <CombatModeProvider>
                <GameStoreProvider store={store}>
                    {children}
                </GameStoreProvider>
            </CombatModeProvider>
        </AestheticModeProvider>
    );
}

// ---------------------------------------------------------------------------
// app/index.tsx tests — onboarding flow and navigation redirect
// ---------------------------------------------------------------------------

describe('app/index.tsx: onboarding flow', () => {
    it('renders TitleScreen for new player (fresh state)', () => {
        const store = makeStore();
        // Fresh store has a new player at level 1
        
        const { getByTestId } = render(withProviders(store, <IndexScreen />));
        
        expect(getByTestId('title-screen')).toBeTruthy();
    });

    it('proceeds straight to the map once a new player dismisses the title, no picker shown', () => {
        // Phase 104 (the grey office): a brand-new player is no longer routed
        // through any starter-bundle picker or auto-seed here — dismissing
        // the title redirects immediately, and `ensureStarterCards` seeds the
        // grey office lazily at first combat instead.
        const store = makeStore();
        const { getByTestId, queryByTestId } = render(withProviders(store, <IndexScreen />));

        act(() => {
            fireEvent.press(getByTestId('title-screen'));
        });

        expect(getByTestId('redirect-/exploration')).toBeTruthy();
        expect(queryByTestId('bundle-select')).toBeNull();
        expect(chosenStarterBundle(store)).toBeNull();
    });

    it('redirects to active tab for returning player (leveled up)', () => {
        const store = makeStore();
        const state = store.getState();
        
        // Level up the player to mark them as non-new
        act(() => {
            store.setState({
                player: {
                    ...state.player,
                    level: 2,
                }
            });
        });
        
        const { getByTestId } = render(withProviders(store, <IndexScreen />));
        
        // Should redirect to exploration (default active tab)
        expect(getByTestId('redirect-/exploration')).toBeTruthy();
    });

    it('redirects to the hazard-pattern combat encounter route when player is in combat', () => {
        const store = makeStore();
        const state = store.getState();
        
        // Set up an active encounter (legacy `combat` slice removed in
        // mechanics 0.37.0; `selectActiveTab` reads `currentEncounter`) and
        // level up the player.
        act(() => {
            store.setState({
                player: {
                    ...state.player,
                    level: 2,
                },
                currentEncounter: { enemies: [] } as never,
            });
        });
        
        const { getByTestId } = render(withProviders(store, <IndexScreen />));
        
        // Should redirect to the current Hazard-pattern combat route, not retired `/combat`.
        expect(getByTestId('redirect-/combat-encounter')).toBeTruthy();
    });

    it('handles onboarding flow correctly based on player state', () => {
        // Test the core branching logic: new vs returning player
        const newPlayerStore = makeStore();
        const { getByTestId: getNewPlayerElement } = render(withProviders(newPlayerStore, <IndexScreen />));
        
        // New player should show title screen
        expect(getNewPlayerElement('title-screen')).toBeTruthy();
        
        // Create separate store for returning player
        const returningPlayerStore = makeStore();
        const state = returningPlayerStore.getState();
        act(() => {
            returningPlayerStore.setState({
                player: {
                    ...state.player,
                    level: 2,
                }
            });
        });
        
        const { getByTestId: getReturningPlayerElement } = render(
            withProviders(returningPlayerStore, <IndexScreen />)
        );
        
        // Returning player should redirect
        expect(getReturningPlayerElement('redirect-/exploration')).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// app/_layout.tsx tests — provider mounting and loading states
// ---------------------------------------------------------------------------
// NOTE: RootLayout testing requires extensive mocking of components and 
// persistence logic. Deferring to future phase for comprehensive layout testing.
// This phase establishes the pattern with index route testing.

// ---------------------------------------------------------------------------
// Integration tests — route mounting in realistic scenarios
// ---------------------------------------------------------------------------

describe('app routes: integration scenarios', () => {
    it('full new player flow: index shows title screen', () => {
        // This tests the index route for a new player
        const store = makeStore();
        
        // Index should show title screen for new player
        const indexWrapper = render(withProviders(store, <IndexScreen />));
        expect(indexWrapper.getByTestId('title-screen')).toBeTruthy();
    });

    it('full returning player flow: index redirects appropriately', () => {
        // This tests the index route for a returning player
        const store = makeStore();
        const state = store.getState();
        
        // Mark as returning player
        act(() => {
            store.setState({
                player: {
                    ...state.player,
                    level: 3,
                }
            });
        });
        
        // Index should redirect for returning player
        const indexWrapper = render(withProviders(store, <IndexScreen />));
        expect(indexWrapper.getByTestId('redirect-/exploration')).toBeTruthy();
    });

    it('preserves route mounting determinism across multiple renders', () => {
        const store = makeStore();
        
        // Multiple renders should be stable
        const first = render(withProviders(store, <IndexScreen />));
        const second = render(withProviders(store, <IndexScreen />));
        
        // Both should show title screen (new player)
        expect(first.getByTestId('title-screen')).toBeTruthy();
        expect(second.getByTestId('title-screen')).toBeTruthy();
    });

    it('handles state transitions without crashing', () => {
        const store = makeStore();
        
        const { rerender, getByTestId } = render(withProviders(store, <IndexScreen />));
        
        // Start with new player (title screen)
        expect(getByTestId('title-screen')).toBeTruthy();
        
        // Level up player
        const state = store.getState();
        act(() => {
            store.setState({
                player: {
                    ...state.player,
                    level: 2,
                }
            });
        });
        
        // Re-render with updated state
        rerender(withProviders(store, <IndexScreen />));
        
        // Should now show redirect
        expect(getByTestId('redirect-/exploration')).toBeTruthy();
    });
});