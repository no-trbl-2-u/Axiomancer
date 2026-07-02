import { createEnemy, type Enemy } from 'axiomancer-mechanics';

/**
 * Placeholder encounter the combat screen bootstraps when no combat is
 * in progress. Disappears once Spec 10 / Spec 07 wires real navigation
 * from exploration → combat.
 */
export function createMockEncounterEnemy(): Enemy {
    return createEnemy({
        id: 'carrion-hierophant',
        name: 'Carrion Hierophant',
        description: 'A robed figure that sings to the worms below.',
        level: 3,
        baseStats: { heart: 5, body: 6, mind: 7 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
        difficulty: 'elite' as never,
    });
}
