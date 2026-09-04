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
 * description, no threat/proc/loot tables). It now CLONES the library entry, so
 * the only thing the mock owns is the one deliberate divergence below.
 *
 * Deliberate divergence — KEYWORDS. The library Brine Hag prints none; the
 * mock wears HIDE 4 + RAVENOUS (the elite allowance, §6.4) so the enemy pane's
 * keyword chips, their reminder-text plaques, the HIDE receipt and the RAVENOUS
 * heal line are exercised the moment the placeholder renders. A real map
 * encounter of hers will NOT show them. (The map route also doubles the foe's
 * VITAE via `ENCOUNTER_ENEMY_HP_MULTIPLIER`; the placeholder does not, so its
 * bar is a rehearsal figure too.)
 */
export function createMockEncounterEnemy(): Enemy {
    const foe = deepClone(ENEMY_REGISTRY['brine-hag']);
    // HIDE is the armour floor that makes one heavy blow beat four light
    // ones; RAVENOUS is the bargain in mechanical form — what she takes off
    // you, she keeps.
    foe.keywords = [{ kind: 'hide', n: 4 }, { kind: 'ravenous' }];
    return foe;
}
