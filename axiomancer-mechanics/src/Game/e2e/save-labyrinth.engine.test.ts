/**
 * Hermetic e2e — a save keeps the Aporia's progress (map revamp M4).
 *
 * `GameState.labyrinth` (W-01) was documented as "persisted with the save",
 * but both save paths picked their fields by hand and left it out, so every
 * fragment, gate and descent was lost on reload. M4 needs it on disk: an open
 * visit's way back (`returnWorld`) rides on it. Both paths now share one
 * field list (`durableSlice` in `store.ts`); this pins them both.
 */

import { describe, it, expect } from 'vitest';

import { createStartingWorld } from '../../World';
import { createLabyrinthProgress } from '../../World/Labyrinth/labyrinth.engine';
import { createGameStore } from '../store';
import type { GameState } from '../types';
import type { PersistenceAdapter } from '../persistence/types';

function recordingAdapter(initial: GameState | null = null): PersistenceAdapter & { last: GameState | null } {
    const wrapper = {
        last: initial,
        load: () => wrapper.last,
        save: (state: GameState) => { wrapper.last = JSON.parse(JSON.stringify(state)) as GameState; },
    };
    return wrapper;
}

const PROGRESS = { ...createLabyrinthProgress(), currentAct: 'act2' as const, pocket: [], assertionDebt: 3 };

describe('a save keeps GameState.labyrinth', () => {
    it('the explicit save() writes it, and a store booted on that save reads it back', () => {
        const adapter = recordingAdapter();
        const store = createGameStore(adapter, { labyrinth: PROGRESS });

        store.getState().save();

        expect(adapter.last?.labyrinth).toEqual(PROGRESS);
        expect(createGameStore(adapter).getState().labyrinth).toEqual(PROGRESS);
    });

    it('the durable-action autosave writes it too', () => {
        const adapter = recordingAdapter();
        const store = createGameStore(adapter, { labyrinth: PROGRESS });

        store.getState().dispatch({ type: 'SAVE_GAME' });

        expect(adapter.last?.labyrinth).toEqual(PROGRESS);
    });

    it('a run that never entered the Aporia saves no labyrinth field', () => {
        const adapter = recordingAdapter();
        const store = createGameStore(adapter, { world: createStartingWorld() });

        store.getState().save();

        expect(adapter.last).not.toBeNull();
        expect('labyrinth' in (adapter.last as object)).toBe(false);
    });
});
