/**
 * Hermetic engine test — 2026-08-28 save migration (v20 → v21).
 *
 * Inter-map travel makes the `world` continent catalogue real. Every v20
 * save carries `world: []` — the catalogue was never populated, so
 * `changeContinent` could only no-op. Pins that a v20 save loads clean at
 * v21: the two-continent catalogue is seeded, the save's own
 * `currentContinent` (with whatever completed / available state it
 * accumulated) replaces the matching seeded entry, `currentMap` passes
 * through untouched, and `mapStates` defaults to `{}`.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';

/** A v20 save: a fresh state with the pre-travel empty catalogue, stamped back. */
function v20Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const { mapStates: _mapStates, ...worldWithout } = fresh.world;
    return {
        ...fresh,
        world: { ...worldWithout, world: [] },
        version: 20,
    } as unknown as Record<string, unknown>;
}

describe('migrate v20 → v21 — seed the continent catalogue (inter-map travel)', () => {
    it('the v20 → v21 hop is on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(21);
        expect(migrate(v20Save(), 20, 21).version).toBe(21);
    });

    it('seeds the two-continent catalogue onto a save with world: []', () => {
        const migrated = migrate(v20Save(), 20, 21);
        expect(migrated.world.world.map(c => c.name)).toEqual(
            ['coastal-continent', 'northern-continent'],
        );
        const northern = migrated.world.world.find(c => c.name === 'northern-continent')!;
        expect(northern.lockedMaps).toContain('caverns');
    });

    it("preserves the save's own currentContinent state in the seeded catalogue", () => {
        const raw = v20Save();
        // A save that had already unlocked the forest and completed the
        // village the pre-travel way (dev tools / dialogue effects).
        (raw.world as { currentContinent: Record<string, unknown> }).currentContinent = {
            name: 'coastal-continent',
            description: 'weathered',
            availableMaps: ['fishing-village', 'northern-forest'],
            lockedMaps: [],
            completedMaps: ['fishing-village'],
        };

        const migrated = migrate(raw, 20, 21);
        const coastal = migrated.world.world.find(c => c.name === 'coastal-continent')!;
        expect(coastal.completedMaps).toEqual(['fishing-village']);
        expect(coastal.availableMaps).toContain('northern-forest');
        expect(coastal.lockedMaps).toEqual([]);
        // currentContinent passes through untouched and IS the catalogue entry.
        expect(migrated.world.currentContinent).toEqual(coastal);
    });

    it('passes currentMap through untouched and defaults mapStates to {}', () => {
        const raw = v20Save();
        const beforeMap = JSON.parse(JSON.stringify((raw.world as { currentMap: unknown }).currentMap));

        const migrated = migrate(raw, 20, 21);
        expect(JSON.parse(JSON.stringify(migrated.world.currentMap))).toEqual(beforeMap);
        expect(migrated.world.mapStates).toEqual({});
    });

    it('keeps an already-populated catalogue (idempotent over a re-stamped v21 shape)', () => {
        const fresh = createNewGameState();
        const raw = { ...fresh, version: 20 } as unknown as Record<string, unknown>;

        const migrated = migrate(raw, 20, 21);
        expect(migrated.world.world).toEqual(fresh.world.world);
        expect(migrated.world.mapStates).toEqual({});
    });

    it('chains a v19 save straight to v21 in one call', () => {
        const raw = v20Save();
        raw.version = 19;
        const { mapGoodwill: _mapGoodwill, ...withoutGoodwill } = raw;

        const migrated = migrate(withoutGoodwill, 19, 21);
        expect(migrated.version).toBe(21);
        expect(migrated.mapGoodwill).toEqual({});
        expect(migrated.world.world.map(c => c.name)).toEqual(
            ['coastal-continent', 'northern-continent'],
        );
    });
});
