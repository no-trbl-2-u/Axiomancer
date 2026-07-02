/**
 * Runtime theme store + reactive styling primitives (theming-hot-reload
 * 2026-06).
 *
 * ## Why this exists
 *
 * Historically `AXM` was resolved **once** at module-load and baked into
 * every static `StyleSheet.create(...)`, so switching themes meant
 * reloading the whole JS bundle. That only ever worked on web in dev.
 *
 * This module makes the active palette a *live* value backed by a tiny
 * external store. Components subscribe with `usePalette()` (for inline
 * colours, SVG `fill`/`stroke`, dynamic styles) and `makeStyles(...)`
 * (for what used to be a module-scope `StyleSheet.create`). When
 * `setActiveTheme(id)` runs, the store swaps the palette and notifies
 * every subscriber, so the UI re-paints in place — no reload, on web
 * **and** native, in dev **and** production.
 *
 * Non-React modules (engine presenters, side-effect web styling) read
 * the current palette synchronously via `currentPalette()` and re-run
 * whenever their consuming component re-renders (which it does, because
 * that component subscribes).
 */

import { useSyncExternalStore } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    type Palette,
    type ThemeId,
    THEME_STORAGE_KEY,
    isThemeId,
    paletteFor,
    resolveActiveThemeId,
} from './palette';

// --- live store -----------------------------------------------------------

let activeId: ThemeId = resolveActiveThemeId();
let activePalette: Palette = paletteFor(activeId);
const listeners = new Set<() => void>();

/** The active theme id (stable reference until a switch). */
export function getActiveThemeId(): ThemeId {
    return activeId;
}

/**
 * The active palette (stable object reference until a switch). Safe to
 * call from non-React code — engine presenters, side-effect modules —
 * that needs the current colours synchronously.
 */
export function currentPalette(): Palette {
    return activePalette;
}

function emit(): void {
    for (const listener of listeners) listener();
}

/**
 * Switch the active theme. Updates the live palette, notifies every
 * subscriber so the UI re-paints in place, and persists the choice to
 * web `localStorage` (the sync boot source), a same-session global, and
 * `AsyncStorage` (native parity). No reload.
 */
export function setActiveTheme(id: ThemeId): void {
    if (!isThemeId(id)) return;
    if (id !== activeId) {
        activeId = id;
        activePalette = paletteFor(id);
        emit();
    }
    // Persist (idempotent — also runs when re-selecting the active theme).
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(THEME_STORAGE_KEY, id);
        }
    } catch {
        /* ignore — storage may be unavailable */
    }
    try {
        (globalThis as { __AXM_THEME__?: ThemeId }).__AXM_THEME__ = id;
    } catch {
        /* ignore */
    }
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {
        /* best-effort */
    });
}

function subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
}

/**
 * Subscribe to theme changes from non-React code (e.g. the web
 * scrollbar skin). Returns an unsubscribe fn.
 */
export function onThemeChange(callback: () => void): () => void {
    return subscribe(callback);
}

// --- React hooks ----------------------------------------------------------

/** Subscribe to the active theme id; re-renders on switch. */
export function useThemeId(): ThemeId {
    return useSyncExternalStore(subscribe, getActiveThemeId, getActiveThemeId);
}

/**
 * Subscribe to the active palette; re-renders on switch. Use for inline
 * colours, SVG `fill`/`stroke`/`stopColor`, and dynamically computed
 * styles. For static stylesheets prefer `makeStyles`.
 */
export function usePalette(): Palette {
    return useSyncExternalStore(subscribe, currentPalette, currentPalette);
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * The reactive replacement for a module-scope `StyleSheet.create`.
 *
 * Where you had:
 *
 *     const styles = StyleSheet.create({ x: { color: AXM.blood } });
 *
 * write:
 *
 *     const useStyles = makeStyles((AXM) => ({ x: { color: AXM.blood } }));
 *
 * and inside the component: `const styles = useStyles();`. The factory
 * runs once per theme (results are cached per id), and the hook returns
 * the stylesheet for the currently-active theme, re-rendering on switch.
 */
export function makeStyles<T extends NamedStyles<T> | NamedStyles<Record<string, unknown>>>(
    factory: (AXM: Palette) => T,
): () => T {
    const cache = new Map<ThemeId, T>();
    return function useStyles(): T {
        const id = useThemeId();
        let styles = cache.get(id);
        if (!styles) {
            styles = StyleSheet.create(factory(paletteFor(id)));
            cache.set(id, styles);
        }
        return styles;
    };
}
