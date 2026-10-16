/**
 * Hazard puzzle — applying an outcome to the game state.
 *
 * Every part goes through a path that already exists, so nothing here is a
 * second rule for the same thing:
 *  - XP through the reducer's `GRANT_XP`, so the level-up check sees it
 *    the same way it sees combat XP;
 *  - items through `grantItem` (`Items/item-grant.ts`);
 *  - the scar as a `hazard-scar:<n>` flag, the record a rest reads to mend
 *    the max VITAE it took.
 *
 * VITAE never drops below 1 here and max VITAE never below 5, as in the live
 * hazard claim. `lethal` reports whether the loss would have killed, so a
 * caller that routes hazard deaths can do so.
 */

import type { HazardPuzzleOutcome } from '../World/Hazard/puzzle/hazard-puzzle.outcome';
import { grantItem } from '../Items/item-grant';
import { gameReducer } from './game.reducer';
import type { GameState } from './types';

/**
 * Flag prefix for an unhealed hazard scar; the suffix is the max VITAE it
 * took. The same prefix mobile's live hazard claim writes and its rest reads.
 */
export const HAZARD_SCAR_FLAG_PREFIX = 'hazard-scar:';

/** Max VITAE a scar never pushes below (the live hazard claim's floor). */
const MIN_MAX_VITAE = 5;

export interface HazardPuzzleClaim {
    state: GameState;
    /** VITAE actually lost, after the floor of 1. */
    vitaeLost: number;
    /** Max VITAE actually taken by the scar, after the floor; the flag's suffix. */
    scarApplied: number;
    /** The loss would have taken VITAE to 0 or below. */
    lethal: boolean;
}

export function claimHazardPuzzleOutcome(state: GameState, outcome: HazardPuzzleOutcome): HazardPuzzleClaim {
    let next = gameReducer(state, { type: 'GRANT_XP', payload: { amount: outcome.xp } });

    let player = next.player;
    for (const item of outcome.items) {
        player = grantItem(player, item).character;
    }

    const newMax = Math.max(MIN_MAX_VITAE, player.maxHealth - outcome.scar);
    const scarApplied = Math.max(0, player.maxHealth - newMax);
    const nominal = player.health - outcome.vitaeLoss;
    const health = Math.min(newMax, Math.max(1, nominal));
    const vitaeLost = Math.max(0, player.health - Math.max(1, nominal));

    player = {
        ...player,
        maxHealth: newMax,
        health,
        currency: player.currency + outcome.shillings,
    };
    const flags = scarApplied > 0 ? [...next.flags, `${HAZARD_SCAR_FLAG_PREFIX}${scarApplied}`] : next.flags;
    next = { ...next, player, flags };

    return { state: next, vitaeLost, scarApplied, lethal: nominal <= 0 };
}
