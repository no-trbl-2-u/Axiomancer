/**
 * Reactive theming runtime (theming-hot-reload 2026-06).
 *
 * Locks in the core contract: switching the active theme updates the
 * live store synchronously and re-renders subscribers in place (no
 * reload), and `makeStyles` yields the active theme's stylesheet.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { DEFAULT_THEME_ID, paletteFor } from '../palette';
import {
    currentPalette,
    getActiveThemeId,
    makeStyles,
    onThemeChange,
    setActiveTheme,
    usePalette,
    useThemeId,
} from '../runtime';

afterEach(() => {
    // Reset the module-level store so tests don't leak the active theme.
    act(() => setActiveTheme(DEFAULT_THEME_ID));
});

describe('theme runtime store', () => {
    it('boots to the default theme', () => {
        expect(getActiveThemeId()).toBe(DEFAULT_THEME_ID);
        expect(currentPalette()).toEqual(paletteFor(DEFAULT_THEME_ID));
    });

    it('setActiveTheme swaps the live palette synchronously', () => {
        act(() => setActiveTheme('frost-marrow'));
        expect(getActiveThemeId()).toBe('frost-marrow');
        expect(currentPalette().sulfur).toBe(paletteFor('frost-marrow').sulfur);
    });

    it('ignores unknown theme ids', () => {
        act(() => setActiveTheme('not-a-theme' as never));
        expect(getActiveThemeId()).toBe(DEFAULT_THEME_ID);
    });

    it('notifies non-React subscribers on switch', () => {
        const seen: string[] = [];
        const unsubscribe = onThemeChange(() => seen.push(getActiveThemeId()));
        act(() => setActiveTheme('ember-depths'));
        act(() => setActiveTheme('plague-bloom'));
        unsubscribe();
        act(() => setActiveTheme('frost-marrow'));
        expect(seen).toEqual(['ember-depths', 'plague-bloom']);
    });
});

describe('reactive hooks', () => {
    it('usePalette re-renders with the new palette on switch', () => {
        const { result } = renderHook(() => usePalette());
        expect(result.current.blood).toBe(paletteFor(DEFAULT_THEME_ID).blood);

        act(() => setActiveTheme('coastal-verdant'));
        expect(result.current.blood).toBe(paletteFor('coastal-verdant').blood);
    });

    it('useThemeId tracks the active id', () => {
        const { result } = renderHook(() => useThemeId());
        expect(result.current).toBe(DEFAULT_THEME_ID);
        act(() => setActiveTheme('ember-depths'));
        expect(result.current).toBe('ember-depths');
    });
});

describe('makeStyles', () => {
    it('returns the active theme stylesheet and updates on switch', () => {
        const useStyles = makeStyles((AXM) => ({ box: { backgroundColor: AXM.bg } }));
        const { result } = renderHook(() => useStyles());
        const flatten = (s: { box: { backgroundColor?: string } }) => s.box.backgroundColor;

        expect(flatten(result.current)).toBe(paletteFor(DEFAULT_THEME_ID).bg);

        act(() => setActiveTheme('frost-marrow'));
        expect(flatten(result.current)).toBe(paletteFor('frost-marrow').bg);
    });
});
