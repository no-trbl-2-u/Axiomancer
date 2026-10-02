/**
 * Hermetic engine test — loot-cache save migration (v19 → v20).
 *
 * The loot cache is `World/LootCacheChoice`'s three-offer choice, not the
 * Pick Pool minigame ("The Reliquary"). Pins that a v19 save loads clean at
 * v20: a live cache session riding along in the raw payload's mobile-only
 * `cache` key is cleared rather than carried forward in the old shape.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState } from '../index';
import { GAME_STATE_VERSION } from '../game.reducer';

/** A v19 save: a fresh state stamped back to v19. */
function v19Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    return { ...fresh, version: 19 };
}

describe('migrate v19 → v20 — retire the loot-cache Pick Pool minigame', () => {
    it('the v19 → v20 hop is still on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(20);
        expect(migrate(v19Save(), 19, 20).version).toBe(20);
    });

    it('clears a live cache session riding along in the raw payload', () => {
        const raw = v19Save();
        // Shape of the OLD (deleted) LootCacheSession — a player mid-delve
        // at update time. The mobile presenter would crash reading fields
        // off this shape, so it must not survive migration.
        (raw as { cache?: unknown }).cache = {
            session: { phase: 'picking', depth: 1, insightUsed: false },
        };

        const migrated = migrate(raw, 19, 20) as unknown as Record<string, unknown>;
        expect(migrated.version).toBe(20);
        expect(migrated.cache).toBeUndefined();
    });

    it('chains a v18 save straight to v20 in one call', () => {
        const fresh = createNewGameState();
        const raw = { ...fresh, version: 18 };

        const migrated = migrate(raw, 18, 20);
        expect(migrated.version).toBe(20);
    });
});
