/**
 * Extended Synergy Predicates
 * 
 * Phase 142 — Enhanced synergy predicate matching for multi-effect requirements.
 * Extends the Phase 66 synergy system to support complex effect combinations.
 */

import type { ActiveEffect } from '../Effects/types';
import type { SynergyPredicate } from './types';

/** Extended predicate supporting multi-effect requirements. */
export interface ExtendedSynergyPredicate {
    /** Single effect requirement (legacy Phase 66 format). */
    single?: SynergyPredicate;
    /** Require any N effects from a list. */
    anyCount?: {
        effectIds: string[];
        count: number;
        on: 'caster' | 'target';
        intensityMin?: number;
        durationMin?: number;
    };
    /** Require all effects from a list to be present. */
    allRequired?: {
        effectIds: string[];
        on: 'caster' | 'target';
        intensityMin?: number;
        durationMin?: number;
    };
    /** Require a buff+debuff combination. */
    buffDebuffCombo?: {
        buffId: string;
        debuffId: string;
        on: 'caster' | 'target';
        intensityMin?: number;
        durationMin?: number;
    };
    /** Require minimum total intensity across any effects. */
    totalIntensity?: {
        minimum: number;
        on: 'caster' | 'target';
        /** Optional filter to specific effect types. */
        effectType?: 'buff' | 'debuff';
    };
}

/**
 * Check if a single legacy SynergyPredicate is satisfied.
 * 
 * @param predicate - The predicate to check
 * @param effects - Active effects to search
 * @returns Matching effect if found, null otherwise
 */
export function checkSinglePredicate(
    predicate: SynergyPredicate,
    effects: ActiveEffect[]
): ActiveEffect | null {
    for (const effect of effects) {
        if (effect.effectId !== predicate.effectId) continue;
        
        if (predicate.intensityMin !== undefined && 
            effect.intensity < predicate.intensityMin) continue;
            
        if (predicate.durationMin !== undefined && 
            effect.remainingDuration < predicate.durationMin) continue;
            
        return effect;
    }
    
    return null;
}

/**
 * Check if an "any N effects" predicate is satisfied.
 * 
 * @param predicate - The any-count predicate
 * @param effects - Active effects to search
 * @returns Array of matching effects (length >= count), or empty if not satisfied
 */
export function checkAnyCountPredicate(
    predicate: { effectIds: string[]; count: number; intensityMin?: number; durationMin?: number },
    effects: ActiveEffect[]
): ActiveEffect[] {
    const matches: ActiveEffect[] = [];
    
    for (const effect of effects) {
        if (!predicate.effectIds.includes(effect.effectId)) continue;
        
        if (predicate.intensityMin !== undefined && 
            effect.intensity < predicate.intensityMin) continue;
            
        if (predicate.durationMin !== undefined && 
            effect.remainingDuration < predicate.durationMin) continue;
            
        matches.push(effect);
    }
    
    return matches.length >= predicate.count ? matches : [];
}

/**
 * Check if an "all required" predicate is satisfied.
 * 
 * @param predicate - The all-required predicate
 * @param effects - Active effects to search
 * @returns Array of matching effects (one per required ID), or empty if not satisfied
 */
export function checkAllRequiredPredicate(
    predicate: { effectIds: string[]; intensityMin?: number; durationMin?: number },
    effects: ActiveEffect[]
): ActiveEffect[] {
    const matches: ActiveEffect[] = [];
    
    for (const requiredId of predicate.effectIds) {
        let found = false;
        for (const effect of effects) {
            if (effect.effectId !== requiredId) continue;
            
            if (predicate.intensityMin !== undefined && 
                effect.intensity < predicate.intensityMin) continue;
                
            if (predicate.durationMin !== undefined && 
                effect.remainingDuration < predicate.durationMin) continue;
                
            matches.push(effect);
            found = true;
            break;
        }
        
        if (!found) return []; // Missing a required effect
    }
    
    return matches;
}

/**
 * Check if a buff+debuff combo predicate is satisfied.
 * 
 * @param predicate - The combo predicate
 * @param effects - Active effects to search
 * @param effectLibrary - Effect library to lookup effect types
 * @returns Object with matched buff and debuff, or null if not satisfied
 */
export function checkBuffDebuffCombo(
    predicate: { buffId: string; debuffId: string; intensityMin?: number; durationMin?: number },
    effects: ActiveEffect[],
    effectLibrary: Map<string, { type: 'buff' | 'debuff' }>
): { buff: ActiveEffect; debuff: ActiveEffect } | null {
    let buff: ActiveEffect | null = null;
    let debuff: ActiveEffect | null = null;
    
    for (const effect of effects) {
        const effectDef = effectLibrary.get(effect.effectId);
        if (!effectDef) continue;
        
        // Check minimum requirements first
        if (predicate.intensityMin !== undefined && 
            effect.intensity < predicate.intensityMin) continue;
            
        if (predicate.durationMin !== undefined && 
            effect.remainingDuration < predicate.durationMin) continue;
        
        // Match specific IDs and types
        if (effect.effectId === predicate.buffId && effectDef.type === 'buff') {
            buff = effect;
        } else if (effect.effectId === predicate.debuffId && effectDef.type === 'debuff') {
            debuff = effect;
        }
    }
    
    return (buff && debuff) ? { buff, debuff } : null;
}

/**
 * Check if a total intensity predicate is satisfied.
 * 
 * @param predicate - The total intensity predicate
 * @param effects - Active effects to search
 * @param effectLibrary - Effect library to filter by type
 * @returns Total intensity if satisfied, 0 otherwise
 */
export function checkTotalIntensityPredicate(
    predicate: { minimum: number; effectType?: 'buff' | 'debuff' },
    effects: ActiveEffect[],
    effectLibrary: Map<string, { type: 'buff' | 'debuff' }>
): number {
    let totalIntensity = 0;
    
    for (const effect of effects) {
        if (predicate.effectType) {
            const effectDef = effectLibrary.get(effect.effectId);
            if (!effectDef || effectDef.type !== predicate.effectType) continue;
        }
        
        totalIntensity += effect.intensity;
    }
    
    return totalIntensity >= predicate.minimum ? totalIntensity : 0;
}

/**
 * Evaluate an extended synergy predicate against active effects.
 * 
 * @param predicate - The extended predicate to check
 * @param casterEffects - Active effects on the caster
 * @param targetEffects - Active effects on the target
 * @param effectLibrary - Effect library for type lookups
 * @returns Match result with details, or null if not satisfied
 */
export function evaluateExtendedSynergyPredicate(
    predicate: ExtendedSynergyPredicate,
    casterEffects: ActiveEffect[],
    targetEffects: ActiveEffect[],
    effectLibrary: Map<string, { type: 'buff' | 'debuff' }>
): { 
    matched: true; 
    effects: ActiveEffect[]; 
    totalIntensity?: number;
    type: 'single' | 'anyCount' | 'allRequired' | 'buffDebuffCombo' | 'totalIntensity';
} | null {
    // Legacy single effect predicate
    if (predicate.single) {
        const effects = predicate.single.on === 'caster' ? casterEffects : targetEffects;
        const match = checkSinglePredicate(predicate.single, effects);
        return match ? { matched: true, effects: [match], type: 'single' } : null;
    }
    
    // Any N effects from list
    if (predicate.anyCount) {
        const effects = predicate.anyCount.on === 'caster' ? casterEffects : targetEffects;
        const matches = checkAnyCountPredicate(predicate.anyCount, effects);
        return matches.length > 0 ? { matched: true, effects: matches, type: 'anyCount' } : null;
    }
    
    // All required effects
    if (predicate.allRequired) {
        const effects = predicate.allRequired.on === 'caster' ? casterEffects : targetEffects;
        const matches = checkAllRequiredPredicate(predicate.allRequired, effects);
        return matches.length > 0 ? { matched: true, effects: matches, type: 'allRequired' } : null;
    }
    
    // Buff + debuff combination
    if (predicate.buffDebuffCombo) {
        const effects = predicate.buffDebuffCombo.on === 'caster' ? casterEffects : targetEffects;
        const match = checkBuffDebuffCombo(predicate.buffDebuffCombo, effects, effectLibrary);
        return match ? { matched: true, effects: [match.buff, match.debuff], type: 'buffDebuffCombo' } : null;
    }
    
    // Total intensity threshold
    if (predicate.totalIntensity) {
        const effects = predicate.totalIntensity.on === 'caster' ? casterEffects : targetEffects;
        const totalIntensity = checkTotalIntensityPredicate(predicate.totalIntensity, effects, effectLibrary);
        return totalIntensity > 0 ? { 
            matched: true, 
            effects: effects.filter(e => {
                if (!predicate.totalIntensity!.effectType) return true;
                const effectDef = effectLibrary.get(e.effectId);
                return effectDef?.type === predicate.totalIntensity!.effectType;
            }), 
            totalIntensity, 
            type: 'totalIntensity' 
        } : null;
    }
    
    return null;
}