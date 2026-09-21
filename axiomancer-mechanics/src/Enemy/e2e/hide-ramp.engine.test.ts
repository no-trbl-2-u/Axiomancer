/**
 * Hermetic engine test — THE EARLY HIDE RAMP (2026-09-20).
 *
 * After the grey office shipped (2 FREE / 5 PAID starters), a boss's old
 * HIDE floor of 3 made the fishing village's pinned level-3 King of Revenge
 * unwinnable for a deck with no rewards. T's ruling: the boss LOSES its HIDE
 * at that level; the deck is not buffed and the boss is not handicapped by
 * reward count. HIDE is now capped at `max(0, level − 3)` wherever a foe's
 * level is decided. Pins: the cap itself; the difficulty defaults at the
 * opening levels; `createEnemy`'s authored lists; `scaleEnemyToLevel` on the
 * King (bare at 3, HIDE 3 at his home level 6); only HIDE ramps; and the
 * live fishing-village boss event resolves bare-skinned.
 */

import { describe, it, expect } from 'vitest';
import {
    applyHideRamp, createEnemy, defaultEnemyKeywords, hideCapForLevel, HIDE_RAMP_FIRST_LEVEL,
} from '../index';
import { ENEMY_REGISTRY } from '../enemy.library';
import { scaleEnemyToLevel } from '../../World/encounter';
import { resolveMapEvent } from '../../World/MapEvents/resolve-map-event';
import '../../World/MapEvents/content';
import { createStartingWorld } from '../../World/index';
import { createMapState, getMapDefinition } from '../../World/map.registry';
import { createNewGameState } from '../../Game/game.reducer';
import type { EnemyKeyword } from '../enemy-keywords';
import type { MapState } from '../../World/types';

const hideOf = (keywords: readonly EnemyKeyword[] | undefined): number | null => {
    const k = (keywords ?? []).find(x => x.kind === 'hide');
    return k && k.kind === 'hide' ? k.n : null;
};

describe('the early HIDE ramp — the cap', () => {
    it('is max(0, level − 3): nothing through level 3, then one per level', () => {
        expect(HIDE_RAMP_FIRST_LEVEL).toBe(4);
        expect([1, 2, 3, 4, 5, 6, 10].map(hideCapForLevel)).toEqual([0, 0, 0, 1, 2, 3, 7]);
    });

    it('clamps HIDE only, drops a HIDE that clamps to zero, and leaves the rest alone', () => {
        const kit: EnemyKeyword[] = [{ kind: 'hide', n: 3 }, { kind: 'wounding', n: 18 }, { kind: 'brutal' }];
        expect(applyHideRamp(kit, 3)).toEqual([{ kind: 'wounding', n: 18 }, { kind: 'brutal' }]);
        expect(applyHideRamp(kit, 4)).toEqual([{ kind: 'hide', n: 1 }, { kind: 'wounding', n: 18 }, { kind: 'brutal' }]);
        expect(applyHideRamp(kit, 6)).toEqual(kit);
    });
});

describe('the early HIDE ramp — where a foe\'s level is decided', () => {
    it('the difficulty defaults carry no HIDE through level 3 and reach the old floors by level 6', () => {
        for (const d of ['elite', 'boss', 'unique'] as const) {
            for (const lv of [1, 2, 3]) expect(hideOf(defaultEnemyKeywords(lv, d)), `${d} L${lv}`).toBeNull();
        }
        expect(hideOf(defaultEnemyKeywords(6, 'boss'))).toBe(3);
        expect(hideOf(defaultEnemyKeywords(6, 'elite'))).toBe(2);
        // The non-HIDE parts of a kit are untouched by the ramp.
        expect(defaultEnemyKeywords(1, 'boss')).toEqual([{ kind: 'brutal' }]);
    });

    it('createEnemy bows an authored HIDE to the level cap', () => {
        const low = createEnemy({ id: 'ramp-test-low', name: 'Ramp Test', level: 2, difficulty: 'elite', baseStats: { heart: 2, body: 2, mind: 2 }, keywords: [{ kind: 'hide', n: 5 }] } as never);
        expect(hideOf(low.keywords)).toBeNull();
        const mid = createEnemy({ id: 'ramp-test-mid', name: 'Ramp Test', level: 8, difficulty: 'elite', baseStats: { heart: 8, body: 8, mind: 8 }, keywords: [{ kind: 'hide', n: 5 }] } as never);
        expect(hideOf(mid.keywords)).toBe(5);
    });

    it('scaleEnemyToLevel strips the King of Revenge\'s HIDE at the fishing-village pin and keeps it at his home level', () => {
        const king = ENEMY_REGISTRY['king-of-revenge'];
        expect(hideOf(king.keywords)).toBe(3); // authored at level 6
        const pinned = scaleEnemyToLevel(king, 3);
        expect(hideOf(pinned.keywords)).toBeNull();
        expect((pinned.keywords ?? []).some(k => k.kind === 'wounding')).toBe(true); // only HIDE ramps
        expect(hideOf(scaleEnemyToLevel(king, 6).keywords)).toBe(3);
        expect(hideOf(scaleEnemyToLevel(king, 4).keywords)).toBe(1);
    });

    it('the live fishing-village boss event resolves a bare-skinned King', () => {
        const base = { ...createNewGameState(), world: createStartingWorld() };
        const map: MapState = { ...createMapState(getMapDefinition('coastal-continent', 'fishing-village')), currentNode: 'fv-6' };
        const result = resolveMapEvent({ ...base, world: { ...base.world, currentMap: map } });
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind !== 'encounter') return;
        const foe = result.event.encounter.enemies[0]!;
        expect(foe.id).toContain('king');
        expect(foe.level).toBe(3);
        expect(hideOf(foe.keywords)).toBeNull();
    });
});
