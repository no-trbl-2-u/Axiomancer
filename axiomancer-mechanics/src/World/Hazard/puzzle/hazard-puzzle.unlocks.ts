/**
 * Hazard puzzle — stat unlocks.
 *
 * A layout may declare stat thresholds. Each met threshold grants one thing,
 * applied once when the session starts:
 *  - `extraDie`: +1 die of the stat's colour (never gold);
 *  - `extraCard`: a named card joins the end of the hand;
 *  - `blankReroll`: every blank (hex) die turns to the named face.
 * Grants apply in the order the layout declares them.
 */

import type { BaseStats } from '../../../Character/types';
import type { HazardColor } from '../hazard.types';
import type { HazardPuzzleLayout, HazardPuzzleStat, HazardPuzzleUnlock } from './hazard-puzzle.types';

/** The die colour each stat's `extraDie` grants. Gold stays wild and is never granted. */
export const HAZARD_PUZZLE_UNLOCK_DIE: Readonly<Record<HazardPuzzleStat, Exclude<HazardColor, 'gold'>>> = {
    body: 'red',
    mind: 'blue',
    heart: 'purple',
};

/** The layout's unlocks whose threshold the player's base stats meet, in declared order. */
export function activeHazardPuzzleUnlocks(layout: HazardPuzzleLayout, stats: BaseStats): HazardPuzzleUnlock[] {
    return layout.unlocks.filter((u) => stats[u.stat] >= u.min);
}

function sameUnlock(a: HazardPuzzleUnlock, b: HazardPuzzleUnlock): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * True when every unlock in `unlocks` is one the layout declares, each
 * declaration used at most once, so a grant is never applied twice.
 */
export function hazardPuzzleDeclaresUnlocks(layout: HazardPuzzleLayout, unlocks: readonly HazardPuzzleUnlock[]): boolean {
    const unused = layout.unlocks.slice();
    return unlocks.every((u) => {
        const i = unused.findIndex((d) => sameUnlock(d, u));
        if (i < 0) return false;
        unused.splice(i, 1);
        return true;
    });
}

/** The layout's hand and dice with `unlocks` granted (a new layout; the input is not changed). */
export function applyHazardPuzzleUnlocks(
    layout: HazardPuzzleLayout,
    unlocks: readonly HazardPuzzleUnlock[],
): HazardPuzzleLayout {
    let hand = layout.hand.slice();
    let dice = layout.dice.slice();
    for (const u of unlocks) {
        if (u.kind === 'extraDie') dice = [...dice, HAZARD_PUZZLE_UNLOCK_DIE[u.stat]];
        else if (u.kind === 'extraCard') hand = [...hand, u.cardId];
        else dice = dice.map((d) => (d === 'hex' ? u.face : d));
    }
    return { ...layout, hand, dice };
}

/** Every subset of a layout's unlocks, the empty one first, each in declared order. */
export function hazardPuzzleUnlockSubsets(layout: HazardPuzzleLayout): HazardPuzzleUnlock[][] {
    const all = layout.unlocks;
    const subsets: HazardPuzzleUnlock[][] = [];
    for (let mask = 0; mask < 1 << all.length; mask++) {
        subsets.push(all.filter((_, i) => (mask & (1 << i)) !== 0));
    }
    return subsets;
}
