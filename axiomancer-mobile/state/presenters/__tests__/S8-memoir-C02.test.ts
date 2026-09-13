/**
 * Hermetic presenter pins — S8-memoir-C02.
 *
 * Fresh-eyes finding: the MEASURE section stacked the chrome chip
 * `UNTESTED` directly over the narrative line `untested.` — the same
 * word twice, in two fonts, explaining nothing about what the measure
 * is or how it moves.
 *
 * The untested chip's second line now comes from
 * `philosophicalAlignment.hint`, which must name the state (the three
 * base stats stand level) and what resolves it (the greatest of them).
 * Once a stat leads, `rationale` carries the explanation and `hint`
 * goes empty so the screen never prints both.
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { describe, expect, it } from '@jest/globals';
import { createGameStore } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectMemoirViewModel } from '@/state/presenters/memoir.engine';
import type { AppStoreState } from '@/state/store';

/**
 * Purpose: put the player's three base stats into a known shape so the
 * philosophical-alignment branch under test is the one exercised.
 * Input: a game store and the `{heart, body, mind}` triple to write.
 * Output: none — mutates the store via `setState`.
 * Resolves: S8-memoir-C02 (test fixture helper).
 */
function setBaseStats(
    store: ReturnType<typeof createGameStore>,
    stats: { heart: number; body: number; mind: number },
): void {
    const player = store.getState().player;
    // Type assertion needed for test mock data - setState expects AppStoreState partial
    store.setState({ player: { ...player, baseStats: stats } } as unknown as Partial<AppStoreState>);
}

describe('S8-memoir-C02: the untested MEASURE chip explains itself', () => {
    it('pairs the UNTESTED chip with a hint that does not repeat the label', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 4, body: 4, mind: 4 });

        const { philosophicalAlignment } = selectMemoirViewModel(store.getState());

        expect(philosophicalAlignment.label).toBe('UNTESTED');
        expect(philosophicalAlignment.hint.length).toBeGreaterThan(0);
        // The whole point of the finding: the second line must not be
        // the chip's own word handed back in lowercase.
        expect(philosophicalAlignment.hint).not.toBe('untested.');
        expect(philosophicalAlignment.hint.toLowerCase()).not.toContain('untested');
    });

    it('names the three measures and what resolves the tie', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 4, body: 4, mind: 4 });

        const hint = selectMemoirViewModel(store.getState()).philosophicalAlignment.hint;

        expect(hint).toContain('heart');
        expect(hint).toContain('body');
        expect(hint).toContain('mind');
        expect(hint).toContain('greatest');
    });

    it('clears the hint once one stat leads, leaving the rationale to explain', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 12, body: 5, mind: 7 });

        const { philosophicalAlignment } = selectMemoirViewModel(store.getState());

        expect(philosophicalAlignment.label).toBe('of the Heart');
        expect(philosophicalAlignment.rationale).toBe('Heart is your largest measure (12).');
        expect(philosophicalAlignment.hint).toBe('');
    });

    it('keeps the alignment object frozen with the added hint field', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 4, body: 4, mind: 4 });

        const { philosophicalAlignment } = selectMemoirViewModel(store.getState());

        expect(Object.isFrozen(philosophicalAlignment)).toBe(true);
    });
});
