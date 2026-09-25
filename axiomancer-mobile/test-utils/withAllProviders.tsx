/**
 * Shared provider-stack wrapper for hermetic integration tests
 * (Phase 64 Tick A).
 *
 * Every integration test that mounts a screen-level component
 * needs the same contexts in the right nesting order:
 *
 *   <CombatModeProvider>             // inCombat + lastOutcome + inEncounterModal
 *     <GameStoreProvider store>      // engine + mobile slices
 *       <SaveSlotsProvider>          // the three save slots (in-memory here)
 *         <SettingsProvider>         // player settings (never touches storage here)
 *           <NavigationContainer> ... </NavigationContainer>  // (callers add if needed)
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
import { SaveSlotsProvider } from '@/state/SaveSlotsProvider';
import type { SaveSlotStore } from '@/state/persistence/saveSlots';
import { SettingsProvider, createSettingsStore, type SettingsStore } from '@/state/settings';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

export interface AllProvidersOptions {
    /** Optional pre-built store. Defaults to a fresh memory-adapter store. */
    store?: AppStore;
    /** Optional slot store (2026-09-23). Defaults to a fresh in-memory one. */
    slots?: SaveSlotStore;
    /** Optional settings store (2026-09-23). Defaults to a fresh one at the defaults. */
    settings?: SettingsStore;
}

/** A settings store under test never reaches AsyncStorage. */
const NO_STORAGE = {
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
};

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
    const settings = options.settings ?? createSettingsStore({ storage: NO_STORAGE });
    const tree = (
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                <SaveSlotsProvider slots={options.slots}>
                    <SettingsProvider store={settings}>
                        <TooltipProvider>{child}</TooltipProvider>
                    </SettingsProvider>
                </SaveSlotsProvider>
            </GameStoreProvider>
        </CombatModeProvider>
    );
    return { tree, store };
}
