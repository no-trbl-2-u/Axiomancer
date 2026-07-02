/**
 * Effect-driven combat helpers — read-only queries plus pure mutators that
 * operate on a combatant's `effects` array (regen, thorns, marks, ticks,
 * buff manipulation, DoT, drain, cleanse / dispel).
 */

import { ActiveEffect } from '../Effects/types';
import { lookupEffect } from '../Effects/effects.library';
import { removeEffectsByType } from '../Effects';
import { MAX_EFFECT_DURATION } from '../Game/game-mechanics.constants';
import { Combatant } from './types';
import { applyDamage, heal } from './health';
import { getActiveEffectModifiers, getDotAmplificationByEffect } from './effect-modifiers';
import { getRng } from '../Utils/rng';

/** ID of the Mind studying mark. Used by Mind/Attack to add bonus damage. */
export const MIND_MARK_ID = 'tier1_mind_mark';

/** Current intensity of the Mind studying mark on a combatant (0 if absent). */
export function getStudyMarkIntensity(target: Combatant): number {
    const mark = target.effects.find(e => e.effectId === MIND_MARK_ID);
    return mark?.intensity ?? 0;
}

/**
 * Sums every active effect's contribution to the combatant's roll modifier:
 *   total = Σ (rollModifier) + Σ (rollModifierPerIntensity × intensity)
 */
export function getActiveRollModifier(target: Combatant): number {
    return target.effects.reduce((total, ae) => {
        const def = lookupEffect(ae.effectId);
        const flat         = def?.payload.rollModifier ?? 0;
        const perIntensity = (def?.payload.rollModifierPerIntensity ?? 0) * (ae.intensity ?? 1);
        return total + flat + perIntensity;
    }, 0);
}

/**
 * Total thorns reflect damage to deal back to an attacker after a successful
 * hit on the bearer. Sums (reflectDamage × intensity) across all effects.
 */
export function getThornsReflect(bearer: Combatant): number {
    return bearer.effects.reduce((total, ae) => {
        const def = lookupEffect(ae.effectId);
        const perIntensity = def?.payload.reflectDamage ?? 0;
        return total + perIntensity * (ae.intensity ?? 1);
    }, 0);
}

// ─── 0.34.0 status-depth epic — HP-model selectors + tunable scalars ──────────
// These power the new card mechanics (VULNERABLE / RUPTURE / COMPOUND / DISRUPT)
// and the mobile honesty layer. Pure reads over a combatant's `effects`; the HP
// behavior itself is owned by `combat.engine.ts`. Registered in the tuning
// registry (`src/Tuning/tunable.registry.ts`) so `/combat-tuning` can rebalance
// them by simulation; `effects.ts` is a writable (non-engine) home for them.

/** VULNERABLE — hard ceiling on the outgoing-damage multiplier against a marked
 *  target. Conservative for burst (a marked foe takes at most ×2.0). Tunable. */
export const VULNERABLE_MAX_MULT = 2.0;
/** RUPTURE — hard cap on a single detonation's burst HP, so a long DoT stack
 *  can't one-shot a boss. Tunable. */
export const RUPTURE_BURST_CAP = 80;
/** COMPOUND — cap on the distinct-debuff count credited to a compound hit, so
 *  variety pays off without unbounded scaling. Tunable. */
export const COMPOUND_COUNT_CAP = 6;
/** DISRUPT — distinct-control pip threshold that DENIES the enemy's telegraphed
 *  turn (an ADDITIVE OR path on top of the legacy roll-penalty deny). Tunable. */
export const DISRUPT_DENY_AT = 3;
/** EXECUTE — fraction of the foe's MAX HP a ready finisher deals (clamped to the
 *  foe's remaining HP, so it is typically lethal at/below the HP gate). Tunable. */
export const EXECUTE_DAMAGE_FRACTION = 0.75;
/** AMPLIFY — default multiplier applied to the foe's pending DoT total for an
 *  AMPLIFY burst. The per-card `multiplier` field may override this; the tunable
 *  tunes the default that card authors use. */
export const AMPLIFY_DEFAULT_MULTIPLIER = 1.5;
/** AMPLIFY — hard cap on a single AMPLIFY detonation's burst HP. Weaker than
 *  RUPTURE_BURST_CAP by design — AMPLIFY does NOT consume the DoT (it keeps
 *  ticking), so the burst is a bonus on top of ongoing damage. Tunable. */
export const AMPLIFY_BURST_CAP = 60;

/**
 * VULNERABLE multiplier — the outgoing-damage multiplier the HP engine applies to
 * every HP source it lands on this bearer. Aggregated additively across the
 * bearer's OWN `damageTakenMult` payloads:
 *   mult = 1 + Σ ((damageTakenMult - 1) × intensity)
 * clamped to `[1, VULNERABLE_MAX_MULT]`. Returns EXACTLY `1` when the bearer
 * carries no marker, so every existing exact-HP assertion is byte-identical.
 * Pure.
 */
export function getDamageTakenMultiplier(bearer: Combatant): number {
    let mult = 1;
    for (const ae of bearer.effects) {
        const def = lookupEffect(ae.effectId);
        const dtm = def?.payload.damageTakenMult;
        if (dtm === undefined) continue;
        mult += (dtm - 1) * (ae.intensity ?? 1);
    }
    return Math.min(VULNERABLE_MAX_MULT, Math.max(1, mult));
}

/** One pending DoT effect's remaining lifetime total (amplification-aware). */
export interface PendingDotEntry {
    effectId: string;
    label: string;
    /** floor(damagePerRound × intensity × comboMultiplier) × max(1, remainingDuration). */
    amount: number;
}

/**
 * The total DoT HP still pending on the bearer over the effects' remaining
 * lifetimes — the figure RUPTURE detonates. Amplification-aware (reuses the same
 * combo multiplier the aggregator applies), floored per-tick then multiplied by
 * the remaining duration (permanent DoT counts one tick). Pure.
 */
export function getPendingDotTotal(bearer: Combatant): { total: number; perEffect: PendingDotEntry[] } {
    const dotAmp = getDotAmplificationByEffect(bearer.effects);
    const perEffect: PendingDotEntry[] = [];
    let total = 0;
    for (const ae of bearer.effects) {
        const def = lookupEffect(ae.effectId);
        const dot = def?.payload.damageOverTime;
        if (!def || !dot) continue;
        const intensity = ae.intensity ?? 1;
        const multiplier = dotAmp.get(ae.effectId) ?? 1;
        const perTick = Math.floor(dot.damagePerRound * intensity * multiplier);
        const ticks = Math.max(1, ae.remainingDuration);
        const amount = perTick * ticks;
        perEffect.push({ effectId: ae.effectId, label: def.name, amount });
        total += amount;
    }
    return { total, perEffect };
}

/**
 * Strips every DoT effect from the bearer (RUPTURE consumes them on detonation).
 * Returns the updated combatant and the consumed effect ids. Pure.
 */
export function consumeDotEffects<T extends Combatant>(bearer: T): { combatant: T; consumed: string[] } {
    const consumed: string[] = [];
    const remaining = bearer.effects.filter(ae => {
        if (lookupEffect(ae.effectId)?.payload.damageOverTime) {
            consumed.push(ae.effectId);
            return false;
        }
        return true;
    });
    return { combatant: { ...bearer, effects: remaining }, consumed };
}

/** Count of DISTINCT debuff effect ids on the bearer — COMPOUND's scaler. Pure. */
export function getDistinctDebuffCount(bearer: Combatant): number {
    const ids = new Set<string>();
    for (const ae of bearer.effects) {
        if (lookupEffect(ae.effectId)?.type === 'debuff') ids.add(ae.effectId);
    }
    return ids.size;
}

/**
 * Count of DISTINCT CONTROL effect ids on the bearer — the DISRUPT deny meter's
 * pip count. Control = an `actionRestriction` (skip/forced/blocked) OR a NEGATIVE
 * roll modifier (the soft-control / accuracy-down bucket). Centralizes the
 * predicate so the engine and the mobile meter agree on what counts. Pure.
 */
export function getDistinctControlCount(bearer: Combatant): number {
    const ids = new Set<string>();
    for (const ae of bearer.effects) {
        const p = lookupEffect(ae.effectId)?.payload;
        if (!p) continue;
        const r = p.actionRestriction;
        const restricts = !!r && (r.skipTurn === true || r.forcedStance !== undefined || (r.blockedStances?.length ?? 0) > 0);
        const softControl = (p.rollModifier ?? 0) < 0 || (p.rollModifierPerIntensity ?? 0) < 0;
        if (restricts || softControl) ids.add(ae.effectId);
    }
    return ids.size;
}

/**
 * Decrements the remainingDuration of one specific active effect by 1.
 * Permanent effects (-1) are untouched. Does not remove expired effects;
 * use `tickAllEffects` for the full cleanup.
 */
export function updateEffectDuration<T extends Combatant>(target: T, effectId: string): T {
    const updated = target.effects.map(effect => {
        if (effect.effectId !== effectId) return effect;
        if (effect.remainingDuration === -1) return effect;
        return { ...effect, remainingDuration: effect.remainingDuration - 1 };
    });
    return { ...target, effects: updated };
}

/**
 * Decrements every non-permanent effect's remaining duration by 1, removes
 * any that expired, and returns both the updated combatant and the list of
 * expired effects (for UI announcements).
 */
export function tickAllEffects<T extends Combatant>(target: T): { target: T; expired: ActiveEffect[] } {
    const expired: ActiveEffect[] = [];
    const remaining = target.effects.reduce<ActiveEffect[]>((acc, effect) => {
        if (effect.remainingDuration === -1) {
            acc.push(effect);
            return acc;
        }
        const ticked = { ...effect, remainingDuration: effect.remainingDuration - 1 };
        if (ticked.remainingDuration <= 0) {
            expired.push(ticked);
        } else {
            acc.push(ticked);
        }
        return acc;
    }, []);

    return { target: { ...target, effects: remaining }, expired };
}

/**
 * Removes one random buff (effect with `type === 'buff'`) from the combatant.
 * Returns the updated combatant and the removed effect (or `null` if none).
 */
export function removeRandomBuff<T extends Combatant>(target: T): { target: T; removed: ActiveEffect | null } {
    const buffs = target.effects.filter(ae => lookupEffect(ae.effectId)?.type === 'buff');
    if (buffs.length === 0) return { target, removed: null };

    const removed = buffs[Math.floor(getRng().random() * buffs.length)];
    const updated = target.effects.filter(ae => ae !== removed);
    return { target: { ...target, effects: updated }, removed };
}

/**
 * Extends one random buff's duration by `amount` rounds (capped at the
 * MAX_EFFECT_DURATION). Returns the updated combatant and the extended effect.
 */
export function extendRandomBuffDuration<T extends Combatant>(
    target: T,
    amount: number,
): { target: T; extended: ActiveEffect | null } {
    const buffs = target.effects.filter(ae => lookupEffect(ae.effectId)?.type === 'buff');
    if (buffs.length === 0) return { target, extended: null };

    const original = buffs[Math.floor(getRng().random() * buffs.length)];
    const extended: ActiveEffect = {
        ...original,
        remainingDuration: Math.min(original.remainingDuration + amount, MAX_EFFECT_DURATION),
    };
    const updated = target.effects.map(ae => ae === original ? extended : ae);
    return { target: { ...target, effects: updated }, extended };
}

/**
 * Applies start-of-round health regeneration from all positive
 * `regeneration.healthPerRound` payloads on the combatant. Per Q2, regen is
 * intensity-scaled. Healing is clamped at `maxHealth` by `heal()`.
 */
export function applyRegen<T extends Combatant>(target: T): { target: T; healed: number } {
    const mods = getActiveEffectModifiers(target.effects);
    if (mods.healthRegen <= 0) return { target, healed: 0 };
    return { target: heal(target, mods.healthRegen), healed: mods.healthRegen };
}

/**
 * Applies drain (negative `regeneration.healthPerRound`) per Q6 as a unique
 * raw-HP loss, separate from regen and from DoT. Drain bypasses defense (it's
 * the body wasting itself, not an external hit) and is dealt at round start.
 */
export function applyDrain<T extends Combatant>(target: T): { target: T; drained: number } {
    const mods = getActiveEffectModifiers(target.effects);
    if (mods.healthDrain <= 0) return { target, drained: 0 };
    return { target: applyDamage(target, mods.healthDrain), drained: mods.healthDrain };
}

/**
 * Applies damage-over-time damage for the given phase (Q4). Each DoT effect
 * declares an optional `tickPhase` (`'start'` or `'end'`); without one the
 * effect ticks at start. Per Q5, DoT damage is unresisted — it bypasses
 * defense and the `damageType` is purely informational for now.
 */
export function processDamageOverTime<T extends Combatant>(
    target: T,
    phase: 'start' | 'end',
): { target: T; damage: number } {
    const mods = getActiveEffectModifiers(target.effects);
    const damage = phase === 'start' ? mods.dotStart : mods.dotEnd;
    if (damage <= 0) return { target, damage: 0 };
    return { target: applyDamage(target, damage), damage };
}

/**
 * Round-start orchestration. Order:
 *   1. HP regen
 *   2. Drain (negative regen)
 *   3. Start-phase DoT
 *
 * Tick / expiry are intentionally *not* performed here; they belong to
 * `processRoundEndEffects` so duration counts down once per round.
 */
export function processRoundStartEffects<T extends Combatant>(target: T): {
    target: T;
    healed: number;
    drained: number;
    dotDamage: number;
} {
    const regen = applyRegen(target);
    const drain = applyDrain(regen.target);
    const dot   = processDamageOverTime(drain.target, 'start');
    return {
        target:    dot.target,
        healed:    regen.healed,
        drained:   drain.drained,
        dotDamage: dot.damage,
    };
}

/**
 * Round-end orchestration. Order:
 *   1. End-phase DoT (e.g. bleed)
 *   2. Tick / expire all effects (single decrement per round)
 */
export function processRoundEndEffects<T extends Combatant>(target: T): {
    target: T;
    dotDamage: number;
    expired: ActiveEffect[];
} {
    const dot   = processDamageOverTime(target, 'end');
    const ticked = tickAllEffects(dot.target);
    return {
        target:    ticked.target,
        dotDamage: dot.damage,
        expired:   ticked.expired,
    };
}

/**
 * Cleanse — strip debuffs from the bearer scoped by the cleanse effect's tier.
 * A Tier 2 cleanse removes Tier 1 + 2 debuffs; a Tier 3 cleanse strips
 * everything. Pure: returns updated combatant and the list of removed effects.
 *
 * @param tier - Tier of the cleansing effect (1, 2, or 3). Removes any debuff
 *               whose `tier <= cleanseTier`.
 */
export function applyCleanse<T extends Combatant>(
    target: T,
    tier: 1 | 2 | 3,
): { target: T; removed: ActiveEffect[] } {
    const { activeEffects, removed } = removeEffectsByType(target.effects, 'debuff', tier);
    return { target: { ...target, effects: activeEffects }, removed };
}

/**
 * Dispel — strip buffs from the bearer scoped by the dispel effect's tier
 * (mirror of `applyCleanse`).
 */
export function applyDispel<T extends Combatant>(
    target: T,
    tier: 1 | 2 | 3,
): { target: T; removed: ActiveEffect[] } {
    const { activeEffects, removed } = removeEffectsByType(target.effects, 'buff', tier);
    return { target: { ...target, effects: activeEffects }, removed };
}
