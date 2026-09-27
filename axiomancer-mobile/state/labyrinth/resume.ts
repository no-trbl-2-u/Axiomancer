/**
 * The Labyrinth (THE APORIA) — resuming a visit from a save (map revamp M4).
 *
 * Pure, with type-only imports, so both the store's cold boot
 * (`createAppStore`) and the menu's slot load (`hydrateStoreWithGameState`)
 * can call it without an import cycle through the action glue.
 */

import type { LabyrinthProgress, WorldState } from '@mechanics';

import type { MobileLabyrinthSlice } from '../store';

type LabyrinthSession = NonNullable<MobileLabyrinthSlice['session']>;

/**
 * Rebuild the transient visit from a loaded save (map revamp M4). A save
 * taken inside the Aporia holds the act map as its world and the overworld
 * as `labyrinth.returnWorld`; without a session the screen would have no act
 * and the exit no way back. Returns the session, or `null` when the state is
 * not mid-visit (or is an older save with no return point, which has nothing
 * to restore to). Pure: the caller writes it.
 */
export function resumeLabyrinthSession(state: {
    world?: WorldState;
    labyrinth?: LabyrinthProgress;
}): LabyrinthSession | null {
    if (state.world?.currentContinent?.name !== 'labyrinth-continent') return null;
    const progress = state.labyrinth;
    if (!progress?.returnWorld) return null;
    return {
        actId: progress.currentAct,
        savedWorld: progress.returnWorld,
        lastRemark: null,
        arrivalNote: null,
    };
}
