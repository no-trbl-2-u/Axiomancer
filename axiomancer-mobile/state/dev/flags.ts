/**
 * Dev-only FLAG helpers.
 *
 * `GameState.flags` is the engine's persistent string set: tutorial
 * completions, hazard scars, keepsakes,
 * and the encoded hazard deck all ride it. The `/dev` FLAGS row exposes
 * the well-known toggles so a tester can replay a tutorial or skip the
 * title flow without a fresh save.
 *
 * Functions:
 *   KNOWN_FLAGS                 the toggles worth a chip
 *   hasFlag(state, flag)        membership test
 *   toggleFlag(store, flag)     add or remove one flag; returns new state
 *   setFlags(store, flags, on)  batch add / remove
 */

import type { GameState } from '@mechanics';

import type { AppStore } from '@/state/store';
import {
    BLACKSMITH_TUTORIAL_FLAG,
    COMBAT_TUTORIAL_FLAG,
    HAZARD_TUTORIAL_FLAG,
    NIGHT_WATCH_TUTORIAL_FLAG,
    TUTORIAL_FLAGS,
} from '@/state/tutorials';

// The coach flags themselves live in `state/tutorials.ts` (the SETTINGS
// gate reads them too); re-exported so the dev leaves keep their imports.
export { BLACKSMITH_TUTORIAL_FLAG, NIGHT_WATCH_TUTORIAL_FLAG, TUTORIAL_FLAGS };

/** One toggleable flag with its chip label. */
export interface KnownFlag {
    readonly flag: string;
    readonly label: string;
}

/** The flags a tester flips by hand. The tutorial coaches. */
export const KNOWN_FLAGS: readonly KnownFlag[] = Object.freeze([
    { flag: COMBAT_TUTORIAL_FLAG, label: 'COMBAT TUT' },
    { flag: HAZARD_TUTORIAL_FLAG, label: 'HAZARD TUT' },
    { flag: BLACKSMITH_TUTORIAL_FLAG, label: 'FORGE TUT' },
    { flag: NIGHT_WATCH_TUTORIAL_FLAG, label: 'REST TUT' },
]);

/** Read the flag list off any store state. */
export const flagsOf = (state: unknown): readonly string[] => (state as GameState).flags ?? [];

/** Membership test. */
export const hasFlag = (state: unknown, flag: string): boolean => flagsOf(state).includes(flag);

/** Batch add (`on = true`) or remove (`on = false`) flags. Returns the new list. */
export function setFlags(store: AppStore, flags: readonly string[], on: boolean): readonly string[] {
    const current = flagsOf(store.getState());
    const next = on
        ? [...current, ...flags.filter((f) => !current.includes(f))]
        : current.filter((f) => !flags.includes(f));
    store.setState({ flags: next } as never);
    return next;
}

/** Flip one flag. Returns `true` when the flag is now set. */
export function toggleFlag(store: AppStore, flag: string): boolean {
    const on = !hasFlag(store.getState(), flag);
    setFlags(store, [flag], on);
    return on;
}
