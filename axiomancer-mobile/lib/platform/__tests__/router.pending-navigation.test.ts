/**
 * Router — PLAYTEST_BUGS_2026-09-18 BUG-02: the dropped redirect.
 *
 * A returning player has `onboarding.showTitleScreen` false, so `app/index.tsx`
 * renders `<Redirect href="/exploration" />` on its FIRST paint — there is no
 * title screen to click through. That redirect could land before the
 * NavigationContainer attached. `dispatchTo` began with a bare
 * `if (!navigationRef.isReady()) return;`, and `Redirect`'s effect is keyed only
 * on `[href]` — which never changes — so the effect could not re-run. The
 * redirect was dropped, the index route kept rendering `null`, and the player
 * got a permanently blank white screen with nothing in the log (both failure
 * exits were `__DEV__`-gated).
 *
 * The fix queues the request and replays it from `<NavigationContainer onReady>`.
 * This suite pins the queue's behaviour directly, without a container:
 *
 *   1. a dispatch made while not-ready is REMEMBERED, not dropped;
 *   2. `flushPendingNavigation` replays it once the ref reports ready;
 *   3. last-write-wins — only the most recent request is replayed;
 *   4. the flush is idempotent (a duplicate `onReady` cannot double-navigate);
 *   5. with nothing queued the flush is a no-op;
 *   6. a dispatch made while ready still goes straight through and queues
 *      nothing (the fix must not delay the normal path).
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
    navigationRef,
    useRouter,
    flushPendingNavigation,
    __resetPendingNavigationForTests,
} from '@/lib/platform/router';

/** Drive the ref's readiness the way the container would. */
function setReady(ready: boolean) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(ready);
}

describe('BUG-02 — a navigation requested before the container is ready is replayed, not dropped', () => {
    let navigate: jest.SpiedFunction<typeof navigationRef.navigate>;
    let dispatch: jest.SpiedFunction<typeof navigationRef.dispatch>;

    beforeEach(() => {
        __resetPendingNavigationForTests();
        // `exploration` is a TAB route, so it lands on `navigate`, not `dispatch`.
        navigate = jest.spyOn(navigationRef, 'navigate').mockImplementation(() => undefined);
        dispatch = jest.spyOn(navigationRef, 'dispatch').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        __resetPendingNavigationForTests();
    });

    it('does not navigate while the container is not ready', () => {
        setReady(false);
        useRouter().replace('/exploration');
        // The old behaviour and the new one agree here — nothing can navigate
        // before the container exists. The difference is what happens next.
        expect(navigate).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('replays that navigation once the container reports ready', () => {
        setReady(false);
        useRouter().replace('/exploration');
        expect(navigate).not.toHaveBeenCalled();

        // This is the exact sequence `<NavigationContainer onReady>` produces.
        setReady(true);
        flushPendingNavigation();

        // THE REGRESSION: before the fix this stayed at zero forever and the
        // player sat on a blank screen.
        expect(navigate).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith('(tabs)', {
            screen: expect.any(String),
            params: undefined,
        });
    });

    it('replays only the most recent request (last write wins)', () => {
        setReady(false);
        // `exploration` is a tab route (-> navigate); `character` is too, so
        // pick a NON-tab route second to prove which one was replayed.
        useRouter().replace('/exploration');
        useRouter().replace('/village');

        setReady(true);
        flushPendingNavigation();

        // Replaying the older one would land the player on a screen they had
        // already navigated away from before the container even existed.
        // `village` is a stack route, so the replay must land on `dispatch`
        // and `navigate` must never fire.
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(navigate).not.toHaveBeenCalled();
    });

    it('is idempotent — a duplicate onReady cannot double-navigate', () => {
        setReady(false);
        useRouter().replace('/exploration');

        setReady(true);
        flushPendingNavigation();
        flushPendingNavigation();
        flushPendingNavigation();

        expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when nothing was queued', () => {
        setReady(true);
        expect(() => flushPendingNavigation()).not.toThrow();
        expect(navigate).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('still dispatches immediately when the container IS ready', () => {
        setReady(true);
        useRouter().replace('/exploration');

        // The normal path must not be delayed by the queue.
        expect(navigate).toHaveBeenCalledTimes(1);

        // ...and nothing should be left queued to fire a second time.
        flushPendingNavigation();
        expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('does not queue an unknown route for replay', () => {
        setReady(true);
        useRouter().push('/no-such-route');
        expect(navigate).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();

        // An unroutable href must not sit in the queue waiting to fail again.
        flushPendingNavigation();
        expect(navigate).not.toHaveBeenCalled();
    });
});
