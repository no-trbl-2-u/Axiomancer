/**
 * Aesthetic mode context — Phase 50 tick A (cold-codex toggle foundation).
 *
 * The design handoff ships two aesthetic directions for the high-stakes
 * surfaces (WILDS / STRIFE / EVENT): **canonical** (marginalia gloss —
 * the current ship) and **cold codex** (bone-and-ash chrome, heavier
 * hairlines, drops sulfur saturation). See
 * `design/handoff-2026-05-16/chats/chat2.md` "Open caveats" and the
 * `aesthetic B · cold codex` artboards in `app.jsx`.
 *
 * Tick A wires the toggle infrastructure end-to-end:
 *   - `useAesthetic()` hook reads the current mode.
 *   - `<AestheticModeProvider>` persists choice via AsyncStorage so
 *     it survives app restarts (separate from the game-state save —
 *     this is a UX preference, not gameplay state, so it does NOT
 *     wipe on a new-game).
 *   - Default 'canonical' until the persisted value resolves.
 *
 * Subsequent ticks (B/C/D) consume `useAesthetic()` to branch chrome
 * on the combat / event / exploration surfaces; Tick E may extend
 * to SELF / SATCHEL if the user commits to the direction.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AestheticMode = 'canonical' | 'codex';

/** Storage key — `:v1` so a future shape change can migrate without
 * stomping the existing slot. Separate namespace from `@axiomancer/save:v1`
 * because aesthetic is a UX preference, not gameplay state. */
export const AESTHETIC_STORAGE_KEY = '@axiomancer/aesthetic:v1';

export const DEFAULT_AESTHETIC_MODE: AestheticMode = 'canonical';

export interface AestheticModeApi {
    /** Currently active mode. Always defined; defaults to 'canonical'
     * during the first render before AsyncStorage resolves. */
    mode: AestheticMode;
    /** Set the mode explicitly. Persists asynchronously through
     * AsyncStorage. */
    setMode: (mode: AestheticMode) => void;
    /** Convenience: flip between the two modes. */
    toggle: () => void;
    /** True once the persisted value (or absence thereof) has resolved.
     * Consumers that care about the initial-paint default can wait on
     * this; most consumers just read `mode` directly since the default
     * is the canonical render. */
    hydrated: boolean;
}

const AestheticModeContext = createContext<AestheticModeApi | null>(null);

type AsyncStorageLike = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export interface AestheticModeProviderProps {
    children: React.ReactNode;
    /** Injectable for tests. Defaults to the real AsyncStorage. */
    storage?: AsyncStorageLike;
    /** Injectable initial mode for tests / dev. Defaults to
     * `DEFAULT_AESTHETIC_MODE`. Persisted value overrides this on
     * hydrate. */
    initialMode?: AestheticMode;
    /** Test escape-hatch: when true, skip the async AsyncStorage
     * hydration entirely. `hydrated` is true from first render,
     * `mode` stays at `initialMode`. Tests that don't care about
     * hydration (smoke-render, modal overlays, combat screen)
     * pass this to avoid the `setHydrated` setState firing outside
     * `act(...)` and producing a noisy warning. Production callers
     * leave this undefined. */
    skipHydration?: boolean;
}

function isAestheticMode(value: unknown): value is AestheticMode {
    return value === 'canonical' || value === 'codex';
}

export function AestheticModeProvider({
    children,
    storage = AsyncStorage,
    initialMode = DEFAULT_AESTHETIC_MODE,
    skipHydration = false,
}: AestheticModeProviderProps) {
    const [mode, setModeState] = useState<AestheticMode>(initialMode);
    const [hydrated, setHydrated] = useState<boolean>(skipHydration);

    useEffect(() => {
        if (skipHydration) return;
        let cancelled = false;
        storage
            .getItem(AESTHETIC_STORAGE_KEY)
            .then((raw) => {
                if (cancelled) return;
                if (isAestheticMode(raw)) setModeState(raw);
                setHydrated(true);
            })
            .catch(() => {
                if (!cancelled) setHydrated(true);
            });
        return () => {
            cancelled = true;
        };
    }, [storage, skipHydration]);

    const setMode = useCallback(
        (next: AestheticMode) => {
            setModeState(next);
            storage.setItem(AESTHETIC_STORAGE_KEY, next).catch(() => {
                // Best-effort: the in-memory state still flipped, so the
                // UX responds. A failed write means the choice doesn't
                // survive restart, which is acceptable for a preference.
            });
        },
        [storage],
    );

    const toggle = useCallback(() => {
        setMode(mode === 'canonical' ? 'codex' : 'canonical');
    }, [mode, setMode]);

    const value = useMemo<AestheticModeApi>(
        () => ({ mode, setMode, toggle, hydrated }),
        [mode, setMode, toggle, hydrated],
    );

    return <AestheticModeContext.Provider value={value}>{children}</AestheticModeContext.Provider>;
}

export function useAesthetic(): AestheticModeApi {
    const ctx = useContext(AestheticModeContext);
    if (ctx === null) {
        throw new Error('useAesthetic must be used inside <AestheticModeProvider>');
    }
    return ctx;
}
