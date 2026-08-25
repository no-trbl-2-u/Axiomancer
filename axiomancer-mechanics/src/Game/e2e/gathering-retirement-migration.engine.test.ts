/**
 * Hermetic engine test — Phase 76 save migration (v18 → v19).
 *
 * Retires the Gathering minigame ("The Gleaning"). Pins that a v18 save
 * loads clean at v19: a live gathering session riding along in the raw
 * payload's mobile-only `gathering` key is cleared rather than carried
 * forward in the old shape.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState } from '../index';
import { GAME_STATE_VERSION } from '../game.reducer';

/** A v18 save: a fresh state stamped back to v18. */
function v18Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    return { ...fresh, version: 18 };
}

describe('migrate v18 → v19 — retire the Gathering minigame', () => {
    it('the v18 → v19 hop is still on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(19);
        expect(migrate(v18Save(), 18, 19).version).toBe(19);
    });

    it('clears a live gathering session riding along in the raw payload', () => {
        const raw = v18Save();
        // Shape of the OLD (deleted) GatheringSession — a player mid-gleaning
        // at update time. The mobile presenter would crash reading fields
        // off this shape, so it must not survive migration.
        (raw as { gathering?: unknown }).gathering = {
            session: { phase: 'idle', siteId: 'mire-mint', wrath: 2 },
        };

        const migrated = migrate(raw, 18, 19) as unknown as Record<string, unknown>;
        expect(migrated.version).toBe(19);
        expect(migrated.gathering).toBeUndefined();
    });

    it('chains a v17 save straight to v19 in one call', () => {
        const fresh = createNewGameState();
        const raw = { ...fresh, version: 17 };

        const migrated = migrate(raw, 17, 19);
        expect(migrated.version).toBe(19);
    });
});
