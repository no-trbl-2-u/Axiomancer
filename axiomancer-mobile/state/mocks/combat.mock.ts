import { createEnemy, type Enemy } from '@mechanics';

/**
 * Placeholder encounter the combat screen bootstraps when no combat is
 * in progress. Disappears once Spec 10 / Spec 07 wires real navigation
 * from exploration → combat.
 */
export function createMockEncounterEnemy(): Enemy {
    return createEnemy({
        id: 'enemy-brine-hag',
        name: 'Brine Hag',
        description: 'She traded her reflection to the tide for the right to keep yours.',
        level: 3,
        baseStats: { heart: 5, body: 6, mind: 7 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
        difficulty: 'elite' as never,
    });
}
