/**
 * Effects engine.
 *
 * Pure functions that build and mutate `ActiveEffect[]` arrays. The Combat
 * module separately owns combatant-side effect helpers (regen, thorns,
 * mark intensity, etc.) — see `src/Combat/effects.ts`.
 */

import { ActiveEffect, Effect, EffectApplicationResult } from './types';
import { lookupEffect } from './effects.library';
import { MAX_EFFECT_INTENSITY, MAX_EFFECT_DURATION } from '../Game/game-mechanics.constants';

/**
 * Per-application overrides for `applyEffect`. Used by the Tier 1 system so
 * Mind/Defend (+3/+3) and Mind/Attack (+1/+1) can share the same effect
 * definition while applying different stack amounts.
 *
 * @property intensityDelta - Increment per application (default 1). Also the
 *   starting intensity on first application.
 * @property durationMode   - `reset` resets duration to effect.duration (default).
 *                            `additive` adds `durationDelta` to remaining duration.
 * @property durationDelta  - Used when `durationMode === 'additive'`. Defaults to `intensityDelta`.
 * @property sourceId       - Phase 38. Optional combatant / item id stamped onto
 *   the resulting `ActiveEffect.sourceId` so consumers can answer "who applied
 *   this?". On stacking, last-writer-wins: a supplied `sourceId` overrides the
 *   prior; an omitted one preserves it.
 */
export interface ApplyEffectOptions {
    intensityDelta?: number;
    durationMode?: 'reset' | 'additive';
    durationDelta?: number;
    sourceId?: string;
}

/**
 * Removes the first ActiveEffect with the given `effectId` from the array.
 * Returns the updated array and the removed effect (or `null` if not found).
 * Used by cleanse / dispel and other targeted-removal mechanics.
 */
export function removeEffect(
    activeEffects: ActiveEffect[],
    effectId: string,
): { activeEffects: ActiveEffect[]; removed: ActiveEffect | null } {
    const removed = activeEffects.find(e => e.effectId === effectId) ?? null;
    if (!removed) return { activeEffects, removed: null };
    return {
        activeEffects: activeEffects.filter(e => e !== removed),
        removed,
    };
}

/**
 * Applies an effect to an existing ActiveEffect array. Pure; returns the
 * updated array and a result describing what happened. Handles the three
 * stacking modes (`none` / `intensity` / `duration`).
 */
export function applyEffect(
    activeEffects: ActiveEffect[],
    effect: Effect,
    round: number,
    options?: ApplyEffectOptions,
): { activeEffects: ActiveEffect[]; result: EffectApplicationResult } {
    const intensityDelta = options?.intensityDelta ?? 1;
    const durationMode   = options?.durationMode   ?? 'reset';
    const durationDelta  = options?.durationDelta  ?? intensityDelta;

    const existing = activeEffects.find(e => e.effectId === effect.id);

    if (!existing) {
        const initIntensity = Math.min(intensityDelta, MAX_EFFECT_INTENSITY);
        const initDuration  = durationMode === 'additive'
            ? Math.min(durationDelta, MAX_EFFECT_DURATION)
            : Math.min(effect.duration, MAX_EFFECT_DURATION);

        const newEffect: ActiveEffect = {
            effectId:          effect.id,
            remainingDuration: initDuration,
            intensity:         initIntensity,
            appliedAt:         round,
            tier:              effect.tier,
            resistedBy:        effect.resistedBy,
            resistDR:          effect.resistDR,
            sourceId:          options?.sourceId,
        };
        return {
            activeEffects: [...activeEffects, newEffect],
            result: { success: true, activeEffect: newEffect, message: `${effect.name} applied.` },
        };
    }

    switch (effect.stacking) {
        case 'none': {
            return {
                activeEffects,
                result: { success: false, message: `${effect.name} is already active — stronger instance held.` },
            };
        }

        case 'intensity': {
            const prev         = existing.intensity ?? 1;
            const newIntensity = Math.min(prev + intensityDelta, MAX_EFFECT_INTENSITY);
            const newDuration  = durationMode === 'additive'
                ? Math.min(existing.remainingDuration + durationDelta, MAX_EFFECT_DURATION)
                : Math.min(effect.duration, MAX_EFFECT_DURATION);

            // POISON ramp reset (spec 32 v3): an `escalatesPerTurn` DoT restarts
            // its ramp clock on reapplication — `rampedDamagePerRound` measures
            // `round − appliedAt`, so re-stamping `appliedAt` sends the ramp back
            // to turn 0 while the intensity climbs. Non-escalating effects keep
            // their original `appliedAt` (age is irrelevant to their tick).
            const resetsRamp = effect.payload.dotModifiers?.escalatesPerTurn === true;
            const stacked: ActiveEffect = {
                ...existing,
                intensity:         newIntensity,
                remainingDuration: newDuration,
                appliedAt:         resetsRamp ? round : existing.appliedAt,
                sourceId:          options?.sourceId ?? existing.sourceId,
            };
            return {
                activeEffects: activeEffects.map(e => e.effectId === effect.id ? stacked : e),
                result: {
                    success:     true,
                    activeEffect: stacked,
                    message:     newIntensity > prev
                        ? `${effect.name} intensified to ${newIntensity}.`
                        : `${effect.name} at maximum intensity — duration extended.`,
                    stackedWith: { previousIntensity: prev, previousDuration: existing.remainingDuration },
                },
            };
        }

        case 'duration': {
            const extended: ActiveEffect = {
                ...existing,
                remainingDuration: Math.min(
                    existing.remainingDuration + effect.duration,
                    MAX_EFFECT_DURATION,
                ),
                sourceId: options?.sourceId ?? existing.sourceId,
            };
            return {
                activeEffects: activeEffects.map(e => e.effectId === effect.id ? extended : e),
                result: {
                    success:     true,
                    activeEffect: extended,
                    message:     `${effect.name} duration extended.`,
                    stackedWith: {
                        previousIntensity: existing.intensity ?? 1,
                        previousDuration:  existing.remainingDuration,
                    },
                },
            };
        }
    }
}

/**
 * Removes every ActiveEffect whose `effectId` matches `lookupEffect(...)?.type === effectType`,
 * optionally filtered by tier. Used by cleanse (removes debuffs) and dispel (removes buffs).
 *
 * @param activeEffects - Source array (not mutated).
 * @param effectType    - `'buff'` or `'debuff'` — which kind to strip.
 * @param maxTier       - If provided, only removes effects with `tier <= maxTier`. Tier 1
 *                        self-buffs / opponent debuffs survive a Tier 1 dispel. Tier 3
 *                        effects survive everything below their tier.
 * @returns The pruned array plus the list of effects that were removed.
 */
export function removeEffectsByType(
    activeEffects: ActiveEffect[],
    effectType: 'buff' | 'debuff',
    maxTier?: 1 | 2 | 3,
): { activeEffects: ActiveEffect[]; removed: ActiveEffect[] } {
    const removed: ActiveEffect[] = [];
    const remaining = activeEffects.filter(ae => {
        const def = lookupEffect(ae.effectId);
        if (def?.type !== effectType) return true;
        if (maxTier !== undefined && ae.tier > maxTier) return true;
        removed.push(ae);
        return false;
    });
    return { activeEffects: remaining, removed };
}

export { lookupEffect, getEffectByName, getEffectsByType, effectsLibrary } from './effects.library';
export { processWorldEffectTick, getActiveHazards } from './world-tick';

// Phase 142 — Status effect depth functionality
export { 
    evaluateInteractions, 
    checkInteractionTrigger, 
    applyInteractionResult 
} from './interactions';
export { 
    EFFECT_INTERACTIONS, 
    getInteractionsForEffect, 
    getAllInteractionIds, 
    getInteractionById,
    validateInteractions
} from './amplification.registry';

export type { WorldTickResult, ActiveHazard } from './world-tick';
export type {
    Effect, EffectType, EffectStacking, EffectTier, EffectCategory, EffectPayload,
    ActiveEffect, EffectApplicationResult,
    StatModifier, DamageOverTime, RegenerationConfig, ActionRestriction, AdvantageModifier,
    // WS3 (spec 32 §12 #3) — trigger-clock DoT substrate
    DotTriggerClock,
} from './types';
// Phase 142 — Status effect interaction types
export type {
    EffectInteraction,
    InteractionTrigger,
    InteractionResult,
    InteractionTriggerType
} from './interactions';
