/**
 * Status Effect Interactions
 * 
 * Phase 142 — Enhanced effect-on-effect interactions for status depth.
 * Provides synergy bonuses when specific effect combinations are present.
 */

import type { ActiveEffect } from './types';

/** What kind of interaction triggers when effects combine. */
export type InteractionTriggerType = 
    | 'amplify_intensity'      // Boost intensity of target effect
    | 'amplify_duration'       // Extend duration of target effect
    | 'amplify_damage'         // Increase damage-over-time potency
    | 'grant_advantage'        // Grant combat advantage while combo active
    | 'reduce_resistance';     // Lower resist difficulty for future effects

/** Condition that must be met for an interaction to trigger. */
export interface InteractionTrigger {
    /** Primary effect that must be present. */
    primaryEffectId: string;
    /** Secondary effect(s) that must also be present. */
    secondaryEffectIds: string[];
    /** Minimum combined intensity across all effects (optional). */
    minimumCombinedIntensity?: number;
    /** Minimum duration on primary effect (optional). */
    minimumPrimaryDuration?: number;
}

/** Result when an interaction successfully triggers. */
export interface InteractionResult {
    type: InteractionTriggerType;
    /** Which effect is the target of the amplification. */
    targetEffectId: string;
    /** Magnitude of the amplification (multiplier for intensity/duration, flat bonus for damage). */
    amplificationValue: number;
    /** Human-readable message for combat logs. */
    message: string;
}

/** Complete definition of a status effect interaction. */
export interface EffectInteraction {
    id: string;
    name: string;
    description: string;
    trigger: InteractionTrigger;
    result: InteractionResult;
    /** Priority when multiple interactions could trigger (higher = first). */
    priority?: number;
}

/**
 * Check if a set of active effects satisfies an interaction trigger.
 * 
 * @param trigger - The interaction condition to check
 * @param activeEffects - Current active effects on the combatant
 * @returns The primary effect and matched secondaries, or null if no match
 */
export function checkInteractionTrigger(
    trigger: InteractionTrigger,
    activeEffects: ActiveEffect[]
): { primary: ActiveEffect; secondaries: ActiveEffect[] } | null {
    // Find primary effect
    const primary = activeEffects.find(effect => effect.effectId === trigger.primaryEffectId);
    if (!primary) return null;
    
    // Check minimum duration on primary if specified
    if (trigger.minimumPrimaryDuration !== undefined && 
        primary.remainingDuration < trigger.minimumPrimaryDuration) {
        return null;
    }
    
    // Find all required secondary effects
    const secondaries: ActiveEffect[] = [];
    for (const secondaryId of trigger.secondaryEffectIds) {
        const secondary = activeEffects.find(effect => effect.effectId === secondaryId);
        if (!secondary) return null;
        secondaries.push(secondary);
    }
    
    // Check minimum combined intensity if specified
    if (trigger.minimumCombinedIntensity !== undefined) {
        const combinedIntensity = primary.intensity + 
            secondaries.reduce((sum, effect) => sum + effect.intensity, 0);
        if (combinedIntensity < trigger.minimumCombinedIntensity) {
            return null;
        }
    }
    
    return { primary, secondaries };
}

/**
 * Evaluate all possible interactions for a set of active effects.
 * 
 * @param interactions - Available interaction definitions
 * @param activeEffects - Current active effects on the combatant
 * @returns Array of triggered interaction results, sorted by priority
 */
export function evaluateInteractions(
    interactions: EffectInteraction[],
    activeEffects: ActiveEffect[]
): InteractionResult[] {
    const triggered: { interaction: EffectInteraction; result: InteractionResult }[] = [];
    
    for (const interaction of interactions) {
        const match = checkInteractionTrigger(interaction.trigger, activeEffects);
        if (match) {
            triggered.push({ 
                interaction, 
                result: interaction.result 
            });
        }
    }
    
    // Sort by priority (higher first), then by interaction id for deterministic ordering
    triggered.sort((a, b) => {
        const priorityA = a.interaction.priority || 0;
        const priorityB = b.interaction.priority || 0;
        if (priorityA !== priorityB) return priorityB - priorityA;
        return a.interaction.id.localeCompare(b.interaction.id);
    });
    
    return triggered.map(t => t.result);
}

/**
 * Apply an interaction result to modify an active effect.
 * 
 * @param result - The interaction result to apply
 * @param targetEffect - The effect to modify (will be mutated)
 * @returns Success status and applied modification details
 */
export function applyInteractionResult(
    result: InteractionResult,
    targetEffect: ActiveEffect
): { success: boolean; modification?: string } {
    if (targetEffect.effectId !== result.targetEffectId) {
        return { success: false };
    }
    
    switch (result.type) {
        case 'amplify_intensity': {
            const oldIntensity = targetEffect.intensity;
            targetEffect.intensity = Math.floor(targetEffect.intensity * result.amplificationValue);
            return { 
                success: true, 
                modification: `intensity ${oldIntensity} → ${targetEffect.intensity}`
            };
        }
            
        case 'amplify_duration': {
            const oldDuration = targetEffect.remainingDuration;
            targetEffect.remainingDuration = Math.floor(targetEffect.remainingDuration * result.amplificationValue);
            return { 
                success: true, 
                modification: `duration ${oldDuration} → ${targetEffect.remainingDuration}`
            };
        }
            
        case 'amplify_damage':
            // Note: This doesn't directly modify the effect since damage calculation
            // happens elsewhere, but we return the amplification value for the caller
            // to apply during damage calculation
            return { 
                success: true, 
                modification: `damage amplified by ${result.amplificationValue}`
            };
            
        case 'grant_advantage':
        case 'reduce_resistance':
            // These are passive effects that don't modify the target effect directly
            // but are consumed by combat resolution logic
            return { 
                success: true, 
                modification: `${result.type} active`
            };
            
        default:
            return { success: false };
    }
}