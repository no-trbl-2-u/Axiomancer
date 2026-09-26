/**
 * Dev-only bridge: installs `globalThis.__AXM_SKIP_EVENT__` so a browser
 * harness (Playwright, the playtester agent) can resolve the current event
 * without a UI path — `state/dev/skip-event.ts` owns the action; this is
 * only its lifetime.
 *
 * Mounted lazily by `app/_layout.tsx` and only when `isDevToolsEnabled()`,
 * so production bundles carry neither the hook nor the skip module. The
 * hook itself is dev-tools-gated again inside `installDevSkipHook`.
 */

import { useEffect } from 'react';

import { useGameActions, useGameStore } from '@/state/GameStoreProvider';
import { installDevSkipHook } from '@/state/dev/skip-event';

export function DevSkipBridge() {
    const store = useGameStore();
    const actions = useGameActions();

    useEffect(() => installDevSkipHook(store, actions), [store, actions]);

    return null;
}
