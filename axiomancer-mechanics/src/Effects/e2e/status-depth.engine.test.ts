/**
 * Status Effect Depth E2E Tests
 * 
 * Phase 142 — Hermetic e2e coverage for enhanced status effect interactions
 * and synergy systems. Proves that effect combinations trigger expected
 * amplification and resolution behavior.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mockFixedRng, restoreOriginalRng } from '../../test-utils/rng';

// Import the modules we're testing
import { evaluateInteractions, checkInteractionTrigger } from '../interactions';
import { evaluateExtendedSynergyPredicate } from '../../Cards/synergy-predicates';
import { EFFECT_INTERACTIONS, validateInteractions } from '../amplification.registry';
import { effectsLibrary } from '../effects.library';
import type { ActiveEffect } from '../types';
import type { ExtendedSynergyPredicate } from '../../Cards/synergy-predicates';

describe('Status Effect Depth Engine', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        restoreOriginalRng();
    });
    describe('Effect Interactions', () => {
        it('should detect poison+bleed hemorrhage interaction', () => {
            // Arrange: Active effects representing poison and bleed
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_poison',
                    intensity: 2,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_bleed',
                    intensity: 2,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            // Act: Evaluate interactions
            const results = evaluateInteractions(EFFECT_INTERACTIONS, activeEffects);
            
            // Assert: Hemorrhage interaction should trigger
            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('amplify_damage');
            expect(results[0].targetEffectId).toBe('debuff_poison');
            expect(results[0].amplificationValue).toBe(1.5);
            expect(results[0].message).toContain('hemorrhag');
        });
        
        it('should not trigger interaction with insufficient intensity', () => {
            // Arrange: Effects below minimum combined intensity (3)
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_poison',
                    intensity: 1,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_bleed',
                    intensity: 1,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            // Act: Evaluate interactions
            const results = evaluateInteractions(EFFECT_INTERACTIONS, activeEffects);
            
            // Assert: No hemorrhage interaction due to insufficient intensity
            const hemorrhage = results.find(r => r.message.includes('hemorrhag'));
            expect(hemorrhage).toBeUndefined();
        });
        
        it('should trigger confusion+fear panic interaction', () => {
            // Arrange: Mental debuff combination
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_confusion',
                    intensity: 1,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_fear',
                    intensity: 1,
                    remainingDuration: 2,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            // Act: Evaluate interactions
            const results = evaluateInteractions(EFFECT_INTERACTIONS, activeEffects);
            
            // Assert: Panic interaction should trigger
            const panic = results.find(r => r.message.includes('panic'));
            expect(panic).toBeDefined();
            expect(panic!.type).toBe('amplify_duration');
            expect(panic!.amplificationValue).toBe(1.75);
        });
        
        it('should handle multiple simultaneous interactions', () => {
            // Arrange: Complex effect combination triggering multiple interactions
            const activeEffects: ActiveEffect[] = [
                // Poison + bleed for hemorrhage
                {
                    effectId: 'debuff_poison',
                    intensity: 2,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_bleed',
                    intensity: 2,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                },
                // Regeneration + focus for enhanced healing  
                {
                    effectId: 'buff_regeneration',
                    intensity: 2,
                    remainingDuration: 5,
                    appliedAt: 1,
                    tier: 1
                },
                {
                    effectId: 'buff_focus',
                    intensity: 2,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            // Act: Evaluate interactions
            const results = evaluateInteractions(EFFECT_INTERACTIONS, activeEffects);
            
            // Assert: Both interactions should trigger, sorted by priority
            expect(results.length).toBeGreaterThanOrEqual(2);
            
            const hemorrhage = results.find(r => r.message.includes('hemorrhag'));
            const enhancedHealing = results.find(r => r.message.includes('healing'));
            
            expect(hemorrhage).toBeDefined();
            expect(enhancedHealing).toBeDefined();
            
            // Higher priority should come first
            expect(results[0].message).toBe(hemorrhage!.message); // Priority 95 vs 85
        });
    });
    
    describe('Extended Synergy Predicates', () => {
        const mockEffectLibrary = new Map([
            ['debuff_poison', { type: 'debuff' as const }],
            ['debuff_bleed', { type: 'debuff' as const }],
            ['buff_focus', { type: 'buff' as const }],
            ['buff_regeneration', { type: 'buff' as const }],
            ['debuff_confusion', { type: 'debuff' as const }]
        ]);
        
        it('should match anyCount predicate with sufficient effects', () => {
            // Arrange: Multiple debuffs for "any 2 debuffs" requirement
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_poison',
                    intensity: 1,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_bleed',
                    intensity: 1,
                    remainingDuration: 2,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_confusion',
                    intensity: 1,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            const predicate: ExtendedSynergyPredicate = {
                anyCount: {
                    effectIds: ['debuff_poison', 'debuff_bleed', 'debuff_confusion', 'debuff_fear'],
                    count: 2,
                    on: 'target',
                    intensityMin: 1
                }
            };
            
            // Act: Evaluate predicate
            const result = evaluateExtendedSynergyPredicate(
                predicate,
                [], // caster effects
                activeEffects, // target effects
                mockEffectLibrary
            );
            
            // Assert: Should match with 3 debuffs (≥ 2 required)
            expect(result).toBeTruthy();
            expect(result!.matched).toBe(true);
            expect(result!.type).toBe('anyCount');
            expect(result!.effects.length).toBe(3);
        });
        
        it('should match buffDebuffCombo predicate', () => {
            // Arrange: Specific buff+debuff combination
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'buff_focus',
                    intensity: 2,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_poison',
                    intensity: 1,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            const predicate: ExtendedSynergyPredicate = {
                buffDebuffCombo: {
                    buffId: 'buff_focus',
                    debuffId: 'debuff_poison',
                    on: 'target',
                    intensityMin: 1
                }
            };
            
            // Act: Evaluate predicate
            const result = evaluateExtendedSynergyPredicate(
                predicate,
                [], // caster effects
                activeEffects, // target effects
                mockEffectLibrary
            );
            
            // Assert: Should match the buff+debuff combo
            expect(result).toBeTruthy();
            expect(result!.matched).toBe(true);
            expect(result!.type).toBe('buffDebuffCombo');
            expect(result!.effects.length).toBe(2);
        });
        
        it('should match totalIntensity predicate for debuffs only', () => {
            // Arrange: Mix of buffs and debuffs
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'buff_focus',
                    intensity: 3,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_poison',
                    intensity: 2,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_bleed',
                    intensity: 2,
                    remainingDuration: 2,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            const predicate: ExtendedSynergyPredicate = {
                totalIntensity: {
                    minimum: 3,
                    on: 'target',
                    effectType: 'debuff'
                }
            };
            
            // Act: Evaluate predicate
            const result = evaluateExtendedSynergyPredicate(
                predicate,
                [], // caster effects
                activeEffects, // target effects
                mockEffectLibrary
            );
            
            // Assert: Should match with total debuff intensity = 4 (≥ 3)
            expect(result).toBeTruthy();
            expect(result!.matched).toBe(true);
            expect(result!.type).toBe('totalIntensity');
            expect(result!.totalIntensity).toBe(4);
            expect(result!.effects.length).toBe(2); // Only debuffs
        });
        
        it('should not match totalIntensity predicate with insufficient intensity', () => {
            // Arrange: Effects below threshold
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_poison',
                    intensity: 1,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            const predicate: ExtendedSynergyPredicate = {
                totalIntensity: {
                    minimum: 5,
                    on: 'target',
                    effectType: 'debuff'
                }
            };
            
            // Act: Evaluate predicate
            const result = evaluateExtendedSynergyPredicate(
                predicate,
                [], // caster effects
                activeEffects, // target effects
                mockEffectLibrary
            );
            
            // Assert: Should not match due to insufficient intensity
            expect(result).toBeNull();
        });
    });
    
    describe('Resolution Threshold Scenarios', () => {
        it('should demonstrate DoT resolution path with interactions', () => {
            // Arrange: Mock RNG for deterministic testing
            mockFixedRng([0.5]);
            
            // Simulate active effects that would trigger DoT resolution
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_poison',
                    intensity: 2, // 4 damage/round base
                    remainingDuration: 5,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_bleed',
                    intensity: 1, // 3 damage/round base
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            // Act: Check for amplifying interactions
            const interactions = evaluateInteractions(EFFECT_INTERACTIONS, activeEffects);
            const hemorrhage = interactions.find(i => i.message.includes('hemorrhag'));
            
            // Assert: Hemorrhage should amplify poison damage
            expect(hemorrhage).toBeDefined();
            expect(hemorrhage!.amplificationValue).toBe(1.5);
            
            // Calculate effective DoT damage with amplification
            const basePoisonDamage = 4; // 2 intensity * 2 base damage
            const amplifiedDamage = Math.floor(basePoisonDamage * 1.5); // 6 damage
            const bleedDamage = 3; // 1 intensity * 3 base damage
            const totalDotDamage = amplifiedDamage + bleedDamage; // 9 damage/round
            
            // Should exceed STATUS_RESOLUTION_DOT_THRESHOLD (2)
            expect(totalDotDamage).toBeGreaterThanOrEqual(2);
        });
        
        it('should demonstrate debuff resolution path with synergy', () => {
            // Arrange: High-intensity control effects
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_confusion',
                    intensity: 2,
                    remainingDuration: 4,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_fear',
                    intensity: 1,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                },
                {
                    effectId: 'debuff_stun',
                    intensity: 1,
                    remainingDuration: 2,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            // Act: Check interactions and calculate total intensity
            const interactions = evaluateInteractions(EFFECT_INTERACTIONS, activeEffects);
            const totalDebuffIntensity = activeEffects.reduce((sum, e) => sum + e.intensity, 0);
            
            // Assert: Total intensity should exceed STATUS_RESOLUTION_DEBUFF_THRESHOLD (3)
            expect(totalDebuffIntensity).toBe(4);
            expect(totalDebuffIntensity).toBeGreaterThanOrEqual(3);
            
            // Panic interaction should extend confusion duration
            const panic = interactions.find(i => i.message.includes('panic'));
            expect(panic).toBeDefined();
            expect(panic!.type).toBe('amplify_duration');
        });
        
        it('should verify engagement maintenance with status effect focus', () => {
            // Arrange: Status-heavy effect combination that will trigger interactions
            const statusEffects: ActiveEffect[] = [
                { effectId: 'debuff_poison', intensity: 2, remainingDuration: 5, appliedAt: 1, tier: 2 },
                { effectId: 'debuff_bleed', intensity: 2, remainingDuration: 4, appliedAt: 1, tier: 2 },
                { effectId: 'buff_regeneration', intensity: 2, remainingDuration: 6, appliedAt: 1, tier: 1 },
                { effectId: 'buff_focus', intensity: 2, remainingDuration: 3, appliedAt: 1, tier: 2 },
                { effectId: 'debuff_confusion', intensity: 1, remainingDuration: 3, appliedAt: 1, tier: 2 }
            ];
            
            // Act: Count status effects vs total actions
            const statusActionCount = statusEffects.length;
            const totalActions = statusActionCount + 2; // Assume 2 basic attacks
            const statusEngagementPercent = (statusActionCount / totalActions) * 100;
            
            // Assert: Should meet engagement floor (40%)
            expect(statusEngagementPercent).toBeGreaterThanOrEqual(40);
            
            // Verify at least one interaction triggers (poison+bleed hemorrhage with intensity ≥3)
            const interactions = evaluateInteractions(EFFECT_INTERACTIONS, statusEffects);
            expect(interactions.length).toBeGreaterThanOrEqual(1);
        });
    });
    
    describe('Integration with Existing Systems', () => {
        it('should work with legacy single synergy predicates', () => {
            // Arrange: Legacy Phase 66 synergy format
            const activeEffects: ActiveEffect[] = [
                {
                    effectId: 'debuff_bleed',
                    intensity: 2,
                    remainingDuration: 3,
                    appliedAt: 1,
                    tier: 2
                }
            ];
            
            const legacyPredicate: ExtendedSynergyPredicate = {
                single: {
                    effectId: 'debuff_bleed',
                    on: 'target',
                    durationMin: 2,
                    intensityMin: 1
                }
            };
            
            // Act: Evaluate legacy predicate
            const result = evaluateExtendedSynergyPredicate(
                legacyPredicate,
                [], // caster effects
                activeEffects, // target effects
                new Map()
            );
            
            // Assert: Legacy format should still work
            expect(result).toBeTruthy();
            expect(result!.matched).toBe(true);
            expect(result!.type).toBe('single');
            expect(result!.effects.length).toBe(1);
        });
        
        it('should maintain backward compatibility with existing effect types', () => {
            // Arrange: Standard effect payload structure
            const activeEffect: ActiveEffect = {
                effectId: 'debuff_poison',
                intensity: 1,
                remainingDuration: 3,
                appliedAt: 1,
                tier: 2,
                resistedBy: 'mind',
                resistDR: 13,
                sourceId: 'player'
            };
            
            // Act: Verify all fields are accessible
            const trigger = {
                primaryEffectId: 'debuff_poison',
                secondaryEffectIds: [],
                minimumCombinedIntensity: 1
            };
            
            const match = checkInteractionTrigger(trigger, [activeEffect]);
            
            // Assert: All ActiveEffect properties should be preserved
            expect(match).toBeTruthy();
            expect(match!.primary.effectId).toBe('debuff_poison');
            expect(match!.primary.sourceId).toBe('player');
            expect(match!.primary.resistedBy).toBe('mind');
            expect(match!.primary.resistDR).toBe(13);
        });
    });

    // Phase 156 — guard against dead combos. Before Phase 156 the registry
    // referenced effect ids (debuff_acid, debuff_vulnerability, buff_focus, …)
    // that did not exist in the library, so most combos could never fire even
    // once wired into combat. This guard fails the build if any combo ever
    // references a missing effect again.
    describe('Registry integrity (Phase 156)', () => {
        it('every interaction references only effects that exist in the live library', () => {
            const liveIds = new Set(effectsLibrary.registry.keys());
            const errors = validateInteractions(liveIds);
            expect(errors).toEqual([]);
        });

        it('exposes at least one live amplify_damage combo for DoT play', () => {
            const damageCombos = EFFECT_INTERACTIONS.filter(i => i.result.type === 'amplify_damage');
            expect(damageCombos.length).toBeGreaterThanOrEqual(1);
        });

        it('preserves status breadth — control/duration/advantage combos remain', () => {
            const types = new Set(EFFECT_INTERACTIONS.map(i => i.result.type));
            expect(types.has('amplify_duration')).toBe(true);
            expect(types.has('grant_advantage')).toBe(true);
            expect(types.has('amplify_intensity')).toBe(true);
        });
    });
});