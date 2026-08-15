/**
 * Hermetic engine test — Phase 52e save migration (v16 → v17).
 *
 * Retires the rest minigame. Pins that a v16 save
 * loads clean at v17: the dead tutorial flag drops, `night-keepsake:*`
 * flags survive (`/memoir`'s REMAINS section reads them back), and a live
 * rest-minigame session riding along in the raw payload's mobile-only
 * `rest` key is cleared rather than carried forward in the old shape.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState } from '../index';
import { GAME_STATE_VERSION } from '../game.reducer';

/** A v16 save: a fresh state stamped back to v16. */
function v16Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    return { ...fresh, version: 16 };
}

describe('migrate v16 → v17 — retire the rest minigame', () => {
    it('the v16 → v17 hop is still on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(17);
        expect(migrate(v16Save(), 16, 17).version).toBe(17);
    });

    it('drops the dead night-watch-tutorial-done flag', () => {
        const raw = v16Save();
        raw.flags = ['night-watch-tutorial-done', 'some-other-flag'];

        const migrated = migrate(raw, 16, 17);
        expect(migrated.version).toBe(17);
        expect(migrated.flags).not.toContain('night-watch-tutorial-done');
        expect(migrated.flags).toContain('some-other-flag');
    });

    it('keeps night-keepsake:* flags — /memoir reads them back', () => {
        const raw = v16Save();
        raw.flags = ['night-keepsake:embers', 'night-keepsake:a-watchful-find'];

        const migrated = migrate(raw, 16, 17);
        expect(migrated.flags).toEqual(
            expect.arrayContaining(['night-keepsake:embers', 'night-keepsake:a-watchful-find']),
        );
    });

    it('clears a live rest-minigame session riding along in the raw payload', () => {
        const raw = v16Save();
        raw.flags = ['night-watch-tutorial-done', 'night-keepsake:embers', 'night-keepsake:a-watchful-find'];
        // Shape of the OLD (deleted) RestSession — a player mid-night at
        // update time. The new rest-choice screen would crash reading
        // `.offers` off this shape, so it must not survive migration.
        (raw as { rest?: unknown }).rest = {
            session: { phase: 'watch', posture: 'doze', warmth: 2, fire: 1 },
        };

        const migrated = migrate(raw, 16, 17) as unknown as Record<string, unknown>;
        expect(migrated.version).toBe(17);
        expect(migrated.rest).toBeUndefined();
        expect(migrated.flags).toEqual(
            expect.arrayContaining(['night-keepsake:embers', 'night-keepsake:a-watchful-find']),
        );
        expect(migrated.flags as string[]).not.toContain('night-watch-tutorial-done');
    });

    it('chains a v15 save straight to v17 in one call', () => {
        const fresh = createNewGameState();
        const raw = { ...fresh, version: 15, flags: ['night-watch-tutorial-done'] };

        const migrated = migrate(raw, 15, 17);
        expect(migrated.version).toBe(17);
        expect(migrated.flags).not.toContain('night-watch-tutorial-done');
    });
});
