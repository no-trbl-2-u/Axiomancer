/**
 * Hermetic engine test — the v32 → v33 hop: THE REVAMP R7c alt-win purge.
 *
 * R7c (D47/D50, `plan/revamp/engine.md`) deletes the alt-win systems. The
 * save's `regionConsequences` slice (spared / exploited regions) was never
 * written, and its only reader, the spared-region boss buff, is gone. The hop
 * drops the slice and leaves the rest of the save untouched.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import type { GameState } from '../types';

/** A v32 save still carrying the region-consequences slice. */
function v32WithRegionConsequences(): Record<string, unknown> {
    const fresh = createNewGameState({ startMap: 'breakwater' });
    return {
        ...fresh,
        flags: ['combat-tutorial-done'],
        regionConsequences: { exploitedRegions: [], sparedRegions: ['breakwater'] },
        version: 32,
    };
}

const hop33 = (raw: Record<string, unknown>): GameState => migrate(raw, 32, 33);

describe('migrate v32 → v33 (THE REVAMP R7c / D47: the alt-win purge)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(33);
        expect(hop33(v32WithRegionConsequences()).version).toBe(33);
    });

    it('drops the region-consequences slice and keeps the rest', () => {
        const migrated = hop33(v32WithRegionConsequences());
        expect('regionConsequences' in migrated).toBe(false);
        expect(migrated.flags).toEqual(['combat-tutorial-done']);
        expect(migrated.codex).toEqual({ unlockedEntries: [] });
    });

    it('is idempotent', () => {
        const once = hop33(v32WithRegionConsequences());
        const twice = migrate({ ...once, version: 32 } as unknown as Record<string, unknown>, 32, 33);
        expect(twice).toEqual(once);
    });

    it('chains from v31', () => {
        const migrated = migrate({ ...v32WithRegionConsequences(), version: 31 }, 31, 33);
        expect(migrated.version).toBe(33);
        expect('regionConsequences' in migrated).toBe(false);
    });

    it('a fresh game carries no region-consequences slice', () => {
        expect('regionConsequences' in createNewGameState({ startMap: 'breakwater' })).toBe(false);
    });
});
