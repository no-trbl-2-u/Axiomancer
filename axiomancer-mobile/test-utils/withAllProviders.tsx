/**
 * Shared provider-stack wrapper for hermetic integration tests
 * (Phase 64 Tick A).
 *
 * Every integration test that mounts a screen-level component
 * needs the same four contexts in the right nesting order:
 *
 *   <AestheticModeProvider>            // canonical | codex toggle
 *     <CombatModeProvider>             // inCombat + lastOutcome + inEncounterModal
 *       <GameStoreProvider store>      // engine + mobile slices
 *         <NavigationContainer> ... </NavigationContainer>  // (callers add if needed)
 *
 * Inline copies of this scaffold appeared in
 * `EncounterModalOverlay.test.tsx`, `DebugCombatButton.test.tsx`,
 * and other component tests. Consolidating them here means future
 * provider additions (e.g. a future settings context) touch one
 * helper, not every test.
 *
 * The helper returns a fresh `AppStore` per call so each test is
 * fully hermetic. Callers can read it from the returned tuple to
 * dispatch actions or read slices directly.
 */

import React from 'react';

import { TooltipProvider } from '@/components/tooltip/TooltipProvider';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { AestheticModeProvider, type AestheticMode } from '@/state/aesthetic-mode';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

export interface AllProvidersOptions {
    /** Aesthetic mode to seed. Defaults to `'canonical'`. */
    aesthetic?: AestheticMode;
    /** Optional pre-built store. Defaults to a fresh memory-adapter store. */
    store?: AppStore;
}

export interface AllProvidersResult {
    /** The wrapped JSX, ready to pass to `render(...)`. */
    tree: React.ReactElement;
    /** The store backing the tree; safe to call `store.getState()`
     * / `store.setState(...)` from the test body. */
    store: AppStore;
}

/**
 * Wrap a React tree in the canonical provider stack. Returns the
 * wrapped element plus the store reference so the test can drive
 * + assert directly against engine state.
 */
export function withAllProviders(
    child: React.ReactNode,
    options: AllProvidersOptions = {},
): AllProvidersResult {
    const store = options.store ?? createAppStore({ adapter: createMemoryAdapter() });
    const tree = (
        <AestheticModeProvider initialMode={options.aesthetic ?? 'canonical'} skipHydration>
            <CombatModeProvider>
                <GameStoreProvider store={store}>
                    <TooltipProvider>{child}</TooltipProvider>
                </GameStoreProvider>
            </CombatModeProvider>
        </AestheticModeProvider>
    );
    return { tree, store };
}
