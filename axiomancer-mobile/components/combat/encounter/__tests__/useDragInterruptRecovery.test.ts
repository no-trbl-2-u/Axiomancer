/**
 * @jest-environment jsdom
 *
 * WI-7 — the drag interrupt-recovery hook. A drag whose pointer stream is killed
 * mid-flight (pointercancel / window blur / tab hidden / no movement for 4s)
 * must be force-finalized, else it leaves a permanent ghost and can wedge all
 * subsequent staging. These pin every recovery trigger + the no-early-cut
 * watchdog + listener cleanup.
 */

import { renderHook } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { useDragInterruptRecovery } from '@/components/combat/encounter/useDragInterruptRecovery';

const WATCHDOG = 4000;

afterEach(() => { jest.useRealTimers(); });

describe('useDragInterruptRecovery', () => {
    it('finalizes on pointercancel while active', () => {
        const finalize = jest.fn();
        renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        window.dispatchEvent(new Event('pointercancel'));
        expect(finalize).toHaveBeenCalledTimes(1);
    });

    it('finalizes on window blur while active', () => {
        const finalize = jest.fn();
        renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        window.dispatchEvent(new Event('blur'));
        expect(finalize).toHaveBeenCalledTimes(1);
    });

    it('finalizes when the tab is hidden (visibilitychange → hidden)', () => {
        const finalize = jest.fn();
        renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(finalize).toHaveBeenCalledTimes(1);
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    });

    it('does NOT finalize on a visibilitychange that leaves the tab visible', () => {
        const finalize = jest.fn();
        renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        document.dispatchEvent(new Event('visibilitychange')); // still 'visible'
        expect(finalize).not.toHaveBeenCalled();
    });

    it('watchdog finalizes a dead (no-movement) stream after the timeout', () => {
        jest.useFakeTimers();
        const finalize = jest.fn();
        const { unmount } = renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        jest.advanceTimersByTime(WATCHDOG);
        expect(finalize).toHaveBeenCalledTimes(1);
        unmount();
        jest.useRealTimers(); // hand cleanup back to real timers (RTL auto-unmount)
    });

    it('every pointermove resets the watchdog — a slow but LIVE drag is never cut short', () => {
        jest.useFakeTimers();
        const finalize = jest.fn();
        const { unmount } = renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        // Keep moving just under the deadline; the watchdog must keep resetting.
        for (let i = 0; i < 5; i++) {
            jest.advanceTimersByTime(WATCHDOG - 1);
            window.dispatchEvent(new Event('pointermove'));
        }
        expect(finalize).not.toHaveBeenCalled();
        // Then the stream dies: no more moves → the watchdog fires once.
        jest.advanceTimersByTime(WATCHDOG);
        expect(finalize).toHaveBeenCalledTimes(1);
        unmount();
        jest.useRealTimers();
    });

    it('is inert while INACTIVE (no listeners armed, watchdog never fires)', () => {
        jest.useFakeTimers();
        const finalize = jest.fn();
        const { unmount } = renderHook(() => useDragInterruptRecovery(false, finalize, WATCHDOG));
        window.dispatchEvent(new Event('pointercancel'));
        window.dispatchEvent(new Event('blur'));
        jest.advanceTimersByTime(WATCHDOG * 2);
        expect(finalize).not.toHaveBeenCalled();
        unmount();
        jest.useRealTimers();
    });

    it('cleans up every listener on unmount — a cancel after the drag ends is ignored', () => {
        const finalize = jest.fn();
        const { unmount } = renderHook(() => useDragInterruptRecovery(true, finalize, WATCHDOG));
        unmount();
        window.dispatchEvent(new Event('pointercancel'));
        window.dispatchEvent(new Event('blur'));
        expect(finalize).not.toHaveBeenCalled();
    });
});
