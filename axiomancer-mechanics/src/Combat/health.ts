/**
 * Health helpers shared by Character and Enemy. All functions are pure and
 * preserve the input combatant's discriminant (Character vs Enemy).
 *
 * The `healCharacter` back-compat alias is re-exported by `src/Combat/index.ts`
 * via `export { heal as healCharacter }` — no separate declaration here.
 */

import { Combatant } from './types';

/** Returns a copy of the combatant with `damage` subtracted from health (clamped at 0). */
export function applyDamage<T extends Combatant>(combatant: T, damage: number): T {
    return { ...combatant, health: Math.max(0, combatant.health - damage) };
}

/**
 * Phase 32 part 1 (Harvest — REAP attacks MAXIMUM HP): subtracts `amount`
 * from BOTH `health` and `maxHealth`, each floored independently at 0. An
 * invariant-preserving subtraction, not a clamp-after-the-fact — because
 * both fields start from the same pre-erosion state and drop by the same
 * amount, `health <= maxHealth` holds automatically with no extra
 * enforcement code. Callers that also need the shared damage-instance clock
 * (BLEED's `applyEnemyDamage` funnel) should NOT call this in addition to
 * that path — see `applyEnemyDamage`'s `erode` parameter in
 * `combat.engine.ts`, which sources the clock off this same subtraction
 * rather than double-applying it.
 */
export function erodeMaxHealth<T extends Combatant>(combatant: T, amount: number): T {
    return {
        ...combatant,
        maxHealth: Math.max(0, combatant.maxHealth - amount),
        health: Math.max(0, combatant.health - amount),
    };
}

/** Returns a copy of the combatant with `amount` healed (clamped at maxHealth). */
export function heal<T extends Combatant>(combatant: T, amount: number): T {
    return { ...combatant, health: Math.min(combatant.maxHealth, combatant.health + amount) };
}

/** True if the combatant has positive health remaining. */
export function isAlive(combatant: Combatant): boolean { return combatant.health > 0; }

/** True if the combatant has been defeated (health ≤ 0). */
export function isDefeated(combatant: Combatant): boolean { return combatant.health <= 0; }

/** Health as a percentage (0-100) of max. */
export function getHealthPercentage(combatant: Combatant): number {
    return (combatant.health / combatant.maxHealth) * 100;
}
