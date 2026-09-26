/**
 * Act 1's fights (map revamp, D30).
 *
 * T, 2026-09-26: no bosses in Act 1; instead, one elite fight per region, the
 * map's last fight before the door. Where the map narrows to one node before
 * the door (the Breakwater's watchtower) every run meets it; where the last
 * fight column is a ring, it sits on the ring's centre lane.
 *
 * Every Act 1 fight is pinned low (brief §3b), and the elite is too: an
 * unpinned elite would scale to its own roster level (7 and up).
 */

import { describe, expect, it } from 'vitest';

import { getMapDefinition, getNodeEventPool } from '../index';
import { EnemiesByMap } from '../../Enemy/enemy.library';

const ACT1_MAPS = [
    ['coastal-continent', 'breakwater'],
    ['coastal-continent', 'charcoal-wood'],
    ['northern-continent', 'beacon-crags'],
    ['northern-continent', 'lantern-deep'],
] as const;

describe.each(ACT1_MAPS)('Act 1 fights on %s / %s (D30)', (continent, mapName) => {
    const map = getMapDefinition(continent, mapName);
    const roster = new Map(EnemiesByMap[mapName].map(e => [e.id.replace(/^enemy-/, ''), e]));
    const fights = map.nodes.flatMap(node => {
        const payload = getNodeEventPool(continent, mapName, node.id)?.entries[0]?.payload;
        if (payload?.kind !== 'encounter') return [];
        return [{ node, payload, foe: roster.get(payload.enemySlug!) }];
    });

    it('has no boss', () => {
        expect(fights.filter(f => f.payload.isBoss)).toEqual([]);
    });

    it('stages exactly one elite, on the last fight column', () => {
        const elites = fights.filter(f => f.foe?.difficulty === 'elite');
        expect(elites.map(f => f.node.id)).toHaveLength(1);
        const lastColumn = Math.max(...fights.map(f => f.node.location[0]));
        expect(elites[0]!.node.location[0]).toBe(lastColumn);
    });

    it('pins the elite to an Act 1 level', () => {
        const elite = fights.find(f => f.foe?.difficulty === 'elite')!;
        expect(elite.payload.level).toBeGreaterThanOrEqual(2);
        expect(elite.payload.level).toBeLessThanOrEqual(4);
    });
});
