/**
 * Hazard puzzle library check (A7): every layout, on both routes, with no
 * unlocks, is solvable, sits in its declared band, stays inside the
 * solver budget, and its winning line replays to a cleared resolve.
 *
 * Runs on the fixture library until the demo puzzles ship in
 * `HAZARD_PUZZLE_LIBRARY`; then it runs on that library.
 */

import { describe, expect, it } from 'vitest';

import { auditHazardPuzzleLayout } from '../hazard-puzzle.band';
import type { HazardPuzzleLayout } from '../hazard-puzzle.types';
import { validateHazardPuzzleLayout } from '../hazard-puzzle.validate';
import { FIXTURE_LIBRARY } from './hazard-puzzle.layouts.mock';

const LIBRARY: readonly HazardPuzzleLayout[] = FIXTURE_LIBRARY;

describe('hazard puzzle library: solvable and in band (A7)', () => {
    it('has layouts to check', () => {
        expect(LIBRARY.length).toBeGreaterThan(0);
    });

    it('every layout id is unique', () => {
        const ids = LIBRARY.map((l) => l.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    for (const layout of LIBRARY) {
        it(`${layout.id} is a valid layout`, () => {
            expect(validateHazardPuzzleLayout(layout)).toEqual({ ok: true, reasons: [] });
        });

        for (const audit of auditHazardPuzzleLayout(layout)) {
            const { route, declared, solution } = audit;
            it(`${layout.id} ${route}: ${declared}, ${solution.winningOutcomes} outcomes, best surplus ${solution.bestSurplus}`, () => {
                expect(audit.problems).toEqual([]);
                expect(solution.overBudget).toBe(false);
                expect(solution.winningOutcomes).toBeGreaterThan(0);
                expect(audit.measured).toBe(declared);
                expect(audit.replayCleared).toBe(true);
            });
        }
    }
});
