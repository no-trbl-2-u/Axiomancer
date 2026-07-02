/**
 * Status Effect Amplification Registry
 * 
 * Phase 142 — Registry of effect combinations that trigger amplified application.
 * Provides tunable intensity/duration multipliers based on effect combos.
 */

import type { EffectInteraction } from './interactions';

/** Registry of predefined status effect interactions. */
export const EFFECT_INTERACTIONS: EffectInteraction[] = [
    // Poison + Bleed = Hemorrhage (amplified DoT damage)
    {
        id: 'poison_bleed_hemorrhage',
        name: 'Hemorrhage',
        description: 'Poison and bleeding combine into a devastating hemorrhage, amplifying damage over time',
        priority: 100,
        trigger: {
            primaryEffectId: 'debuff_poison',
            secondaryEffectIds: ['debuff_bleed'],
            minimumCombinedIntensity: 3
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_poison',
            amplificationValue: 1.5, // 50% more damage per tick
            message: 'Poison and bleeding create a hemorrhaging wound!'
        }
    },
    
    // Confusion + Fear = Panic (extended duration)
    {
        id: 'confusion_fear_panic',
        name: 'Panic',
        description: 'Confusion and fear combine into overwhelming panic, extending control effects',
        priority: 90,
        trigger: {
            primaryEffectId: 'debuff_confusion',
            secondaryEffectIds: ['debuff_fear'],
            minimumPrimaryDuration: 2
        },
        result: {
            type: 'amplify_duration',
            targetEffectId: 'debuff_confusion',
            amplificationValue: 1.75, // 75% longer duration
            message: 'Fear and confusion spiral into overwhelming panic!'
        }
    },
    
    // Stun + Exposure = Exposed (advantage on attacks)
    {
        id: 'stun_exposure_exposed',
        name: 'Exposed',
        description: 'Stunned and exposed targets are completely open to attack',
        priority: 80,
        trigger: {
            primaryEffectId: 'debuff_stun',
            secondaryEffectIds: ['debuff_exposure'],
            minimumCombinedIntensity: 2
        },
        result: {
            type: 'grant_advantage',
            targetEffectId: 'debuff_stun',
            amplificationValue: 2, // Double advantage bonus
            message: 'The stunned target is completely exposed!'
        }
    },
    
    // Regeneration + Focus = Enhanced Healing
    {
        id: 'regeneration_focus_enhanced_healing',
        name: 'Enhanced Healing',
        description: 'Focus amplifies regeneration effects for superior healing',
        priority: 85,
        trigger: {
            primaryEffectId: 'buff_regeneration',
            secondaryEffectIds: ['buff_focus'],
            minimumCombinedIntensity: 3
        },
        result: {
            type: 'amplify_intensity',
            targetEffectId: 'buff_regeneration',
            amplificationValue: 1.6, // 60% more healing
            message: 'Focused regeneration accelerates healing!'
        }
    },
    
    // Haste + Critical Rate = Momentum (intensity boost)
    {
        id: 'haste_critical_momentum',
        name: 'Momentum',
        description: 'Haste and critical rate buffs create unstoppable momentum',
        priority: 75,
        trigger: {
            primaryEffectId: 'buff_haste',
            secondaryEffectIds: ['buff_critical_rate_up'],
            minimumPrimaryDuration: 3
        },
        result: {
            type: 'amplify_intensity',
            targetEffectId: 'buff_critical_rate_up',
            amplificationValue: 1.4, // 40% higher intensity
            message: 'Speed and precision create unstoppable momentum!'
        }
    },
    
    // Disease + Exhaustion = Atrophy (reduced resistance)
    {
        id: 'disease_exhaustion_atrophy',
        name: 'Atrophy',
        description: 'Disease and exhaustion compound to reduce all resistances',
        priority: 70,
        trigger: {
            primaryEffectId: 'debuff_disease',
            secondaryEffectIds: ['debuff_exhaustion'],
            minimumCombinedIntensity: 4
        },
        result: {
            type: 'reduce_resistance',
            targetEffectId: 'debuff_exhaustion',
            amplificationValue: 3, // -3 to all resist rolls
            message: 'Disease and exhaustion cause systemic atrophy!'
        }
    },
    
    // Mind Mark + Silence = Cognitive Lock
    {
        id: 'mind_mark_silence_cognitive_lock',
        name: 'Cognitive Lock',
        description: 'Mental marking and silence create complete cognitive shutdown',
        priority: 85,
        trigger: {
            primaryEffectId: 'tier1_mind_mark',
            secondaryEffectIds: ['debuff_silence'],
            minimumPrimaryDuration: 1
        },
        result: {
            type: 'amplify_duration',
            targetEffectId: 'debuff_silence',
            amplificationValue: 2.0, // Double duration
            message: 'Mental marking locks down all cognitive function!'
        }
    },
    
    // Barrier + Reflect = Fortress (intensity amplification)
    {
        id: 'barrier_reflect_fortress',
        name: 'Fortress',
        description: 'Defensive barriers and damage reflection create an impenetrable fortress',
        priority: 80,
        trigger: {
            primaryEffectId: 'buff_barrier',
            secondaryEffectIds: ['tier1_body_defend'], // Briar Stance (reflectDamage)
            minimumCombinedIntensity: 3
        },
        result: {
            type: 'amplify_intensity',
            targetEffectId: 'tier1_body_defend',
            amplificationValue: 1.8, // 80% more reflect damage
            message: 'Barrier and thorns create an impenetrable fortress!'
        }
    },
    
    // Burn + Acid = Corrosive Fire (damage amplification)
    {
        id: 'burn_acid_corrosive_fire',
        name: 'Corrosive Fire',
        description: 'Fire and acid combine into corrosive flames that eat through defenses',
        priority: 95,
        trigger: {
            primaryEffectId: 'debuff_burn',
            secondaryEffectIds: ['debuff_acid'],
            minimumCombinedIntensity: 2
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_burn',
            amplificationValue: 1.75, // 75% more damage
            message: 'Fire and acid create corrosive flames!'
        }
    },

    // Acid + Poison = Dissolution (damage amplification)
    {
        id: 'acid_poison_dissolution',
        name: 'Dissolution',
        description: 'Acid and poison eat through the body together, accelerating decay',
        priority: 90,
        trigger: {
            primaryEffectId: 'debuff_acid',
            secondaryEffectIds: ['debuff_poison'],
            minimumCombinedIntensity: 2
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_acid',
            amplificationValue: 1.5, // 50% more damage
            message: 'Acid and poison dissolve flesh in tandem!'
        }
    },
    
    // Ascendant + Extended Will = Leadership (duration extension)
    {
        id: 'ascendant_will_leadership',
        name: 'Leadership',
        description: 'Ascendant resolve and extended will combine for sustained leadership',
        priority: 75,
        trigger: {
            primaryEffectId: 'buff_all_stats_up',
            secondaryEffectIds: ['buff_buff_duration_up'],
            minimumPrimaryDuration: 2
        },
        result: {
            type: 'amplify_duration',
            targetEffectId: 'buff_all_stats_up',
            amplificationValue: 1.5, // 50% longer leadership
            message: 'Ascendant resolve and extended will create powerful leadership!'
        }
    }
];

/**
 * Get all interactions that could trigger for a given effect ID.
 * 
 * @param effectId - The effect to check for interactions
 * @returns Array of interactions where this effect is primary or secondary
 */
export function getInteractionsForEffect(effectId: string): EffectInteraction[] {
    return EFFECT_INTERACTIONS.filter(interaction => 
        interaction.trigger.primaryEffectId === effectId ||
        interaction.trigger.secondaryEffectIds.includes(effectId)
    );
}

/**
 * Get all interaction IDs for debugging/logging.
 * 
 * @returns Array of all registered interaction IDs
 */
export function getAllInteractionIds(): string[] {
    return EFFECT_INTERACTIONS.map(interaction => interaction.id);
}

/**
 * Find an interaction by its ID.
 * 
 * @param interactionId - The interaction ID to find
 * @returns The interaction definition, or undefined if not found
 */
export function getInteractionById(interactionId: string): EffectInteraction | undefined {
    return EFFECT_INTERACTIONS.find(interaction => interaction.id === interactionId);
}

/**
 * Validate that all effect IDs referenced in interactions exist.
 * This is a development helper to catch typos in effect references.
 * 
 * @param validEffectIds - Set of all valid effect IDs from the effects library
 * @returns Array of validation errors, empty if all valid
 */
export function validateInteractions(validEffectIds: Set<string>): string[] {
    const errors: string[] = [];
    
    for (const interaction of EFFECT_INTERACTIONS) {
        // Check primary effect exists
        if (!validEffectIds.has(interaction.trigger.primaryEffectId)) {
            errors.push(`Interaction '${interaction.id}': unknown primary effect '${interaction.trigger.primaryEffectId}'`);
        }
        
        // Check secondary effects exist
        for (const secondaryId of interaction.trigger.secondaryEffectIds) {
            if (!validEffectIds.has(secondaryId)) {
                errors.push(`Interaction '${interaction.id}': unknown secondary effect '${secondaryId}'`);
            }
        }
        
        // Check target effect exists
        if (!validEffectIds.has(interaction.result.targetEffectId)) {
            errors.push(`Interaction '${interaction.id}': unknown target effect '${interaction.result.targetEffectId}'`);
        }
    }
    
    return errors;
}