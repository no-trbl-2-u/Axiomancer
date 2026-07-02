/**
 * Hermetic component tests — HardwareBackHandler (Phase 8 decision A).
 *
 * Side-effect-only component. Registers an Android hardwareBackPress
 * listener that returns `true` (prevent default) while in combat,
 * `false` (allow default) otherwise. Renders null. iOS / other
 * platforms: no listener registered.
 *
 * /iterate pass closes the coverage gap with 6 hermetic cases:
 * the Platform.OS guard, the inCombat branch, the listener
 * cleanup on unmount, and a no-op render assertion.
 */

import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import { BackHandler, Platform } from 'react-native';

import { HardwareBackHandler } from '@/components/HardwareBackHandler';
import { CombatModeProvider, useCombatMode } from '@/state/combat-mode';

type BackAction = () => boolean;

const addListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
const removeSpy = jest.fn();

beforeEach(() => {
    addListenerSpy.mockReset();
    removeSpy.mockReset();
    addListenerSpy.mockImplementation((_evt: unknown, _action: unknown) => ({
        remove: removeSpy,
    } as ReturnType<typeof BackHandler.addEventListener>));
    // jest-expo's default Platform.OS is 'ios'; most tests below
    // need android. Override here; individual tests that need iOS
    // set their own value and restore via finally.
    (Platform as { OS: string }).OS = 'android';
});

afterAll(() => {
    addListenerSpy.mockRestore();
});

function withProvider(child: React.ReactNode) {
    return <CombatModeProvider>{child}</CombatModeProvider>;
}

/** Captures the latest `backAction` callback registered with BackHandler. */
function lastBackAction(): BackAction {
    const calls = addListenerSpy.mock.calls;
    const lastCall = calls[calls.length - 1];
    if (!lastCall) throw new Error('BackHandler.addEventListener was not called');
    return lastCall[1] as BackAction;
}

/**
 * Helper component for tests that need to flip combat state at
 * runtime — the test imports it and triggers `enterCombat()` etc.
 * via a ref-like pattern (props callback at mount).
 */
function CombatModeProbe({ onMount }: { onMount: (api: ReturnType<typeof useCombatMode>) => void }) {
    const api = useCombatMode();
    React.useEffect(() => {
        onMount(api);
    }, [onMount, api]);
    return null;
}

describe('HardwareBackHandler: Platform.OS gate', () => {
    it('on Android: registers a hardwareBackPress listener', () => {
        const originalOS = Platform.OS;
        (Platform as { OS: string }).OS = 'android';
        try {
            render(withProvider(<HardwareBackHandler />));
            expect(addListenerSpy).toHaveBeenCalledTimes(1);
            expect(addListenerSpy.mock.calls[0]?.[0]).toBe('hardwareBackPress');
        } finally {
            (Platform as { OS: string }).OS = originalOS;
        }
    });

    it('on iOS: does NOT register a listener', () => {
        const originalOS = Platform.OS;
        (Platform as { OS: string }).OS = 'ios';
        try {
            render(withProvider(<HardwareBackHandler />));
            expect(addListenerSpy).not.toHaveBeenCalled();
        } finally {
            (Platform as { OS: string }).OS = originalOS;
        }
    });
});

describe('HardwareBackHandler: inCombat branching', () => {
    it('back action returns false when not in combat (allow default)', () => {
        const originalOS = Platform.OS;
        (Platform as { OS: string }).OS = 'android';
        try {
            render(withProvider(<HardwareBackHandler />));
            expect(lastBackAction()()).toBe(false);
        } finally {
            (Platform as { OS: string }).OS = originalOS;
        }
    });

    it('back action returns true while in combat (prevent default)', () => {
        const originalOS = Platform.OS;
        (Platform as { OS: string }).OS = 'android';
        try {
            let api: ReturnType<typeof useCombatMode> | null = null;
            render(
                withProvider(
                    <>
                        <HardwareBackHandler />
                        <CombatModeProbe onMount={(a) => { api = a; }} />
                    </>,
                ),
            );
            // Pre-combat: back action allows default.
            expect(lastBackAction()()).toBe(false);

            // Enter combat — the effect re-runs and a fresh action is registered.
            act(() => {
                api?.enterCombat();
            });
            expect(lastBackAction()()).toBe(true);
        } finally {
            (Platform as { OS: string }).OS = originalOS;
        }
    });
});

describe('HardwareBackHandler: cleanup', () => {
    it('removes the listener on unmount (Android)', () => {
        const originalOS = Platform.OS;
        (Platform as { OS: string }).OS = 'android';
        try {
            const tree = render(withProvider(<HardwareBackHandler />));
            expect(removeSpy).not.toHaveBeenCalled();
            tree.unmount();
            expect(removeSpy).toHaveBeenCalledTimes(1);
        } finally {
            (Platform as { OS: string }).OS = originalOS;
        }
    });
});

describe('HardwareBackHandler: render contract', () => {
    it('renders nothing (side-effect-only)', () => {
        const tree = render(withProvider(<HardwareBackHandler />));
        expect(tree.toJSON()).toBeNull();
    });
});
