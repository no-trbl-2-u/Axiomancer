/**
 * World-step effect tick (Spec 08 Q3).
 *
 * On every `moveToNode` the player ticks their active effects as if a single
 * "exploration round" had passed:
 *   1. Apply HP regen (positive `regeneration.healthPerRound`).
 *   2. Apply HP drain (negative `regeneration.healthPerRound`).
 *   3. Apply DoT damage (`damageOverTime.damagePerRound × intensity`) — both
 *      tick phases collapse to a single world-tick (combat has phases; the
 *      world does not).
 *   4. Decrement `remainingDuration` for every non-permanent effect; drop any
 *      that hit zero.
 *
 * The function operates on a `Combatant`-shaped target (anything with
 * `effects`, `health`, `maxHealth`). The player matches that shape.
 */

import { ActiveEffect } from './types';
import { lookupEffect } from './effects.library';

/** Lightweight Combatant shape this module needs (avoids importing Combat). */
interface HazardBearer {
    health: number;
    maxHealth: number;
    effects: ActiveEffect[];
}

/**
 * Result of `processWorldEffectTick`. The numeric deltas are positive
 * quantities — `damage` is total HP lost, `healed` is total HP restored,
 * `expired` is the list of effects that hit zero duration this step.
 */
export interface WorldTickResult<T extends HazardBearer> {
    player: T;
    healed: number;
    damage: number;
    expired: ActiveEffect[];
}

/** Aggregates regen / drain / DoT and ticks duration for the world-step. */
export function processWorldEffectTick<T extends HazardBearer>(player: T): WorldTickResult<T> {
    let healed = 0;
    let damage = 0;

    for (const ae of player.effects) {
        const def = lookupEffect(ae.effectId);
        if (!def) continue;
        const intensity = ae.intensity ?? 1;

        const hp = (def.payload.regeneration?.healthPerRound ?? 0) * intensity;
        if (hp > 0) healed += hp;
        else if (hp < 0) damage += -hp;

        const dot = def.payload.damageOverTime;
        if (dot) {
            damage += dot.damagePerRound * intensity;
        }
    }

    const nextHealth = Math.max(0, Math.min(player.maxHealth, player.health + healed - damage));

    // Tick duration / collect expired.
    const expired: ActiveEffect[] = [];
    const remaining: ActiveEffect[] = [];
    for (const ae of player.effects) {
        if (ae.remainingDuration === -1) {
            remaining.push(ae);
            continue;
        }
        const ticked: ActiveEffect = { ...ae, remainingDuration: ae.remainingDuration - 1 };
        if (ticked.remainingDuration <= 0) {
            expired.push(ticked);
        } else {
            remaining.push(ticked);
        }
    }

    const next: T = { ...player, health: nextHealth, effects: remaining };
    return { player: next, healed, damage, expired };
}

/**
 * UI-facing list of hazards (DoT / drain effects) currently active on the
 * player. The engine just exposes the data; the exploration HUD renders.
 *
 * Returns one entry per active effect that contributes negative HP to a
 * world-step — DoT or negative regen. Buffs / non-hazard effects are
 * omitted.
 */
export interface ActiveHazard {
    effectId: string;
    name: string;
    intensity: number;
    remainingDuration: number;
    /** HP cost per world-step from this effect (intensity-scaled). */
    damagePerStep: number;
    /** Stance flavour of the damage, if any. */
    damageType?: string;
}

/** Returns the player's active hazards (Spec 08 Q4 — engine exposes data). */
export function getActiveHazards(player: { effects: ActiveEffect[] }): ActiveHazard[] {
    const hazards: ActiveHazard[] = [];
    for (const ae of player.effects) {
        const def = lookupEffect(ae.effectId);
        if (!def) continue;
        const intensity = ae.intensity ?? 1;
        const dotPerRound = def.payload.damageOverTime?.damagePerRound ?? 0;
        const regenHp     = def.payload.regeneration?.healthPerRound ?? 0;
        const damagePerStep = dotPerRound * intensity + (regenHp < 0 ? -regenHp * intensity : 0);
        if (damagePerStep <= 0) continue;
        hazards.push({
            effectId: ae.effectId,
            name: def.name,
            intensity,
            remainingDuration: ae.remainingDuration,
            damagePerStep,
            damageType: def.payload.damageOverTime?.damageType,
        });
    }
    return hazards;
}
