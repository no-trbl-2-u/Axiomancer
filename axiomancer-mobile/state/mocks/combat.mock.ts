import { ENEMY_REGISTRY, deepClone, type Enemy } from '@mechanics';

/**
 * Placeholder encounter the combat screen bootstraps when no combat is
 * in progress. Disappears once Spec 10 / Spec 07 wires real navigation
 * from exploration → combat.
 *
 * THE BIG NUMBERS REWRITE (2026-09-02) — this stub used to be its own foe: a
 * level-3 hand-typed stat block wearing the Brine Hag's name, which meant every
 * mock-driven surface rehearsed numbers no real fight would ever show.
 *
 * Playtest fix 2026-09-04 — it then became a second hand-typed copy of the
 * library's `enemy-brine-hag` that had already drifted (a truncated
 * description, no threat/proc/loot tables). It now CLONES the library entry;
 * the mock owns nothing of its own: the revamp (R2b, D63) deleted the enemy
 * keywords it once wore to rehearse the keyword chips.
 */
export function createMockEncounterEnemy(): Enemy {
    return deepClone(ENEMY_REGISTRY['brine-hag']);
}
