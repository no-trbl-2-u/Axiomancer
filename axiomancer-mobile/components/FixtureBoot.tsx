/**
 * Honour a booted fixture's `arrive` intent (2026-09-07).
 *
 * When the app booted from a `StateFixture` whose `arrive` is true, fire
 * the current node's authored event once — exactly what walking onto the
 * node would do — so state-gated screens (`/dialogue`, `/village`,
 * `/cutscene`, `/event`, the minigame gates) open cold from a URL or a
 * Playwright init script. The CLI twin is `--resolve-start`.
 *
 * Waits for the navigation container to be ready before firing so
 * `<EventGate>`'s push is never lost to an unready `navigationRef`.
 *
 * Renders null; no-op on a normal boot.
 */

import { useEffect, useRef } from 'react';

import { navigationRef } from '@/lib/platform/router';
import { getBootFixture } from '@/state/fixtures';
import { useGameActions } from '@/state/GameStoreProvider';

/** Poll cadence + budget for navigation readiness (2 s total). */
const READY_POLL_MS = 50;
const READY_POLL_MAX = 40;

export function FixtureBoot() {
    const actions = useGameActions();
    const fired = useRef(false);

    useEffect(() => {
        const boot = getBootFixture();
        if (!boot?.fixture.arrive || fired.current) return;
        let attempts = 0;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const tryFire = () => {
            if (fired.current) return;
            if (navigationRef.isReady() || attempts >= READY_POLL_MAX) {
                fired.current = true;
                actions.resolveCurrentMapEvent();
                return;
            }
            attempts += 1;
            timer = setTimeout(tryFire, READY_POLL_MS);
        };
        tryFire();
        return () => {
            if (timer !== null) clearTimeout(timer);
        };
    }, [actions]);

    return null;
}
