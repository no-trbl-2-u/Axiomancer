/**
 * Dev-only FLAG helpers.
 *
 * `GameState.flags` is the engine's persistent string set: tutorial
 * completions, the starter-bundle pick, hazard tokens/scars, keepsakes,
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

import { COMBAT_TUTORIAL_FLAG, BUNDLE_CHOSEN_FLAG } from '@/state/combat/store-actions';
import { HAZARD_TUTORIAL_FLAG, HAZARD_HEXED_FLAG } from '@/state/hazard/store-actions';
import type { AppStore } from '@/state/store';

/** Blacksmith first-visit coach; mirrored from the blacksmith store module. */
export const BLACKSMITH_TUTORIAL_FLAG = 'blacksmith-tutorial-done';
/** Rest-choice ("night watch") first-visit coach. */
export const NIGHT_WATCH_TUTORIAL_FLAG = 'night-watch-tutorial-done';

/** One toggleable flag with its chip label. */
export interface KnownFlag {
    readonly flag: string;
    readonly label: string;
}

/** The flags a tester flips by hand. Tutorial coaches first, then gates. */
export const KNOWN_FLAGS: readonly KnownFlag[] = Object.freeze([
    { flag: COMBAT_TUTORIAL_FLAG, label: 'COMBAT TUT' },
    { flag: HAZARD_TUTORIAL_FLAG, label: 'HAZARD TUT' },
    { flag: BLACKSMITH_TUTORIAL_FLAG, label: 'FORGE TUT' },
    { flag: NIGHT_WATCH_TUTORIAL_FLAG, label: 'REST TUT' },
    { flag: BUNDLE_CHOSEN_FLAG, label: 'BUNDLE PICKED' },
    { flag: HAZARD_HEXED_FLAG, label: 'HEXED' },
]);

/** The tutorial subset, for the ALL TUTS ON / OFF shortcuts. */
export const TUTORIAL_FLAGS: readonly string[] = Object.freeze([
    COMBAT_TUTORIAL_FLAG,
    HAZARD_TUTORIAL_FLAG,
    BLACKSMITH_TUTORIAL_FLAG,
    NIGHT_WATCH_TUTORIAL_FLAG,
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
