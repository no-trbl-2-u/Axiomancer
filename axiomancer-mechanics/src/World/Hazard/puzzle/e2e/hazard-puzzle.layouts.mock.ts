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

export function testLayout(over: Partial<HazardPuzzleLayout> & Pick<HazardPuzzleLayout, 'id'>): HazardPuzzleLayout {
    return layout(over);
}
