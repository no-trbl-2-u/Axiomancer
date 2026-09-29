/**
 * The Lantern Deep — Act 1, map 4 (map revamp M3d; D21, D25–D31).
 *
 * Pins what the map revamp decided for the last Act 1 map:
 * - on `northern-continent` (D28): the Beacon Crags' glacier shrine goes down
 *   into it, and this map's deep stair leads on into fishing-village (D27),
 *   where the shipped chain resumes;
 * - the map borrows the shipped builders, the caverns' roster and its iron
 *   (D29), with one authored event on every node;
 * - the caverns' roster is level 13 and up, so every fight here is pinned low;
 * - the vault door (`ld-15`) is the Labyrinth's (D24, M4): open on arrival,
 *   never consumed, and it names the act the durable progress is on.
 *
 * The generic gauntlet invariants (no strands, column law, ribs, distinct
 * coordinates) run over this map in `map-traversal.engine.test.ts` like every
 * other registered map. The D25/D16 layout pins live in mobile, where the
 * landmarks and the sheet are.
 */

import { describe, expect, it } from 'vitest';

import {
    getMapDefinition, createMapState, resolveMapEvent, getNodeEventPool, createLabyrinthProgress,
} from '../index';
import { auditMapTraversal } from '../world.reducer';
import { createNewGameState } from '../../Game/game.reducer';
import { EnemiesByMap, EnemyLibrary } from '../../Enemy/enemy.library';
import type { GameState } from '../../Game/types';

const lanternDeep = getMapDefinition('northern-continent', 'lantern-deep');

/** A fresh game standing on `nodeId` of the Lantern Deep. */
function standingOn(nodeId: string): GameState {
    const base = createNewGameState({ startMap: 'lantern-deep' });
    return {
        ...base,
        world: {
            ...base.world,
            currentMap: { ...createMapState(lanternDeep), currentNode: nodeId },
        },
    };
}

describe('the Lantern Deep map', () => {
    it('carries one node per landmark on the underworld plate (D25: 18)', () => {
        expect(lanternDeep.nodes).toHaveLength(18);
        expect(lanternDeep.nodes.map(n => n.id)).toEqual(
            Array.from({ length: 18 }, (_, i) => `ld-${i + 1}`),
        );
    });

    it('sits on the northern continent (D28)', () => {
        expect(lanternDeep.continent).toBe('northern-continent');
    });

    it('ends every run at the deep stair', () => {
        const audit = auditMapTraversal(lanternDeep);
        expect(audit.strands).toEqual([]);
        expect(audit.unreachableNodes).toEqual([]);
        expect(audit.terminalNodes).toEqual(['ld-18']);
    });

    it('borrows the caverns\' enemy pool whole (D29)', () => {
        expect(EnemiesByMap['lantern-deep']).toBe(EnemiesByMap['caverns']);
    });
});

describe('the Lantern Deep\'s events (D29)', () => {
    const kinds = Object.fromEntries(
        lanternDeep.nodes.map(n => [n.id, resolveMapEvent(standingOn(n.id)).event.kind]),
    );
    /** Each node's authored payload (every Lantern Deep pool has one entry). */
    const payloads = lanternDeep.nodes.map(
        n => getNodeEventPool('northern-continent', 'lantern-deep', n.id)!.entries[0]!.payload,
    );

    it('resolves an authored event on every node', () => {
        expect(Object.values(kinds)).not.toContain('empty');
        expect(Object.keys(kinds)).toHaveLength(18);
    });

    it('spreads 7 encounters, 3 rests, a loot cache, 2 gatherings, 2 hazards, an arrival, the Labyrinth door and a stair', () => {
        const tally: Record<string, number> = {};
        for (const k of Object.values(kinds)) tally[k] = (tally[k] ?? 0) + 1;
        expect(tally).toEqual({
            encounter: 7, rest: 3, 'loot-cache': 1, gathering: 2, hazard: 2, cutscene: 1, labyrinth: 1, travel: 1,
        });
    });

    it('opens on the arrival down the stair, at the surface stair (D31)', () => {
        expect(kinds['ld-1']).toBe('cutscene');
    });

    it('pins every fight low: 3 above the aqueducts, 4 below them', () => {
        const fights = payloads.filter(p => p.kind === 'encounter');
        expect(fights).toHaveLength(7);
        for (const payload of fights) {
            if (payload.kind !== 'encounter') continue;
            expect(payload.enemySlug).toBeDefined();
            expect(EnemyLibrary.map(e => e.portraitAsset)).toContain(payload.enemySlug);
            expect(payload.level).toBeGreaterThanOrEqual(3);
            expect(payload.level).toBeLessThanOrEqual(4);
        }
    });

    it('rests only in camps: the deep has no settlement inn (Phase 52b)', () => {
        const shelters = payloads.flatMap(p => (p.kind === 'rest' ? [p.shelter] : []));
        expect(shelters).toEqual(['camp', 'camp', 'camp']);
    });

    it('gathers only the caverns\' own iron', () => {
        const items = payloads.flatMap(p => (p.kind === 'gathering' ? p.items.map(i => i.id) : []));
        expect(items).toEqual(['iron-ore', 'iron-ore']);
    });

    it('opens the Labyrinth at the vault door on arrival, with no gate (D24)', () => {
        const before = standingOn('ld-15');
        const r = resolveMapEvent(before);
        expect(r.event).toMatchObject({ kind: 'labyrinth', act: 'act1' });
        // The engine only names the act; the host swaps the world.
        expect(r.state.world.currentMap.name).toBe('lantern-deep');
        expect(r.state.world.currentMap.currentNode).toBe('ld-15');
    });

    it('keeps the vault door a door: never consumed, and the way on opens', () => {
        const r = resolveMapEvent(standingOn('ld-15'));
        expect(r.state.world.currentMap.consumedNodes).not.toContain('ld-15');
        for (const next of ['ld-16', 'ld-17']) {
            expect(r.state.world.currentMap.availableNodes).toContain(next);
        }
        expect(resolveMapEvent(r.state).event.kind).toBe('labyrinth');
    });

    it('opens the act the player left, not act I, on a return', () => {
        const base = standingOn('ld-15');
        const r = resolveMapEvent({
            ...base,
            labyrinth: { ...createLabyrinthProgress(), currentAct: 'act2' },
        });
        expect(r.event).toMatchObject({ kind: 'labyrinth', act: 'act2' });
    });

    it('leaves down the deep stair into fishing-village, where the shipped chain resumes (D27)', () => {
        const r = resolveMapEvent(standingOn('ld-18'));
        expect(r.event.kind).toBe('travel');
        expect(r.state.world.currentContinent.name).toBe('coastal-continent');
        expect(r.state.world.currentMap.name).toBe('fishing-village');
        expect(r.state.world.currentMap.currentNode).toBe('fv-1');
    });
});
