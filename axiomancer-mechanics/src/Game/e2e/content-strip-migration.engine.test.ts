/**
 * Hermetic engine test — the v33 → v34 hop: the content strip.
 *
 * The parked world is gone: northern-forest and the five northern-continent
 * maps, their nine quests and the story flags their dialogue set. From v28
 * only dev travel reaches a parked map, but such a save must still load: the
 * hop moves it onto the Lantern Deep's sealed deep stair (`ld-18`) and scrubs
 * the deleted maps, quests and flags. Act 1 and Labyrinth saves stay put.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { createMapState, getMapDefinition } from '../../World/map.registry';
import type { GameState } from '../types';

/** A v33 save on a deleted map, hand-built from the Breakwater's shape. */
function v33OnDeletedMap(name: string, prefix: string): Record<string, unknown> {
    const fresh = createNewGameState({ startMap: 'breakwater' });
    const re = (ids: string[]): string[] => ids.map(id => id.replace(/^bw-/, `${prefix}-`));
    const bw = fresh.world.currentMap;
    const deleted = {
        ...bw,
        name,
        currentNode: `${prefix}-1`,
        completedNodes: re(bw.completedNodes),
        availableNodes: re(bw.availableNodes),
        lockedNodes: re(bw.lockedNodes),
        discoveredNodes: re(bw.discoveredNodes),
    };
    const coastal = {
        ...fresh.world.currentContinent,
        availableMaps: [...fresh.world.currentContinent.availableMaps, 'northern-forest'],
        completedMaps: ['northern-forest'],
    };
    return {
        ...fresh,
        version: 33,
        world: {
            ...fresh.world,
            currentContinent: coastal,
            world: fresh.world.world.map(c => (c.name === coastal.name ? coastal : c)),
            currentMap: deleted,
            mapStates: { 'northern-forest': { ...deleted, name: 'northern-forest' } },
        },
        currentEncounter: { origin: `${prefix}-2`, enemies: [] },
    };
}

function rawQuest(name: string): Record<string, unknown> {
    return { name, description: 'd', mapName: 'northern-forest', objectives: [], reward: 'experience', status: 'active' };
}

const hop = (raw: Record<string, unknown>): GameState => migrate(raw, 33, 34);

describe('migrate v33 → v34 (THE REVAMP R7e / D72)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(34);
        expect(hop({ ...createNewGameState(), version: 33 }).version).toBe(34);
    });

    it('moves a save on a deleted map onto the sealed deep stair', () => {
        for (const [map, prefix] of [['northern-forest', 'nf'], ['caverns', 'nc'], ['the-capital', 'cap']] as const) {
            const migrated = hop(v33OnDeletedMap(map, prefix));
            expect(migrated.world.currentMap.name).toBe('lantern-deep');
            expect(migrated.world.currentMap.currentNode).toBe('ld-18');
            expect(migrated.world.currentContinent.name).toBe('northern-continent');
            expect(migrated.currentEncounter).toBeUndefined();
        }
    });

    it('scrubs the deleted maps from the catalogue and mapStates', () => {
        const migrated = hop(v33OnDeletedMap('caverns', 'nc'));
        const deleted = ['northern-forest', 'caverns', 'northern-city', 'connecting-river', 'town-across-river', 'the-capital'];
        for (const c of [...migrated.world.world, migrated.world.currentContinent]) {
            for (const list of [c.availableMaps, c.lockedMaps, c.completedMaps]) {
                expect(list.filter(m => deleted.includes(m))).toEqual([]);
            }
        }
        expect(Object.keys(migrated.world.mapStates ?? {}).filter(m => deleted.includes(m))).toEqual([]);
    });

    it('drops the deleted quests and flags, keeps the rest', () => {
        const raw = {
            ...createNewGameState(),
            version: 33,
            quests: {
                available: [rawQuest('gather-wood')],
                active: [rawQuest('get-to-the-capital'), rawQuest('kept-quest')],
                completed: ['find-islanders', 'kept-done'],
            },
            flags: ['combat-tutorial-done', 'sweetheart-was-nominated', 'visited:nf-3', 'ncy-12:seen', 'bw-3:seen'],
        };
        const migrated = hop(raw);
        expect(migrated.quests.available).toEqual([]);
        expect(migrated.quests.active.map(q => q.name)).toEqual(['kept-quest']);
        expect(migrated.quests.completed).toEqual(['kept-done']);
        expect(migrated.flags).toEqual(['combat-tutorial-done', 'bw-3:seen']);
    });

    it('leaves an Act 1 save where it stands', () => {
        const raw = { ...createNewGameState({ startMap: 'charcoal-wood' }), version: 33 };
        expect(hop(raw).world).toEqual(raw.world);
    });

    it('leaves a Labyrinth save in the Labyrinth (D54)', () => {
        const outside = createNewGameState({ startMap: 'lantern-deep' });
        const inside = createMapState(getMapDefinition('labyrinth-continent', 'aporia-colonnade'));
        const raw = { ...outside, version: 33, world: { ...outside.world, currentMap: inside } };
        const migrated = hop(raw);
        expect(migrated.world.currentMap.name).toBe('aporia-colonnade');
        expect(migrated.labyrinth).toEqual(outside.labyrinth);
    });

    it('is idempotent', () => {
        const once = hop(v33OnDeletedMap('northern-forest', 'nf'));
        const twice = migrate({ ...once, version: 33 }, 33, 34);
        expect(twice).toEqual(once);
    });
});
