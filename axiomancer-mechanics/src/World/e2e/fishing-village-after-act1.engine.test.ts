/**
 * Fishing-village follows Act 1 (map revamp M3e, D35).
 *
 * Since the new-game start moved to the Breakwater (D27), a run reaches
 * fishing-village only after all four Act 1 maps. Its fights used to sit at
 * their own levels (1-3, the opening map's ramp) and its King at 3: below
 * the Act 1 elites the player had already beaten. M3e pins every fight at
 * the Act 1 late band and the King one level above the last Act 1 elite.
 *
 * The enemy roster reset (R2, D61) retired the King — the village boss is the
 * Doorwarden — and made each Act 1 region's last fight a Doorwarden door
 * boss, so "the last Act 1 elite" became the last Act 1 door fight.
 */

import { describe, expect, it } from 'vitest';

import { getMapDefinition, getNodeEventPool } from '../index';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import type { EnemySlug } from '../../Enemy/enemy.library';

const ACT1_MAPS = [
    ['coastal-continent', 'breakwater'],
    ['coastal-continent', 'charcoal-wood'],
    ['northern-continent', 'beacon-crags'],
    ['northern-continent', 'lantern-deep'],
] as const;

function fightsOn(continent: string, mapName: string) {
    const map = getMapDefinition(continent as never, mapName as never);
    return map.nodes.flatMap(node => {
        const payload = getNodeEventPool(continent, mapName, node.id)?.entries[0]?.payload;
        if (payload?.kind !== 'encounter' || !payload.enemySlug) return [];
        const foe = ENEMY_REGISTRY[payload.enemySlug as EnemySlug];
        return [{ nodeId: node.id, payload, foe }];
    });
}

const act1 = ACT1_MAPS.flatMap(([c, m]) => fightsOn(c, m));
const act1Elites = act1.filter(f => f.foe.difficulty === 'elite');
const lastAct1EliteLevel = Math.max(...act1Elites.map(f => f.payload.level!));
const lastAct1DoorLevel = Math.max(...act1.filter(f => f.payload.isBoss).map(f => f.payload.level!));
const act1Levels = act1.flatMap(f => (f.payload.level === undefined ? [] : [f.payload.level]));

const village = fightsOn('coastal-continent', 'fishing-village');
const boss = village.filter(f => f.payload.isBoss);
const fights = village.filter(f => !f.payload.isBoss);

describe('fishing-village after Act 1 (M3e)', () => {
    it('keeps one boss, the Doorwarden (the King was retired in R2)', () => {
        expect(boss.map(f => f.payload.enemySlug)).toEqual(['the-doorwarden']);
    });

    it('pins every fight, so none scales down to its own opening-map level', () => {
        expect(fights.length).toBeGreaterThan(0);
        for (const f of fights) expect(f.payload.level, f.nodeId).toBeDefined();
    });

    it('fights at the Act 1 late band, never below the Act 1 elites', () => {
        const act1Top = Math.max(...act1Levels);
        for (const f of fights) {
            expect(f.payload.level, f.nodeId).toBe(act1Top);
            expect(f.payload.level!, f.nodeId).toBeGreaterThanOrEqual(lastAct1EliteLevel);
        }
    });

    it('puts the boss one above the last Act 1 door fight', () => {
        expect(boss[0]!.payload.level).toBe(lastAct1DoorLevel + 1);
    });
});
