import { createEnemy, enemyStatBudget, type Enemy } from '@mechanics';

/**
 * Placeholder encounter the combat screen bootstraps when no combat is
 * in progress. Disappears once Spec 10 / Spec 07 wires real navigation
 * from exploration → combat.
 *
 * THE BIG NUMBERS REWRITE (2026-09-02) — this stub used to be its own foe: a
 * level-3 hand-typed stat block wearing the Brine Hag's name, which meant every
 * mock-driven surface rehearsed numbers no real fight would ever show. It now
 * mirrors the library's `enemy-brine-hag` (level 7, elite, heart-weighted
 * budget), so `maxHealth` falls out of the `enemyVitae` curve instead of the
 * retired per-stat health formula, and it carries printed KEYWORDS so the
 * enemy pane's chips and their reminder-text popups are exercised the moment
 * the placeholder renders.
 */
export function createMockEncounterEnemy(): Enemy {
    return createEnemy({
        id: 'enemy-brine-hag',
        portraitAsset: 'brine-hag',
        name: 'Brine Hag',
        description: 'She traded her reflection to the tide for the right to keep yours.',
        stanceHint: 'She works on the feelings first — the bargain is already half-made in your chest.',
        level: 7,
        baseStats: enemyStatBudget(7, { heart: 4, body: 1, mind: 2 }),
        mapName: 'fishing-village' as never,
        logic: 'strategic' as never,
        difficulty: 'elite' as never,
        // Two keywords, the elite allowance (§6.4). HIDE is the armour floor
        // that makes one heavy blow beat four light ones; RAVENOUS is the
        // bargain in mechanical form — what she takes off you, she keeps.
        keywords: [{ kind: 'hide', n: 4 }, { kind: 'ravenous' }],
    });
}
