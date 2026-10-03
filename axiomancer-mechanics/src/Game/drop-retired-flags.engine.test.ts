import { describe, it, expect } from 'vitest';
import { createNewGameState } from './game.reducer';
import { dropRetiredFlags } from './game.migrate';

// The four tutorial done-flags have no reader; every load drops them and
// keeps every other flag in order.
describe('dropRetiredFlags', () => {
    const withFlags = (flags: string[]) => ({ ...createNewGameState(), flags });

    it('drops every tutorial done-flag and keeps the rest, in order', () => {
        const out = dropRetiredFlags(withFlags([
            'combat-tutorial-done', 'hazard-scar:5', 'hazard-tutorial-done',
            'blacksmith-tutorial-done', 'night-keepsake:kept', 'night-watch-tutorial-done',
        ]));
        expect(out.flags).toEqual(['hazard-scar:5', 'night-keepsake:kept']);
    });

    it('drops repeated copies of a retired flag', () => {
        const out = dropRetiredFlags(withFlags(['combat-tutorial-done', 'combat-tutorial-done']));
        expect(out.flags).toEqual([]);
    });

    it('returns the same state when no retired flag is present', () => {
        const state = withFlags(['hazard-scar:5', 'night-keepsake:kept']);
        expect(dropRetiredFlags(state)).toBe(state);
    });

    it('returns the same state for an empty flag list', () => {
        const state = withFlags([]);
        expect(dropRetiredFlags(state)).toBe(state);
    });

    it('does not mutate the input', () => {
        const flags = ['hazard-tutorial-done', 'hazard-scar:5'];
        const state = withFlags(flags);
        dropRetiredFlags(state);
        expect(state.flags).toEqual(['hazard-tutorial-done', 'hazard-scar:5']);
    });
});
