/**
 * Effect application resolver.
 *
 * **Phase 80 — direction (a) pure split (2026-05-24).** Effect-application
 * always lands for target-side resolution. Damage rolls separately + applies
 * resistance independently (damage-side primitive is a Phase 80 follow-up).
 *
 * Tier 1 — Auto-applies, no roll. (Unchanged across Phase 80.)
 *
 * Tier 2 BUFF — Caster rolls d20 to apply to themselves. (Unchanged across
 *   Phase 80 per Phase 79 D8 — caster-side variance is NOT target-resist;
 *   direction (a) only removes target-resist on Tier 2 debuffs + Tier 3.)
 *   Nat 1:  Fumble — buff fails.
 *   Nat 20: Crit  — buff applies at double intensity.
 *
 * Tier 2 DEBUFF — **Always lands.** No target-resist roll; no Nat-20 rebound;
 *   no Nat-1 overwhelmed-double-duration. Effect applies unconditionally at
 *   requested intensity + duration. (Phase 80 change.)
 *
 * Tier 3 — **Always lands.** No Nat-20 miraculous escape. (Phase 80 change —
 *   uniform always-land across debuff tiers per direction (a).)
 *
 * Pre-Phase-80 behaviour preserved in git history. Dead-code branches
 * (resist, rebound) pruned at Phase 84 + Phase 86. The `rebounded` field
 * removed from `EffectApplicationResult` at this iterate drain.
 *
 * Direction (a)'s damage-side text ("damage rolls separately + applies its
 * own resistance") requires a damage-resist primitive that doesn't exist
 * today; filed as a Pending candidate at Phase 80 ship-time.
 */

import { createDieRoll } from '../Utils';
import { ActiveEffect, EffectType, EffectApplicationResult } from '../Effects/types';
import { Combatant } from './types';

/**
 * Resolves whether `activeEffect` lands on `target`. Returns a full
 * EffectApplicationResult so callers can render the battle log directly.
 *
 * Post-Phase-80: Tier 2 debuffs + Tier 3 always succeed; only Tier 2 buffs
 * still roll (caster-side fumble/crit). The `attackerHeartBonus` /
 * `equipmentBonus` parameters stay on the signature for call-site stability
 * but are now unused on the load-bearing debuff path.
 */
export function resolveEffectApplication(
    target: Combatant,
    activeEffect: ActiveEffect,
    effectType: EffectType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    attackerHeartBonus = 0,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    equipmentBonus = 0,
): EffectApplicationResult {
    const tier = activeEffect.tier;

    if (tier === 1) {
        return { success: true, activeEffect, message: `Effect applied automatically.` };
    }

    if (tier === 2 && effectType === 'buff') {
        // Phase 80 D2 — caster-side fumble/crit KEPT (Phase 79 D8 lock-in).
        const roll = createDieRoll('neutral')();

        if (roll === 1) {
            return {
                success: false,
                message: `Fumble! Concentration shattered — the buff fizzles out.`,
                roll: { rolled: roll, resistStat: 0, total: roll, dr: 0, wasCrit: false, wasFumble: true },
            };
        }

        if (roll === 20) {
            const critEffect: ActiveEffect = {
                ...activeEffect,
                intensity: Math.min((activeEffect.intensity ?? 1) * 2, 6),
            };
            return {
                success: true, activeEffect: critEffect,
                message: `Critical focus! The buff surges at double intensity.`,
                roll: { rolled: roll, resistStat: 0, total: roll, dr: 0, wasCrit: true, wasFumble: false },
            };
        }

        return {
            success: true, activeEffect,
            message: `Buff applied.`,
            roll: { rolled: roll, resistStat: 0, total: roll, dr: 0, wasCrit: false, wasFumble: false },
        };
    }

    if (tier === 2 && effectType === 'debuff') {
        // Phase 80 direction (a) pure split — Tier 2 debuffs always land.
        // Target-resist roll removed; Nat-20 rebound + Nat-1 overwhelmed
        // semantics removed. Damage-resist primitive lives in a follow-up
        // phase (filed at Phase 80 ship-time per D1).
        return {
            success: true,
            activeEffect,
            message: `Effect lands.`,
        };
    }

    if (tier === 3) {
        // Phase 80 D3 — Tier 3 always lands. Nat-20 miraculous escape removed
        // for uniform always-land semantics across debuff tiers.
        return {
            success: true,
            activeEffect,
            message: `Inescapable. The Tier 3 effect takes hold.`,
        };
    }

    return { success: false, message: `Unknown effect tier — effect not applied.` };
}
