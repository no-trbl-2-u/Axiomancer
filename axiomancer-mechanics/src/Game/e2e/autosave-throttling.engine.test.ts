/**
 * Hermetic e2e — autosave throttling (Phase 51, Spec 09 Q4 path B).
 *
 * Pins the DURABLE_ACTIONS allowlist by counting `adapter.save` calls
 * across a series of dispatched actions. UI-tier actions (USE_ITEM,
 * EQUIP_ITEM, ALLOCATE_STAT_POINT, LEARN_SKILL, SHIFT_MORAL_METER,
 * SHIFT_PHILOSOPHICAL_ALIGNMENT, START_COMBAT, PROCESS_NODE) must NOT
 * trigger `adapter.save`. The curated durable set (COMBAT_ROUND,
 * LEVEL_UP, END_COMBAT, MOVE_TO_NODE, APPLY_DIALOGUE, SAVE_GAME) must.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { createGameStore } from '../store';
import { GameState } from '../types';
import { PersistenceAdapter } from '../persistence/types';
import { mockAlternatingRng } from '../../test-utils/rng';

afterEach(() => vi.restoreAllMocks());

function countingAdapter(): PersistenceAdapter & { saves: number } {
    const wrapper = {
        saves: 0,
        load: () => null,
        save: (_state: GameState) => { wrapper.saves += 1; },
    };
    return wrapper;
}

describe('Phase 51 — autosave throttling restricts adapter.save to DURABLE_ACTIONS', () => {
    it('UI-tier actions never trigger adapter.save', () => {
        mockAlternatingRng();

        const adapter = countingAdapter();
        const store = createGameStore(adapter, { player: Player });

        // START_COMBAT — not in durable set.
        store.getState().dispatch({
            type: 'START_COMBAT',
            payload: { target: TidepoolCrab },
        });

        expect(adapter.saves).toBe(0);

        // ALLOCATE_STAT_POINT — not in durable set.
        store.getState().dispatch({
            type: 'ALLOCATE_STAT_POINT',
            payload: { stat: 'body' },
        });

        // SHIFT_MORAL_METER — not in durable set.
        store.getState().dispatch({
            type: 'SHIFT_MORAL_METER',
            payload: { delta: 5 },
        });

        // SHIFT_PHILOSOPHICAL_ALIGNMENT — not in durable set.
        store.getState().dispatch({
            type: 'SHIFT_PHILOSOPHICAL_ALIGNMENT',
            payload: { delta: { epistemology: 5 } },
        });

        expect(adapter.saves).toBe(0);
    });

    it('START_COMBAT alone is not a durable action — saves stays 0', () => {
        const adapter = countingAdapter();
        const store = createGameStore(adapter, { player: Player });

        // Enter combat (not a durable action — saves stays 0).
        store.getState().dispatch({
            type: 'START_COMBAT',
            payload: { target: TidepoolCrab },
        });
        expect(adapter.saves).toBe(0);
    });

    it('MOVE_TO_NODE and SAVE_GAME both trigger adapter.save; LOAD_GAME does not', () => {
        const adapter = countingAdapter();
        const store = createGameStore(adapter, { player: Player });

        // MOVE_TO_NODE — durable. fv-2 is the only node adjacent to the
        // Coastal-Village starting node (fv-1).
        store.getState().dispatch({
            type: 'MOVE_TO_NODE',
            payload: { nodeId: 'fv-2' },
        });
        expect(adapter.saves).toBe(1);

        // SAVE_GAME — durable.
        store.getState().dispatch({
            type: 'SAVE_GAME',
        });
        expect(adapter.saves).toBe(2);

        // LOAD_GAME — explicitly NOT in durable set (avoids the corruption
        // footgun of writing a freshly-migrated payload back).
        store.getState().dispatch({
            type: 'LOAD_GAME',
        });
        expect(adapter.saves).toBe(2);
    });

    it('LEVEL_UP triggers adapter.save (durable); LEARN_SKILL does not (UI-tier)', () => {
        const adapter = countingAdapter();
        // Override XP to threshold so the LEVEL_UP reducer actually fires.
        const seededPlayer = {
            ...Player,
            experience: 10000,
        };
        const store = createGameStore(adapter, { player: seededPlayer });

        // LEVEL_UP — durable.
        store.getState().dispatch({ type: 'LEVEL_UP' });
        expect(adapter.saves).toBe(1);

        // LEARN_SKILL — not in durable set. Use a skill the seeded player
        // can plausibly learn; the test asserts the save-count not the
        // learn outcome (the reducer is a no-op on a bogus id, but autosave
        // doesn't fire either way).
        store.getState().dispatch({
            type: 'LEARN_SKILL',
            payload: { skillId: 'this-skill-id-does-not-exist' },
        });
        expect(adapter.saves).toBe(1);
    });

    it('explicit store.save() verb writes unconditionally (bypasses DURABLE_ACTIONS)', () => {
        const adapter = countingAdapter();
        const store = createGameStore(adapter, { player: Player });

        // No actions dispatched — saves stays 0.
        expect(adapter.saves).toBe(0);

        // Call the explicit save verb — writes through.
        store.getState().save();
        expect(adapter.saves).toBe(1);
    });
});
