/**
 * Hermetic tests — dev enemy-picker helpers.
 *
 * Pins:
 *   - Every roster map is listed and every late-game boss is reachable.
 *   - `listEnemies` sorts by level and flags boss-tier foes.
 *   - `stageEncounter` seeds a combat prelude whose `isBoss` follows the
 *     foe's tier, can be forced, and that `selectHasActiveCombatPrelude`
 *     recognises.
 */

import { EnemiesByMap } from '@mechanics';

import { listEnemies, listEnemyMaps, stageEncounter } from '@/state/dev/enemy-picker';
import { selectHasActiveCombatPrelude } from '@/state/presenters/event.engine';
import { createAppStore } from '@/state/store';

describe('enemy-picker dev helpers', () => {
    it('lists every roster map including the labyrinth acts', () => {
        expect(listEnemyMaps()).toEqual(Object.keys(EnemiesByMap));
        expect(listEnemyMaps()).toEqual(expect.arrayContaining(['aporia-proof', 'northern-city']));
    });

    it('sorts by level and flags bosses', () => {
        const roster = listEnemies('aporia-proof');
        const levels = roster.map((r) => r.enemy.level);
        expect([...levels].sort((a, b) => a - b)).toEqual(levels);
        expect(roster.some((r) => r.isBoss)).toBe(true);
        expect(roster.find((r) => r.isBoss)!.label).toContain('· L');
    });

    it('stageEncounter seeds a boss prelude for a boss foe', () => {
        const store = createAppStore();
        const boss = listEnemies('caverns').find((r) => r.isBoss)!;
        stageEncounter(store, boss.enemy);
        const slice = store.getState().event;
        expect(selectHasActiveCombatPrelude(store.getState())).toBe(true);
        expect(slice.sourceNodeType).toBe('boss');
        const event = slice.pending!.event as { isBoss: boolean; encounter: { enemies: { id: string }[]; origin: string } };
        expect(event.isBoss).toBe(true);
        expect(event.encounter.enemies[0].id).toBe(boss.enemy.id);
        expect(event.encounter.origin).toBe('dev:enemy-picker');
    });

    it('stageEncounter can force isBoss and tags the origin', () => {
        const store = createAppStore();
        const grunt = listEnemies('fishing-village').find((r) => !r.isBoss)!;
        stageEncounter(store, grunt.enemy, 'dev:test', true);
        const slice = store.getState().event;
        expect(slice.sourceNodeType).toBe('boss');
        expect((slice.pending!.event as { encounter: { origin: string } }).encounter.origin).toBe('dev:test');
    });
});
