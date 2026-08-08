/**
 * Hermetic engine test — Phase 52a save migration (v15 → v16).
 *
 * The deck-removal primitive adds `player.cardRemovals`, the per-run counter
 * the escalating price reads. A pre-52a (v15) save has no such field. The hop
 * materialises it at 0 so a loaded save carries the counter explicitly — the
 * same stance the die-gear hop takes toward the rail — while the field stays
 * sparse-optional on fresh characters and `cardRemovalsOf` reads BOTH shapes
 * as 0.
 *
 * Also pins the chained hop (a v14 save lands at v16 in one call) and that an
 * existing count survives.
 */

import { describe, it, expect } from 'vitest';

import { migrate, createNewGameState, GAME_STATE_VERSION } from '../../index';
import { cardRemovalsOf, cardRemovalPriceFor } from '../card.removal';

/** A v15 save: a fresh state stamped back to v15 with the counter stripped. */
function v15Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const player = { ...fresh.player };
    delete (player as { cardRemovals?: unknown }).cardRemovals;
    return { ...fresh, version: 15, player };
}

describe('Phase 52a — migrate v15 → v16: default the card-removal counter', () => {
    it('the runtime version is 16', () => {
        expect(GAME_STATE_VERSION).toBe(16);
    });

    it('a v15 save loads clean at v16 with cardRemovals reading 0', () => {
        const before = v15Save();
        expect((before.player as { cardRemovals?: unknown }).cardRemovals).toBeUndefined();

        const migrated = migrate(before, 15, 16);
        expect(migrated.version).toBe(16);
        expect(migrated.player.cardRemovals).toBe(0);
        expect(cardRemovalsOf(migrated.player)).toBe(0);
        // A migrated save is charged the opening price, not a mid-run one.
        expect(cardRemovalPriceFor(migrated.player)).toBe(15);
    });

    it('carries everything else through untouched', () => {
        const before = v15Save();
        const migrated = migrate(before, 15, 16);
        expect(migrated.player.knownCards).toEqual((before.player as { knownCards: string[] }).knownCards);
        expect(migrated.flags).toEqual(before.flags);
        expect(migrated.runId).toBe(before.runId);
        expect(migrated.player.dieGear).toEqual((before.player as { dieGear?: unknown }).dieGear);
    });

    it('preserves an already-present count', () => {
        const raw = v15Save();
        (raw.player as { cardRemovals?: unknown }).cardRemovals = 3;
        const migrated = migrate(raw, 15, 16);
        expect(migrated.player.cardRemovals).toBe(3);
        expect(cardRemovalPriceFor(migrated.player)).toBe(45);
    });

    it('normalises a junk count to 0 rather than carrying it into the price', () => {
        const raw = v15Save();
        (raw.player as { cardRemovals?: unknown }).cardRemovals = -7;
        expect(migrate(raw, 15, 16).player.cardRemovals).toBe(0);
    });

    it('chains a v14 save straight to v16 in one call', () => {
        const fresh = createNewGameState();
        const player = { ...fresh.player };
        delete (player as { dieGear?: unknown }).dieGear;
        delete (player as { cardRemovals?: unknown }).cardRemovals;
        const v14 = { ...fresh, version: 14, player };

        const migrated = migrate(v14, 14);
        expect(migrated.version).toBe(GAME_STATE_VERSION);
        expect(migrated.player.dieGear).toBeDefined();
        expect(migrated.player.cardRemovals).toBe(0);
    });

    it('still refuses a save from an unsupported version', () => {
        expect(() => migrate({ version: 9 }, 9)).toThrow(/not supported/);
    });
});
