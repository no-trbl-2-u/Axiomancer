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
jest.mock('expo-router', () => ({
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

// Mock the font imports
jest.mock('@expo-google-fonts/pirata-one', () => ({
    PirataOne_400Regular: 'PirataOne_400Regular',
}));
jest.mock('@expo-google-fonts/im-fell-english', () => ({
    IMFellEnglish_400Regular: 'IMFellEnglish_400Regular',
    IMFellEnglish_400Regular_Italic: 'IMFellEnglish_400Regular_Italic',
}));
jest.mock('@expo-google-fonts/bebas-neue', () => ({
    BebasNeue_400Regular: 'BebasNeue_400Regular',
}));
jest.mock('@expo-google-fonts/jetbrains-mono', () => ({
    JetBrainsMono_400Regular: 'JetBrainsMono_400Regular',
}));

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

// Mock BundleSelectScreen — pressing it picks the first bundle.
jest.mock('@/components/BundleSelectScreen', () => ({
    BundleSelectScreen: ({ onPick }: { onPick: (id: string) => void }) => {
        const mockReact = require('react');
        return mockReact.createElement('view', {
            testID: 'bundle-select',
            onPress: () => onPick('bleeding-edge'),
        }, 'Bundle Select');
    },
}));

import { mockFixedRng } from '@/test-utils/rng';
import { AestheticModeProvider } from '@/state/aesthetic-mode';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

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

    it('offers a starter bundle after a new player dismisses the title', () => {
        const store = makeStore();
        const { getByTestId } = render(withProviders(store, <IndexScreen />));

        // Dismiss the title → new players choose a starter bundle next.
        fireEvent.press(getByTestId('title-screen'));

        expect(getByTestId('bundle-select')).toBeTruthy();
    });

    it('proceeds to the map once a starter bundle is chosen', () => {
        const store = makeStore();
        const { getByTestId } = render(withProviders(store, <IndexScreen />));

        fireEvent.press(getByTestId('title-screen'));
        fireEvent.press(getByTestId('bundle-select'));

        expect(getByTestId('redirect-/exploration')).toBeTruthy();
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