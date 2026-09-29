/**
 * Hermetic engine test — the v27 → v28 hop: THE REVAMP R3a world reset.
 *
 * R3a (D53/D54/D61 in `plan/2026-09-25-refactor-strategy.decisions.md`) makes
 * the world Act 1: the Lantern Deep's deep stair and the Labyrinth's vault
 * door are sealed and the northern maps are parked. A v27 save may stand on
 * fishing-village, a parked map or inside the Labyrinth. The hop moves it
 * onto the Lantern Deep (`ld-15` from the Labyrinth, `ld-18` otherwise); an
 * Act 1 save passes through with only its version stamped.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { createMapState, getMapDefinition } from '../../World/map.registry';
import { createLabyrinthProgress } from '../../World';
import type { MapName } from '../../World/map.library';
import type { GameState } from '../types';

/** A v27 save standing on `map`'s starting node. */
function v27On(map: MapName): Record<string, unknown> {
    return { ...createNewGameState({ startMap: map }), version: 27 };
}

/** A v27 save inside the Labyrinth, entered from the vault door. */
function v27InLabyrinth(withReturn: boolean): Record<string, unknown> {
    const outside = createNewGameState({ startMap: 'lantern-deep' });
    const returnWorld = {
        ...outside.world,
        currentMap: { ...outside.world.currentMap, currentNode: 'ld-15', completedNodes: ['ld-1', 'ld-3'] },
    };
    const inside = createMapState(getMapDefinition('labyrinth-continent', 'aporia-colonnade'));
    return {
        ...outside,
        version: 27,
        world: { ...outside.world, currentMap: inside },
        labyrinth: withReturn ? { ...createLabyrinthProgress(), returnWorld } : createLabyrinthProgress(),
    };
}

const hop = (raw: Record<string, unknown>): GameState => migrate(raw, 27, 28);

describe('migrate v27 → v28 (THE REVAMP R3a / D53, D54, D61)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(28);
        expect(hop(v27On('breakwater')).version).toBe(28);
    });

    it('leaves an Act 1 save where it stands', () => {
        const raw = v27On('charcoal-wood');
        const migrated = hop(raw);
        expect(migrated.world).toEqual(raw.world);
    });

    it('moves a fishing-village save onto the sealed deep stair', () => {
        const migrated = hop({ ...v27On('fishing-village'), currentEncounter: { origin: 'fv-2', enemies: [] } });
        expect(migrated.world.currentMap.name).toBe('lantern-deep');
        expect(migrated.world.currentMap.currentNode).toBe('ld-18');
        expect(migrated.world.currentContinent.name).toBe('northern-continent');
        expect(migrated.world.currentMap.pendingArrival).toBeNull();
        expect(migrated.currentEncounter).toBeUndefined();
        // The departed map is preserved like any travel, not lost.
        expect(migrated.world.mapStates?.['fishing-village']?.name).toBe('fishing-village');
    });

    it('moves a save on a parked map onto the sealed deep stair', () => {
        for (const map of ['northern-forest', 'caverns', 'the-capital'] as const) {
            const migrated = hop(v27On(map));
            expect(migrated.world.currentMap.name).toBe('lantern-deep');
            expect(migrated.world.currentMap.currentNode).toBe('ld-18');
        }
    });

    it('reuses the save\'s own Lantern Deep state when it has one', () => {
        const raw = v27On('fishing-village');
        const world = raw.world as GameState['world'];
        const deep = { ...createMapState(getMapDefinition('northern-continent', 'lantern-deep')), completedNodes: ['ld-3'] };
        const migrated = hop({ ...raw, world: { ...world, mapStates: { 'lantern-deep': deep } } });
        expect(migrated.world.currentMap.completedNodes).toContain('ld-3');
        expect(migrated.world.mapStates?.['lantern-deep']).toBeUndefined();
    });

    it('returns a Labyrinth save to the sealed vault door, from its return world', () => {
        const migrated = hop(v27InLabyrinth(true));
        expect(migrated.world.currentMap.name).toBe('lantern-deep');
        expect(migrated.world.currentMap.currentNode).toBe('ld-15');
        expect(migrated.world.currentMap.completedNodes).toContain('ld-3');
        expect(migrated.labyrinth).toBeDefined();
        expect(migrated.labyrinth).not.toHaveProperty('returnWorld');
    });

    it('returns a Labyrinth save with no return world to the vault door too', () => {
        const migrated = hop(v27InLabyrinth(false));
        expect(migrated.world.currentMap.name).toBe('lantern-deep');
        expect(migrated.world.currentMap.currentNode).toBe('ld-15');
        expect(migrated.world.mapStates?.['aporia-colonnade']).toBeUndefined();
    });

    it('is idempotent', () => {
        const once = hop(v27On('fishing-village'));
        const twice = migrate({ ...once, version: 27 }, 27, 28);
        expect(twice.world).toEqual(once.world);
    });
});
