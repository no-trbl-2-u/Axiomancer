/**
 * Hermetic E2E Tests — Aesthetic-mode context (Phase 50 tick A).
 *
 * Pins the canonical/codex toggle infrastructure: default mode,
 * AsyncStorage hydration, set + toggle, persistence write-through.
 *
 * Hermetic = self-contained + deterministic + isolated. Uses the
 * official `@react-native-async-storage/async-storage/jest/async-storage-mock`
 * (same pattern as the persistence-adapter suite).
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    AESTHETIC_STORAGE_KEY,
    AestheticModeProvider,
    DEFAULT_AESTHETIC_MODE,
    useAesthetic,
    type AestheticMode,
} from '@/state/aesthetic-mode';

afterEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
});

function wrapper({ children }: { children: React.ReactNode }) {
    return <AestheticModeProvider>{children}</AestheticModeProvider>;
}

describe('aesthetic-mode: default + hydration', () => {
    it('defaults to canonical before hydration resolves', async () => {
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        expect(result.current.mode).toBe('canonical');
        expect(DEFAULT_AESTHETIC_MODE).toBe('canonical');
        // Drain the pending hydration microtask so the trailing
        // setHydrated(true) doesn't fire outside an act() boundary.
        await waitFor(() => expect(result.current.hydrated).toBe(true));
    });

    it('flips hydrated to true after the AsyncStorage read resolves', async () => {
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
    });

    it('hydrates from a persisted "codex" value', async () => {
        await AsyncStorage.setItem(AESTHETIC_STORAGE_KEY, 'codex');
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.mode).toBe('codex'));
        expect(result.current.hydrated).toBe(true);
    });

    it('hydrates from a persisted "canonical" value (round-trip)', async () => {
        await AsyncStorage.setItem(AESTHETIC_STORAGE_KEY, 'canonical');
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        expect(result.current.mode).toBe('canonical');
    });

    it('ignores a corrupt persisted value and falls back to canonical', async () => {
        await AsyncStorage.setItem(AESTHETIC_STORAGE_KEY, 'nonsense');
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        expect(result.current.mode).toBe('canonical');
    });
});

describe('aesthetic-mode: setMode + toggle', () => {
    it('setMode flips to codex and writes through to AsyncStorage', async () => {
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        act(() => result.current.setMode('codex'));
        expect(result.current.mode).toBe('codex');

        await waitFor(async () => {
            const persisted = await AsyncStorage.getItem(AESTHETIC_STORAGE_KEY);
            expect(persisted).toBe('codex');
        });
    });

    it('toggle flips canonical → codex → canonical', async () => {
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        expect(result.current.mode).toBe('canonical');

        act(() => result.current.toggle());
        expect(result.current.mode).toBe('codex');

        act(() => result.current.toggle());
        expect(result.current.mode).toBe('canonical');
    });

    it('setMode is idempotent — setting current mode does not throw', async () => {
        const { result } = renderHook(() => useAesthetic(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        act(() => result.current.setMode('canonical'));
        expect(result.current.mode).toBe('canonical');
    });

    it('exposes both aesthetic-mode values via the type-checked union', () => {
        const modes: AestheticMode[] = ['canonical', 'codex'];
        expect(modes).toHaveLength(2);
    });
});

describe('aesthetic-mode: provider guard', () => {
    it('throws a clear error when useAesthetic is called outside the provider', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => renderHook(() => useAesthetic())).toThrow(
            'useAesthetic must be used inside <AestheticModeProvider>',
        );
        errorSpy.mockRestore();
    });
});

describe('aesthetic-mode: skipHydration opt-out (test convenience)', () => {
    function skipHydrationWrapper({ children }: { children: React.ReactNode }) {
        return (
            <AestheticModeProvider skipHydration>{children}</AestheticModeProvider>
        );
    }

    it('reports hydrated=true on first render when skipHydration is set', () => {
        const { result } = renderHook(() => useAesthetic(), {
            wrapper: skipHydrationWrapper,
        });
        // No await — the synchronous hydrated=true is the whole
        // point of the opt-out. Tests that mount the provider but
        // don't care about hydration (smoke-render, modal overlays,
        // combat screen) use this to avoid the async setHydrated
        // firing outside act() and producing a noisy warning.
        expect(result.current.hydrated).toBe(true);
        expect(result.current.mode).toBe('canonical');
    });

    it('respects the initialMode override even with skipHydration', async () => {
        function codexSkipWrapper({ children }: { children: React.ReactNode }) {
            return (
                <AestheticModeProvider initialMode="codex" skipHydration>
                    {children}
                </AestheticModeProvider>
            );
        }
        const { result } = renderHook(() => useAesthetic(), {
            wrapper: codexSkipWrapper,
        });
        expect(result.current.hydrated).toBe(true);
        expect(result.current.mode).toBe('codex');
    });
});
