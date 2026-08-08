/**
 * Hermetic engine test — Phase D5 save migration (v14 → v15).
 *
 * A pre-D5 (v14) save has no `player.dieGear`. Migrating backfills the concrete
 * default 4-color rail so upgrades write to a real per-save object and never
 * mutate the frozen `DEFAULT_DIE_GEAR`. Also pins the chained hop (a v13 save
 * lands at v15 in one call) and that an existing rail is preserved.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState } from '../index';
import { GAME_STATE_VERSION } from '../game.reducer';
import { DEFAULT_DIE_GEAR } from '../../Combat/combat.upgradeable-dice';

/** A v14 save: a fresh state stamped back to v14 with the rail stripped. */
function v14Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const player = { ...fresh.player };
    delete (player as { dieGear?: unknown }).dieGear;
    return { ...fresh, version: 14, player };
}

describe('migrate v14 → v15 — backfill the die-gear rail', () => {
    it('the v14 → v15 hop is still on the supported chain', () => {
        // The runtime version moves on (Phase 52a took it to 16); what this
        // suite owns is that the D5 hop survives every later bump.
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(15);
        expect(migrate(v14Save(), 14, 15).version).toBe(15);
    });

    it('backfills the full concrete default rail on a pre-D5 save', () => {
        const before = v14Save();
        expect((before.player as { dieGear?: unknown }).dieGear).toBeUndefined();

        const migrated = migrate(before, 14, 15);
        expect(migrated.version).toBe(15);
        const rail = migrated.player.dieGear!;
        expect(Object.keys(rail).sort()).toEqual(['body', 'heart', 'mind', 'wild']);
        expect(rail.wild).toEqual({ dieColor: 'wild', specialFaces: 1, manaFaces: 1, specialConviction: 2 });
        expect(rail.heart).toEqual({ dieColor: 'heart', specialFaces: 1, manaFaces: 2, specialConviction: 2 });
    });

    it('the backfilled rail is a copy, not the frozen default (mutable per-save)', () => {
        const migrated = migrate(v14Save(), 14, 15);
        expect(migrated.player.dieGear!.wild).not.toBe(DEFAULT_DIE_GEAR.wild);
        // Mutating the migrated rail must not throw and must not touch the default.
        migrated.player.dieGear!.wild!.manaFaces = 5;
        expect(DEFAULT_DIE_GEAR.wild.manaFaces).toBe(1);
    });

    it('preserves an already-present rail', () => {
        const raw = v14Save();
        (raw.player as { dieGear?: unknown }).dieGear = {
            heart: { dieColor: 'heart', specialFaces: 2, manaFaces: 2, specialConviction: 2 },
        };
        const migrated = migrate(raw, 14, 15);
        expect(migrated.player.dieGear!.heart!.specialFaces).toBe(2);
    });

    it('chains a v13 save straight to v15 in one call', () => {
        const fresh = createNewGameState();
        const player = { ...fresh.player };
        delete (player as { dieGear?: unknown }).dieGear;
        const v13 = { ...fresh, version: 13, player };
        const migrated = migrate(v13, 13, 15);
        expect(migrated.version).toBe(15);
        expect(migrated.player.dieGear).toBeDefined();
    });
});
