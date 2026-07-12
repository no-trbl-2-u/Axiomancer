import { useEffect } from 'react';

/**
 * WI-7 — recover a live drag whose pointer stream was INTERRUPTED.
 *
 * The RNGH pan gesture finalizes on its own `onEnd`/`onFinalize`, but a
 * cancelled pointer (web `pointercancel`), a window blur (alt-tab / OS gesture),
 * a tab hidden via `visibilitychange`, or a stream that simply dies mid-drag
 * never delivers one — leaving a permanent ghost and a drag state machine that
 * can wedge all subsequent staging until reload (2026-07-12 playtest). While a
 * drag is `active`, this hook listens for those signals plus a no-movement
 * watchdog and runs `finalize` (the same snap-home path the cancel branch uses).
 * Every `pointermove` resets the watchdog, so a slow-but-live drag is never cut
 * short. Web-only by construction (guards on `window`/`document`); native RNGH
 * already delivers a cancel event, so the effect no-ops there.
 */
export function useDragInterruptRecovery(
    active: boolean,
    finalize: () => void,
    watchdogMs: number,
): void {
    useEffect(() => {
        if (!active) return;
        const w = typeof window !== 'undefined' ? window : undefined;
        const d = typeof document !== 'undefined' ? document : undefined;
        if (!w?.addEventListener) return;
        const onVisibility = () => { if (d?.visibilityState === 'hidden') finalize(); };
        let watchdog = setTimeout(finalize, watchdogMs);
        const bump = () => { clearTimeout(watchdog); watchdog = setTimeout(finalize, watchdogMs); };
        w.addEventListener('pointercancel', finalize);
        w.addEventListener('blur', finalize);
        w.addEventListener('pointermove', bump);
        d?.addEventListener('visibilitychange', onVisibility);
        return () => {
            clearTimeout(watchdog);
            w.removeEventListener('pointercancel', finalize);
            w.removeEventListener('blur', finalize);
            w.removeEventListener('pointermove', bump);
            d?.removeEventListener('visibilitychange', onVisibility);
        };
    }, [active, finalize, watchdogMs]);
}
