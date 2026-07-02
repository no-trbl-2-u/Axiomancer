/**
 * Helper for driving store actions and flushing React updates in integration tests
 * (Phase 121).
 *
 * Integration tests need to dispatch actions to the store and ensure
 * all React updates have propagated before asserting state. This helper
 * provides a consistent way to do that across test suites.
 *
 * Example:
 *   const { store } = withAllProviders(<TestComponent />);
 *   await simulatePlayerAction(store, (actions) => actions.startCombat(enemy));
 *   expect(store.getState().combat).not.toBeNull();
 */

import { act } from '@testing-library/react-native';
import { createAppActions } from '@/state/actions';
import type { AppStore } from '@/state/store';

/**
 * Simulate a player action by dispatching it to the store and flushing
 * all pending React updates.
 *
 * @param store The app store to dispatch to
 * @param actionCallback Function that receives actions and dispatches one or more
 * @returns Promise that resolves when all updates have flushed
 */
export async function simulatePlayerAction(
    store: AppStore,
    actionCallback: (actions: ReturnType<typeof createAppActions>) => void,
): Promise<void> {
    const actions = createAppActions(store);
    
    await act(async () => {
        actionCallback(actions);
    });
}

/**
 * Wait for any pending state updates to complete. Useful when you need
 * to let the store settle before making assertions.
 */
export async function waitForStateUpdate(): Promise<void> {
    await act(async () => {
        // Allow microtasks to flush
        await new Promise(resolve => setTimeout(resolve, 0));
    });
}