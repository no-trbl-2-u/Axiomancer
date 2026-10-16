/**
 * Test-only hazard puzzle layouts. Not library content: the demo puzzles
 * ship in the puzzle library.
 */

import type { HazardPuzzleLayout } from '../hazard-puzzle.types';

function layout(over: Partial<HazardPuzzleLayout> & Pick<HazardPuzzleLayout, 'id'>): HazardPuzzleLayout {
    return {
        title: over.id,
        act: 1,
        hand: [],
        reserve: [],
        dice: [],
        goals: { safe: 1, risk: [1, 1] },
        bands: { safe: 'easy', risk: 'easy' },
        unlocks: [],
        ...over,
    };
}

/**
 * The only way to the goal draws the reserve card. SURE FOOTING pays 2/2
 * and, applied unpowered, draws one card: IRON GRIP (5 force).
 * Footing + grip = 7 force, 2 escape = 9 combined. Without the draw the
 * best is footing alone (4), or its salvage (1).
 */
export const DRAW_ONLY_LAYOUT = layout({
    id: 'test-draw-only',
    hand: ['footing'],
    reserve: ['grip'],
    goals: { safe: 9, risk: [7, 2] },
});

/**
 * A board exercising every move kind: power, apply (convert and draw),
 * salvage, and a reserve deeper than one draw.
 */
export const MIXED_LAYOUT = layout({
    id: 'test-mixed',
    hand: ['haul', 'scram', 'windread', 'oath'],
    reserve: ['grip', 'leap', 'footing'],
    dice: ['red', 'blue', 'hex', 'gold'],
    goals: { safe: 30, risk: [20, 9] },
});

/**
 * The fixture library the library test runs on until the demo puzzles
 * ship. One hand and one set of dice at three goals, so the goal alone
 * sets the band. Counts are the solver's, recorded when the goals were
 * set: easy 222 safe / 91 risk, medium 13 / 19, hard 2 / 4.
 */
const BAND_HAND = ['leap', 'leap', 'windread', 'haul', 'runner'];
const BAND_DICE: HazardPuzzleLayout['dice'] = ['red', 'red', 'blue', 'blue'];

export const FIXTURE_LIBRARY: readonly HazardPuzzleLayout[] = [
    layout({
        id: 'fixture-easy',
        hand: BAND_HAND,
        dice: BAND_DICE,
        goals: { safe: 14, risk: [6, 6] },
        bands: { safe: 'easy', risk: 'easy' },
    }),
    layout({
        id: 'fixture-medium',
        hand: BAND_HAND,
        dice: BAND_DICE,
        goals: { safe: 26, risk: [7, 12] },
        bands: { safe: 'medium', risk: 'medium' },
    }),
    layout({
        id: 'fixture-hard',
        hand: BAND_HAND,
        dice: BAND_DICE,
        goals: { safe: 30, risk: [8, 20] },
        bands: { safe: 'hard', risk: 'hard' },
    }),
];

export function testLayout(over: Partial<HazardPuzzleLayout> & Pick<HazardPuzzleLayout, 'id'>): HazardPuzzleLayout {
    return layout(over);
}
