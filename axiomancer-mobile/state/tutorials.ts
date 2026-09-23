/**
 * Tutorial gating — the one rule every first-time coach asks before it runs.
 *
 * Each coach (combat primer, hazard crossing, forge, night watch) marks
 * itself done with a flag on `GameState.flags`, so "done" is PER SAVE. The
 * SETTINGS screen adds a device-wide switch on top (owner call 2026-09-23):
 * with TUTORIAL HINTS off, every coach reads as done regardless of flags,
 * and RESET TUTORIALS strips the flags from the current run so the coaches
 * run again.
 *
 * Functions:
 *   TUTORIAL_FLAGS                       every coach's done-flag
 *   isTutorialDone(flags, flag, hints)   the gate (pure)
 *   resetTutorialsAction(store)          strip the flags from the current run + save
 */

import type { GameState } from '@mechanics';

import type { AppStore } from './store';
import { settingsStore } from './settings';

/** Guided first hazard-pattern combat (`state/combat/store-actions.ts`). */
export const COMBAT_TUTORIAL_FLAG = 'combat-tutorial-done';
/** Guided first hazard crossing (`state/hazard/store-actions.ts`). */
export const HAZARD_TUTORIAL_FLAG = 'hazard-tutorial-done';
/** Blacksmith first-visit coach (`state/blacksmith/store-actions.ts`). */
export const BLACKSMITH_TUTORIAL_FLAG = 'blacksmith-tutorial-done';
/** Rest-choice ("night watch") first-visit coach. */
export const NIGHT_WATCH_TUTORIAL_FLAG = 'night-watch-tutorial-done';

/** Every coach's done-flag, in the order the run meets them. */
export const TUTORIAL_FLAGS: readonly string[] = Object.freeze([
    COMBAT_TUTORIAL_FLAG,
    HAZARD_TUTORIAL_FLAG,
    BLACKSMITH_TUTORIAL_FLAG,
    NIGHT_WATCH_TUTORIAL_FLAG,
]);

/**
 * Should the coach behind `flag` stay quiet?
 *
 * @param flags the run's `GameState.flags`.
 * @param flag  the coach's done-flag.
 * @param hints the TUTORIAL HINTS setting; defaults to the live store value.
 * @returns true when hints are off OR the flag is already set.
 */
export function isTutorialDone(
    flags: readonly string[] | undefined,
    flag: string,
    hints: boolean = settingsStore.get().tutorialHints,
): boolean {
    if (!hints) return true;
    return (flags ?? []).includes(flag);
}

/**
 * RESET TUTORIALS: remove every coach flag from the current run and save,
 * so the next combat / crossing / forge / rest coaches again. Returns the
 * flags that were removed (empty when there was nothing to reset).
 */
export function resetTutorialsAction(store: AppStore): readonly string[] {
    const state = store.getState() as unknown as GameState;
    const current = state.flags ?? [];
    const removed = current.filter((f) => TUTORIAL_FLAGS.includes(f));
    if (removed.length === 0) return removed;
    store.setState({ flags: current.filter((f) => !TUTORIAL_FLAGS.includes(f)) } as never);
    try {
        store.getState().save();
    } catch {
        /* persistence must not block the reset */
    }
    return removed;
}
