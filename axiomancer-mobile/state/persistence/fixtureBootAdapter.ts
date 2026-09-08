/**
 * Fixture-boot persistence adapter — an in-memory `PersistenceAdapter`
 * whose first `load()` is the compiled fixture state.
 *
 * Deliberately never reaches AsyncStorage: a fixture session is a test
 * run, and the tester's real save slot (`@axiomancer/save:v1`) must
 * survive it untouched. Explicit saves still "work" within the session
 * (`load()` returns the latest saved state), so save/load UI paths can be
 * exercised; they just do not persist across a reload.
 *
 * Functions:
 *   createFixtureBootAdapter(initial)   the adapter (+ `saveCount` for tests)
 */

import type { GameState, PersistenceAdapter } from '@mechanics';

export interface FixtureBootAdapter extends PersistenceAdapter {
    /** How many times `save()` ran this session. */
    readonly saveCount: number;
}

export function createFixtureBootAdapter(initial: GameState): FixtureBootAdapter {
    let current: GameState = initial;
    let saveCount = 0;
    return {
        get saveCount() {
            return saveCount;
        },
        load: () => current,
        save: (state: GameState) => {
            current = state;
            saveCount += 1;
        },
    };
}
