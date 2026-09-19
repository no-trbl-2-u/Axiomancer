/**
 * SaveOnExit — write the run down before the app goes away.
 *
 * PLAYTEST_BUGS_2026-09-18 BUG-03 (high — silent loss of real player progress).
 * Saves are explicit on mobile (Spec 09): the store writes at named checkpoints
 * (combat outcome, rest, cache, hazard, blacksmith, labyrinth, map crossing and
 * — as of Phase 99 — node movement). Two holes made that lossy:
 *
 *   1. There was NO save-on-exit anywhere in the app. `flush()` has existed on
 *      the persistence adapter since it was written and had **zero** callers
 *      outside its own tests; there was no `AppState`, `pagehide` or
 *      `visibilitychange` handler in `app/`, `state/`, `lib/` or `components/`.
 *   2. The adapter debounces writes by `DEFAULT_DEBOUNCE_MS` (500ms), so even a
 *      legitimate checkpoint could be eaten if the player closed the app within
 *      half a second of it — the timer is cleared on teardown, not fired.
 *
 * Together those meant a player could hit a real checkpoint, background the
 * app immediately, and lose it. This component closes both: on the way out it
 * takes a final save AND awaits the adapter's flush, so whatever the store
 * holds at that moment reaches disk.
 *
 * Mount it inside `GameStoreProvider` (it needs the store) and pass the same
 * adapter instance the provider was given.
 *
 * Platform coverage:
 *   - native: React Native's `AppState` fires `background` / `inactive`.
 *   - web: `AppState` is not reliable, so the DOM lifecycle events are used
 *     instead. `pagehide` is the one the spec guarantees on mobile browsers
 *     (`beforeunload` is explicitly NOT fired on iOS Safari when a tab is
 *     backgrounded or discarded); `visibilitychange` to `hidden` catches the
 *     tab-switch case that never unloads at all.
 *
 * Renders nothing.
 */

import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useGameStore } from '@/state/GameStoreProvider';
import type { PersistenceAdapter } from '@mechanics';
import type { AsyncStorageAdapter } from '@/state/persistence/asyncStorageAdapter';

export interface SaveOnExitProps {
    /**
     * The same adapter instance handed to `GameStoreProvider`. Passed in rather
     * than imported so a test (or the fixture-boot path) can supply its own.
     *
     * `flush` is OPTIONAL because the fixture-boot adapter
     * (`createFixtureBootAdapter`, used when the app is deep-linked into a
     * declared state for testing) is purely in-memory and has none. That is
     * correct and must stay correct: a fixture boot has nothing to flush, and
     * writing one to disk would overwrite the player's real save with a test
     * state. When `flush` is absent this component still takes the final
     * `save()` — which the in-memory adapter absorbs harmlessly — and simply
     * has nothing to push to disk.
     */
    adapter: PersistenceAdapter & Partial<Pick<AsyncStorageAdapter, 'flush'>>;
}

export function SaveOnExit({ adapter }: SaveOnExitProps): null {
    const store = useGameStore();

    useEffect(() => {
        /**
         * Take a final save and push it all the way to disk.
         *
         * Never throws: this runs on the way out, where an exception has
         * nowhere useful to go and would be swallowed by the platform anyway.
         * Losing the save is the failure we are preventing — masking an error
         * here is strictly better than letting it abort the flush.
         */
        const persistNow = (): void => {
            try {
                store.getState().save();
            } catch {
                /* a failed save must not stop the flush of an earlier one */
            }
            try {
                // Fire-and-forget on purpose. The platform gives us no
                // guarantee it will await anything on the way out, and the
                // adapter's `flush` clears the debounce timer and issues the
                // write SYNCHRONOUSLY before the promise it returns settles —
                // so the write is already in flight even if nothing awaits it.
                // Absent on the in-memory fixture-boot adapter; see the prop doc.
                void adapter.flush?.();
            } catch {
                /* persistence must not block the app from closing */
            }
        };

        if (Platform.OS === 'web') {
            // `pagehide` is the reliable one on mobile browsers; iOS Safari
            // does not fire `beforeunload` for a backgrounded or discarded tab.
            const onPageHide = (): void => persistNow();
            // A tab switch may never unload at all, so catch `hidden` too.
            const onVisibility = (): void => {
                if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                    persistNow();
                }
            };

            // Feature-detect the LISTENER, not just the global. Under the
            // react-native jest preset a `window` object exists but carries no
            // `addEventListener`, and the same is true of any SSR-ish or
            // partially-polyfilled host — a bare `typeof window === 'undefined'`
            // check passes there and then throws on the next line, which would
            // take out the whole provider tree at mount.
            const canListen =
                typeof window !== 'undefined' &&
                typeof window.addEventListener === 'function' &&
                typeof document !== 'undefined' &&
                typeof document.addEventListener === 'function';
            if (!canListen) return;

            window.addEventListener('pagehide', onPageHide);
            document.addEventListener('visibilitychange', onVisibility);
            return () => {
                window.removeEventListener('pagehide', onPageHide);
                document.removeEventListener('visibilitychange', onVisibility);
            };
        }

        const onAppStateChange = (next: AppStateStatus): void => {
            // `inactive` is included deliberately: on iOS it is the state the
            // app passes through on the way to `background`, and a swipe-to-kill
            // may never deliver `background` at all.
            if (next === 'background' || next === 'inactive') persistNow();
        };

        const sub = AppState.addEventListener('change', onAppStateChange);
        return () => sub.remove();
    }, [store, adapter]);

    return null;
}
