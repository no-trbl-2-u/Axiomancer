/**
 * Effects engine.
 *
 * Pure functions that build and mutate `ActiveEffect[]` arrays. The Combat
 * module separately owns combatant-side effect helpers (regen, thorns,
 * mark intensity, etc.) — see `src/Combat/effects.ts`.
 */

import { Tier1EffectOverrides } from '../Enemy/types';
import { Stance, CombatAction } from '../Combat/types';
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

            const stacked: ActiveEffect = {
                ...existing,
                intensity:         newIntensity,
                remainingDuration: newDuration,
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

// ─── Tier 1 stance effects ────────────────────────────────────────────────────

interface Tier1MapEntry {
    effectId: string;
    target: 'self' | 'opponent';
    applyOptions?: ApplyEffectOptions;
}

/**
 * Default mapping of stance × action → Tier 1 effect.
 *
 *   body  attack  → Ad Baculum         (self buff — +physicalAttack)
 *   body  defend  → Briar Stance       (self buff — thorns reflect)
 *   mind  attack  → Exposed Reasoning  (opponent debuff — +1/+1 stack)
 *   mind  defend  → Exposed Reasoning  (opponent debuff — +3/+3 stack)
 *   heart attack  → Fleeting Kindness  (self — −5 roll, strips enemy buff, extends own buff)
 *   heart defend  → Vital Empathy      (self buff — regen)
 */
const TIER1_EFFECT_MAP: Partial<Record<Stance, Record<'attack' | 'defend', Tier1MapEntry>>> = {
    body:  {
        attack: { effectId: 'tier1_body_attack', target: 'self' },
        defend: { effectId: 'tier1_body_defend', target: 'self' },
    },
    mind:  {
        attack: { effectId: 'tier1_mind_mark', target: 'opponent', applyOptions: { intensityDelta: 1, durationMode: 'additive', durationDelta: 1 } },
        defend: { effectId: 'tier1_mind_mark', target: 'opponent', applyOptions: { intensityDelta: 3, durationMode: 'additive', durationDelta: 3 } },
    },
    heart: {
        attack: { effectId: 'tier1_heart_attack', target: 'self' },
        defend: { effectId: 'tier1_heart_defend', target: 'self' },
    },
};

function resolveTier1Entry(
    stance: Stance,
    action: 'attack' | 'defend',
    overrides?: Tier1EffectOverrides,
): Tier1MapEntry | undefined {
    const globalEntry = TIER1_EFFECT_MAP[stance]?.[action];
    const customId    = overrides?.[stance]?.[action];

    if (customId && globalEntry) return { ...globalEntry, effectId: customId };
    if (customId) return { effectId: customId, target: 'self' };
    return globalEntry;
}

/**
 * Result of resolving the Tier 1 effect for a single combat action.
 *
 * @property actorEffects    - Updated effect array on the acting combatant.
 * @property opponentEffects - Updated effect array on the opponent.
 * @property effect          - The Effect definition that fired (if any).
 * @property message         - Battle-log message describing the outcome.
 * @property appliedTo       - Whether the effect landed on `self` or `opponent`.
 */
export interface Tier1Outcome {
    actorEffects: ActiveEffect[];
    opponentEffects: ActiveEffect[];
    effect: Effect | null;
    message: string | null;
    appliedTo: 'self' | 'opponent' | null;
}

/**
 * Applies the Tier 1 effect for a combat action and returns the updated
 * actor/opponent effect arrays plus a battle-log payload.
 *
 * Mind actions target the OPPONENT (study mark); all other Tier 1 actions
 * target SELF.
 */
export function applyTier1CombatEffect(
    actorEffects: ActiveEffect[],
    opponentEffects: ActiveEffect[],
    combatAction: CombatAction,
    round: number,
    overrides?: Tier1EffectOverrides,
): Tier1Outcome {
    const { stance, action } = combatAction;
    const noChange: Tier1Outcome = { actorEffects, opponentEffects, effect: null, message: null, appliedTo: null };

    if (action !== 'attack' && action !== 'defend') return noChange;

    const entry = resolveTier1Entry(stance, action, overrides);
    if (!entry) return noChange;

    const effect = lookupEffect(entry.effectId);
    if (!effect) return noChange;

    if (entry.target === 'opponent') {
        const { activeEffects: updatedOpponent, result } = applyEffect(opponentEffects, effect, round, entry.applyOptions);
        return { actorEffects, opponentEffects: updatedOpponent, effect, message: result.message, appliedTo: 'opponent' };
    }
    const { activeEffects: updatedActor, result } = applyEffect(actorEffects, effect, round, entry.applyOptions);
    return { actorEffects: updatedActor, opponentEffects, effect, message: result.message, appliedTo: 'self' };
}

/**
 * Removes Tier 1 self-buffs that don't match the new stance. Called before
 * applying the new round's Tier 1 effect so switching stance immediately
 * disperses now-stale buffs.
 *
 * Opponent-applied debuffs (e.g. mind mark) are never the actor's own
 * self-buffs and are preserved.
 */
export function clearTier1EffectsForStance(
    activeEffects: ActiveEffect[],
    currentStance: Stance,
): { activeEffects: ActiveEffect[]; cleared: ActiveEffect[] } {
    const cleared: ActiveEffect[] = [];
    const remaining = activeEffects.filter(ae => {
        if (!ae.effectId.startsWith('tier1_')) return true;
        if (lookupEffect(ae.effectId)?.type === 'debuff') return true;
        if (ae.effectId.includes(`_${currentStance}_`)) return true;
        cleared.push(ae);
        return false;
    });
    return { activeEffects: remaining, cleared };
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
    EffectStatTarget,
} from './types';
// Phase 142 — Status effect interaction types
export type {
    EffectInteraction,
    InteractionTrigger,
    InteractionResult,
    InteractionTriggerType
} from './interactions';
