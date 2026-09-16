/**
 * Extended Synergy Predicates
 * 
 * Phase 142 — Enhanced synergy predicate matching for multi-effect requirements.
 * Extends the Phase 66 synergy system to support complex effect combinations.
 */

import type { ActiveEffect } from '../Effects/types';
import type { SynergyPredicate, SynergyStatePredicate } from './types';

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
 * WS4.2 / WS5.2 — the combat-ledger view a {@link SynergyStatePredicate}
 * reads: a structural subset of `CombatEncounterState` (spec 32 §12 item 4
 * ledgers + the turn-shape fields), so this module never imports the Combat
 * package. The engine passes the INCOMING play state, so every field is
 * pre-this-play (see the timing note on {@link SynergyStatePredicate}).
 */
export interface SynergyLedgerView {
    /** Post-soak HP the enemy's threat landed in the PRIOR round. */
    enemyDamageLastRound?: number;
    /** Post-soak HP the enemy's threat landed THIS turn (0 during the play
     *  window today — threats resolve between player turns). */
    enemyDamageThisTurn?: number;
    /** PAID spells already resolved this turn (this play not yet counted). */
    spellsPlayedThisTurn?: number;
    /** RECOIL HP paid by PRIOR plays this turn (this play's own not counted). */
    recoilPaidThisTurn?: number;
    /** The current hand — only its LENGTH is read (the played card is still
     *  in it at eval time). Structural: `CombatHandEntry[]` satisfies this. */
    hand?: readonly unknown[];
    /** The discard pile — only its LENGTH is read (REQUIEM, profane-canon
     *  rework). Structural: `string[]` satisfies this. */
    discard?: readonly unknown[];
    /** The draw pile — only its LENGTH's PARITY is read (EVENTIDE,
     *  `/adjust-keywords` pass 11). Structural: `string[]` satisfies this
     *  (`CombatEncounterState.drawPile`, not the full reshuffle-source
     *  `deck`). */
    drawPile?: readonly unknown[];
}

/**
 * WS4.2 — evaluate a combat-state synergy predicate against the encounter
 * ledgers. Pure and deterministic; exhaustive over the closed predicate union
 * (a new predicate kind fails compilation here until it is handled).
 *
 * Absent-field conventions (bare views in tests / legacy state literals):
 * counters default to 0 — so `opening` is vacuously TRUE (no spells played),
 * `recoil-paid-this-turn` / `enemy-drew-blood` are FALSE (no cost on the
 * ledger), and a missing `hand` makes `finale` vacuously TRUE (mirrors the
 * unmoved predicate's vacuous-truth convention; the engine always has a hand).
 */
export function checkStatePredicate(
    predicate: SynergyStatePredicate,
    ledgers: SynergyLedgerView,
): boolean {
    switch (predicate.kind) {
        // FLOW N — the turn has already carried `minPriorSpells` PAID spells.
        // Vacuously FALSE on a bare view (0 prior spells), mirroring the
        // cost-on-the-ledger predicates: FLOW must be EARNED within the turn.
        case 'flow':
            return (ledgers.spellsPlayedThisTurn ?? 0) >= predicate.minPriorSpells;
        case 'enemy-dealt-no-damage-last-round':
            return (ledgers.enemyDamageLastRound ?? 0) === 0;
        case 'opening':
            return (ledgers.spellsPlayedThisTurn ?? 0) <= predicate.maxPriorSpells;
        case 'finale':
            // The eval-time hand still contains the card being played.
            return (ledgers.hand?.length ?? 0) - 1 <= predicate.cardsLeftAtMost;
        case 'recoil-paid-this-turn':
            return (ledgers.recoilPaidThisTurn ?? 0) > 0;
        case 'enemy-drew-blood':
            return (ledgers.enemyDamageThisTurn ?? 0) > 0
                || (ledgers.enemyDamageLastRound ?? 0) > 0;
        case 'requiem':
            // The dead remember: ≥ n cards in the discard pile at play time.
            return (ledgers.discard?.length ?? 0) >= predicate.n;
        case 'eventide':
            // The ledger balances: the draw pile's remaining count is even.
            // Absent-view convention: a bare view has no drawPile field, and
            // `0 % 2 === 0`, so EVENTIDE is vacuously TRUE off a bare
            // ledger — same convention as `opening`/`finale`, not the
            // earned-cost convention of `flow`/`recoil-paid-this-turn`.
            return (ledgers.drawPile?.length ?? 0) % 2 === 0;
    }
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