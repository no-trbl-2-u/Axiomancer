/**
 * MapEvents 'quest' kind (Phase 137) — hermetic dispatcher coverage.
 * The ninth kind hands the host a quest-board id; the handler is a
 * validated pass-through (the board is fully sandboxed).
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { applyPayload, resolveQuest } from '../handlers';
import type { QuestEventPayload } from '../types';

const PAYLOAD: QuestEventPayload = { kind: 'quest', boardId: 'build-the-boat' };

describe("MapEvents 'quest' kind", () => {
    it('resolves to the board id without touching state', () => {
        const state = createNewGameState();
        const result = resolveQuest(state, PAYLOAD);
        expect(result.state).toBe(state);
        expect(result.event).toEqual({ kind: 'quest', boardId: 'build-the-boat' });
    });

    it('dispatches through applyPayload', () => {
        const state = createNewGameState();
        const result = applyPayload(state, PAYLOAD, () => 0.5);
        expect(result.event).toEqual({ kind: 'quest', boardId: 'build-the-boat' });
    });

    it('rejects unknown board ids at resolution time', () => {
        const state = createNewGameState();
        expect(() =>
            resolveQuest(state, { kind: 'quest', boardId: 'no-such-board' }),
        ).toThrow(/unknown board/);
    });
});
