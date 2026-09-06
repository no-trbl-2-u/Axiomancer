/**
 * Hermetic tests — dev flag helpers.
 *
 * Pins: `toggleFlag` flips membership; `setFlags` batches on/off without
 * duplicates; `KNOWN_FLAGS` carries every tutorial flag.
 */

import { KNOWN_FLAGS, TUTORIAL_FLAGS, flagsOf, hasFlag, setFlags, toggleFlag } from '@/state/dev/flags';
import { createAppStore } from '@/state/store';

describe('flags dev helpers', () => {
    it('toggleFlag flips membership and reports the new state', () => {
        const store = createAppStore();
        expect(hasFlag(store.getState(), 'combat-tutorial-done')).toBe(false);
        expect(toggleFlag(store, 'combat-tutorial-done')).toBe(true);
        expect(hasFlag(store.getState(), 'combat-tutorial-done')).toBe(true);
        expect(toggleFlag(store, 'combat-tutorial-done')).toBe(false);
        expect(hasFlag(store.getState(), 'combat-tutorial-done')).toBe(false);
    });

    it('setFlags batches without duplicating existing flags', () => {
        const store = createAppStore();
        setFlags(store, TUTORIAL_FLAGS, true);
        setFlags(store, TUTORIAL_FLAGS, true);
        const flags = flagsOf(store.getState());
        for (const f of TUTORIAL_FLAGS) expect(flags.filter((x) => x === f)).toHaveLength(1);
        setFlags(store, TUTORIAL_FLAGS, false);
        for (const f of TUTORIAL_FLAGS) expect(hasFlag(store.getState(), f)).toBe(false);
    });

    it('KNOWN_FLAGS includes every tutorial flag', () => {
        const known = KNOWN_FLAGS.map((k) => k.flag);
        for (const f of TUTORIAL_FLAGS) expect(known).toContain(f);
    });
});
