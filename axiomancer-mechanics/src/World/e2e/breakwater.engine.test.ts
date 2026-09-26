/**
 * The Breakwater — Act 1, map 1 (map revamp M3a; D21, D25–D29).
 *
 * Pins what the map revamp decided for the first Act 1 map:
 * - a new game starts here (D27), and any campaign map can be started on
 *   instead (the dev "start on any map" tools);
 * - the map borrows fishing-village's pools and roster (D29), with one
 *   authored event on every node and a door on to the Charcoal Wood (M3b);
 * - every run ends at the river bridge, through the watchtower.
 *
 * The generic gauntlet invariants (no strands, column law, ribs, distinct
 * coordinates) run over this map in `map-traversal.engine.test.ts` like every
 * other registered map. The D25/D16 layout pins live in mobile, where the
 * landmarks and the sheet are.
 */

import { describe, expect, it } from 'vitest';

import {
    createStartingWorld, STARTING_MAP, STARTABLE_MAPS,
    getMapDefinition, createMapState, resolveMapEvent,
} from '../index';
import { auditMapTraversal } from '../world.reducer';
import { createNewGameState } from '../../Game/game.reducer';
import { STARTING_REGION } from '../../Game/run-loop';
import { EnemiesByMap } from '../../Enemy/enemy.library';
import type { GameState } from '../../Game/types';

const breakwater = getMapDefinition('coastal-continent', 'breakwater');

/** A fresh game standing on `nodeId` of the Breakwater. */
function standingOn(nodeId: string): GameState {
    const base = createNewGameState();
    return {
        ...base,
        world: {
            ...base.world,
            currentMap: { ...createMapState(breakwater), currentNode: nodeId },
        },
    };
}

describe('the new-game start (D27)', () => {
    it('starts a new game on the Breakwater, at the windmill', () => {
        expect(STARTING_MAP).toBe('breakwater');
        expect(STARTING_REGION).toBe('breakwater');
        const world = createNewGameState().world;
        expect(world.currentContinent.name).toBe('coastal-continent');
        expect(world.currentMap.name).toBe('breakwater');
        expect(world.currentMap.currentNode).toBe('bw-1');
    });

    it('lists the Breakwater available and every other campaign map locked', () => {
        const [coastal, northern] = createStartingWorld().world;
        expect(coastal!.availableMaps).toEqual(['breakwater']);
        expect(coastal!.lockedMaps).toEqual(['charcoal-wood', 'fishing-village', 'northern-forest']);
        expect(northern!.availableMaps).toEqual([]);
        expect(northern!.lockedMaps).toEqual([
            'beacon-crags', 'caverns', 'northern-city', 'connecting-river', 'town-across-river', 'the-capital',
        ]);
    });
});

describe('starting on any map (dev tools)', () => {
    it('offers every campaign map and no labyrinth act', () => {
        expect([...STARTABLE_MAPS].sort()).toEqual([
            'beacon-crags', 'breakwater', 'caverns', 'charcoal-wood', 'connecting-river', 'fishing-village',
            'northern-city', 'northern-forest', 'the-capital', 'town-across-river',
        ]);
    });

    it.each(STARTABLE_MAPS.map(m => [m]))('places a fresh game on %s, at its start node, on its own continent', map => {
        const world = createNewGameState({ startMap: map }).world;
        expect(world.currentMap.name).toBe(map);
        expect(world.currentContinent.name).toBe(world.currentMap.continent);
        const def = getMapDefinition(world.currentMap.continent, map);
        expect(world.currentMap.currentNode).toBe(def.startingNode.id);
        const own = world.world.find(c => c.name === world.currentContinent.name)!;
        expect(own.availableMaps).toEqual([map]);
        expect(world.currentContinent).toBe(own);
    });

    it('refuses a labyrinth act', () => {
        expect(() => createStartingWorld('aporia-colonnade')).toThrow(/not a startable campaign map/);
    });
});

describe('the Breakwater map', () => {
    it('carries one node per landmark on the coast plate (D25: 18)', () => {
        expect(breakwater.nodes).toHaveLength(18);
        expect(breakwater.nodes.map(n => n.id)).toEqual(
            Array.from({ length: 18 }, (_, i) => `bw-${i + 1}`),
        );
    });

    it('ends every run at the river bridge, through the watchtower', () => {
        const audit = auditMapTraversal(breakwater);
        expect(audit.strands).toEqual([]);
        expect(audit.terminalNodes).toEqual(['bw-18']);
        const watchtower = breakwater.nodes.find(n => n.id === 'bw-17')!;
        expect(watchtower.connectedNodes).toEqual(['bw-18']);
    });

    it('borrows fishing-village\'s enemy pool whole (D29)', () => {
        expect(EnemiesByMap['breakwater']).toBe(EnemiesByMap['fishing-village']);
    });
});

describe('the Breakwater\'s events (D29)', () => {
    const kinds = Object.fromEntries(
        breakwater.nodes.map(n => [n.id, resolveMapEvent(standingOn(n.id)).event.kind]),
    );

    it('resolves an authored event on every node', () => {
        expect(Object.values(kinds)).not.toContain('empty');
        expect(Object.keys(kinds)).toHaveLength(18);
    });

    it('spreads 6 encounters, 3 rests, 3 loot caches, 3 gatherings, 2 hazards and 1 door', () => {
        const tally: Record<string, number> = {};
        for (const k of Object.values(kinds)) tally[k] = (tally[k] ?? 0) + 1;
        expect(tally).toEqual({
            encounter: 6, rest: 3, 'loot-cache': 3, gathering: 3, hazard: 2, travel: 1,
        });
    });

    it('opens on a rest at the windmill: the start node owes the player nothing dangerous', () => {
        expect(kinds['bw-1']).toBe('rest');
    });

    it('fights water-holger at the watchtower, the last fight before the door', () => {
        const r = resolveMapEvent(standingOn('bw-17'));
        expect(r.event.kind).toBe('encounter');
    });

    it('crosses the river bridge into the Charcoal Wood (Act 1, map 2)', () => {
        const r = resolveMapEvent(standingOn('bw-18'));
        expect(r.event.kind).toBe('travel');
        expect(r.state.world.currentMap.name).toBe('charcoal-wood');
        expect(r.state.world.currentMap.currentNode).toBe('cw-1');
    });
});
