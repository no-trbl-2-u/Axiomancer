/**
 * Hermetic engine test — Phase 61 save migration (v17 → v18).
 *
 * Retires the Quest Board minigame. Pins that a v17 save loads clean at
 * v18: a live quest-board session riding along in the raw payload's
 * mobile-only `quest` key is cleared rather than carried forward in the
 * old shape.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState } from '../index';
import { GAME_STATE_VERSION } from '../game.reducer';

/** A v17 save: a fresh state stamped back to v17. */
function v17Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    return { ...fresh, version: 17 };
}

describe('migrate v17 → v18 — retire the Quest Board minigame', () => {
    it('the v17 → v18 hop is still on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(18);
        expect(migrate(v17Save(), 17, 18).version).toBe(18);
    });

    it('clears a live quest-board session riding along in the raw payload', () => {
        const raw = v17Save();
        // Shape of the OLD (deleted) QuestBoardSession — a player mid-board
        // at update time. The mobile presenter would crash reading fields
        // off this shape, so it must not survive migration.
        (raw as { quest?: unknown }).quest = {
            session: { phase: 'idle', boardId: 'build-the-boat', position: 3 },
        };

        const migrated = migrate(raw, 17, 18) as unknown as Record<string, unknown>;
        expect(migrated.version).toBe(18);
        expect(migrated.quest).toBeUndefined();
    });

    it('chains a v16 save straight to v18 in one call', () => {
        const fresh = createNewGameState();
        const raw = { ...fresh, version: 16 };

        const migrated = migrate(raw, 16, 18);
        expect(migrated.version).toBe(18);
    });
});
