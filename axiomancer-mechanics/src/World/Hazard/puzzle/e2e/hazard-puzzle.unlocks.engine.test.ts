/**
 * Hazard puzzle stat unlocks (A9, A10): thresholds read from base stats,
 * each grant applied once at session start, the stat-to-colour rule, the
 * solver counting with unlocks, and the subset check refusing an unlock
 * that makes a puzzle harder.
 */

import { describe, expect, it } from 'vitest';

import { auditHazardPuzzleUnlocks } from '../hazard-puzzle.band';
import { confirmHazardPuzzle, createHazardPuzzleSession, playHazardPuzzleMoves } from '../hazard-puzzle.session';
import { solveHazardPuzzle } from '../hazard-puzzle.solver';
import type { HazardPuzzleUnlock } from '../hazard-puzzle.types';
import {
    activeHazardPuzzleUnlocks,
    applyHazardPuzzleUnlocks,
    HAZARD_PUZZLE_UNLOCK_DIE,
    hazardPuzzleUnlockSubsets,
} from '../hazard-puzzle.unlocks';
import { validateHazardPuzzleLayout } from '../hazard-puzzle.validate';
import { BLANK_DICE, BLANK_HAND, testLayout } from './hazard-puzzle.layouts.mock';

const BODY_DIE: HazardPuzzleUnlock = { stat: 'body', min: 3, kind: 'extraDie' };
const MIND_DIE: HazardPuzzleUnlock = { stat: 'mind', min: 2, kind: 'extraDie' };
const HEART_DIE: HazardPuzzleUnlock = { stat: 'heart', min: 4, kind: 'extraDie' };
const HEART_CARD: HazardPuzzleUnlock = { stat: 'heart', min: 1, kind: 'extraCard', cardId: 'scram' };
const BLANK_GOLD: HazardPuzzleUnlock = { stat: 'mind', min: 2, kind: 'blankReroll', face: 'gold' };
const BLANK_RED: HazardPuzzleUnlock = { stat: 'body', min: 2, kind: 'blankReroll', face: 'red' };

const LAYOUT = testLayout({
    id: 'unlocks',
    hand: ['haul', 'grip'],
    dice: ['hex', 'blue', 'hex'],
    unlocks: [BODY_DIE, HEART_CARD, BLANK_GOLD],
});

describe('stat thresholds (A9)', () => {
    it('picks the unlocks the base stats meet, in declared order', () => {
        expect(activeHazardPuzzleUnlocks(LAYOUT, { heart: 0, body: 0, mind: 0 })).toEqual([]);
        expect(activeHazardPuzzleUnlocks(LAYOUT, { heart: 1, body: 2, mind: 2 })).toEqual([HEART_CARD, BLANK_GOLD]);
        expect(activeHazardPuzzleUnlocks(LAYOUT, { heart: 5, body: 3, mind: 9 })).toEqual([BODY_DIE, HEART_CARD, BLANK_GOLD]);
    });

    it('maps each stat to its die colour, never gold', () => {
        expect(HAZARD_PUZZLE_UNLOCK_DIE).toEqual({ body: 'red', mind: 'blue', heart: 'purple' });
    });
});

describe('grants at session start (A9)', () => {
    it('extraDie adds one die of the stat colour, after the authored dice', () => {
        const layout = testLayout({ id: 'dice', hand: ['haul'], dice: ['gold'], unlocks: [BODY_DIE, MIND_DIE, HEART_DIE] });
        const s = createHazardPuzzleSession(layout, 'safe', [BODY_DIE, MIND_DIE, HEART_DIE]);
        expect(s.board.dice.map((d) => [d.id, d.kind])).toEqual([
            ['d2', 'gold'],
            ['d3', 'red'],
            ['d4', 'blue'],
            ['d5', 'purple'],
        ]);
    });

    it('extraCard puts the card at the end of the hand', () => {
        const s = createHazardPuzzleSession(LAYOUT, 'safe', [HEART_CARD]);
        expect(s.board.hand.map((h) => [h.uid, h.cardId])).toEqual([
            ['c1', 'haul'],
            ['c2', 'grip'],
            ['c3', 'scram'],
        ]);
        expect(s.board.dice[0].id).toBe('d4');
    });

    it('blankReroll turns every blank die to the named face and leaves the rest', () => {
        const s = createHazardPuzzleSession(LAYOUT, 'safe', [BLANK_GOLD]);
        expect(s.board.dice.map((d) => d.kind)).toEqual(['gold', 'blue', 'gold']);
    });

    it('no unlock gives the authored board', () => {
        const s = createHazardPuzzleSession(LAYOUT, 'safe');
        expect(s.board.hand.map((h) => h.cardId)).toEqual(['haul', 'grip']);
        expect(s.board.dice.map((d) => d.kind)).toEqual(['hex', 'blue', 'hex']);
    });

    it('applies the grants once and leaves the layout unchanged', () => {
        const granted = applyHazardPuzzleUnlocks(LAYOUT, [BODY_DIE, HEART_CARD, BLANK_GOLD]);
        expect(granted.hand).toEqual(['haul', 'grip', 'scram']);
        expect(granted.dice).toEqual(['gold', 'blue', 'gold', 'red']);
        expect(LAYOUT.hand).toEqual(['haul', 'grip']);
        expect(LAYOUT.dice).toEqual(['hex', 'blue', 'hex']);
    });

    it('refuses an unlock the layout does not declare', () => {
        expect(() => createHazardPuzzleSession(LAYOUT, 'safe', [MIND_DIE])).toThrow(/does not declare/);
    });

    it('refuses a declared unlock passed twice, so it is never granted twice', () => {
        expect(() => createHazardPuzzleSession(LAYOUT, 'safe', [BODY_DIE, BODY_DIE])).toThrow(/does not declare/);
        const twice = testLayout({ id: 'twice', hand: ['haul'], unlocks: [BODY_DIE, BODY_DIE] });
        expect(createHazardPuzzleSession(twice, 'safe', [BODY_DIE, BODY_DIE]).board.dice).toHaveLength(2);
    });

    it('the validator rejects a threshold that is not a whole number', () => {
        const bad = testLayout({ id: 'bad-min', hand: ['haul'], unlocks: [{ ...BODY_DIE, min: 1.5 }] });
        expect(validateHazardPuzzleLayout(bad).reasons).toEqual([expect.stringMatching(/unlocks\[0\]: min 1.5/)]);
    });
});

describe('the solver with unlocks (A9, A10)', () => {
    it('counts by hand: an extra red die turns one way through into two', () => {
        // HAUL alone against 3: staged (3) is the one clear. With a red die it can also be powered (6).
        const layout = testLayout({ id: 'haul-die', hand: ['haul'], goals: { safe: 3, risk: [3, 1] }, unlocks: [BODY_DIE] });
        expect(solveHazardPuzzle(layout, 'safe').winningOutcomes).toBe(1);
        const unlocked = solveHazardPuzzle(layout, 'safe', [BODY_DIE]);
        expect(unlocked.winningOutcomes).toBe(2);
        expect(unlocked.bestSurplus).toBe(3);
    });

    it('the winning line replays on a session with the same unlocks', () => {
        const layout = testLayout({ id: 'haul-die', hand: ['haul'], goals: { safe: 6, risk: [6, 1] }, unlocks: [BODY_DIE] });
        const line = solveHazardPuzzle(layout, 'safe', [BODY_DIE]).winningLine ?? [];
        const end = confirmHazardPuzzle(playHazardPuzzleMoves(createHazardPuzzleSession(layout, 'safe', [BODY_DIE]), line));
        expect(end.result?.cleared).toBe(true);
    });

    it('lists every subset of the unlocks, the empty one first', () => {
        const subsets = hazardPuzzleUnlockSubsets(LAYOUT);
        expect(subsets).toHaveLength(8);
        expect(subsets[0]).toEqual([]);
        expect(subsets).toContainEqual([BODY_DIE, HEART_CARD, BLANK_GOLD]);
    });

    it('the subset check refuses an unlock that closes lines (blank turned red loses the gold convert)', () => {
        const layout = testLayout({
            id: 'blank-red',
            hand: BLANK_HAND,
            dice: BLANK_DICE,
            goals: { safe: 20, risk: [12, 6] },
            unlocks: [BLANK_GOLD, BLANK_RED],
        });
        const audits = auditHazardPuzzleUnlocks(layout);
        const redOnly = audits.filter((a) => a.unlocks.length === 1 && a.unlocks[0] === BLANK_RED);
        expect(redOnly.map((a) => a.route)).toEqual(['safe', 'risk']);
        for (const a of redOnly) {
            expect(a.winningOutcomes).toBeLessThan(a.baseOutcomes);
            expect(a.problems).toEqual([expect.stringMatching(/fewer than \d+ with no unlock/)]);
        }
        const goldOnly = audits.filter((a) => a.unlocks.length === 1 && a.unlocks[0] === BLANK_GOLD);
        for (const a of goldOnly) expect(a.problems).toEqual([]);
    });
});
