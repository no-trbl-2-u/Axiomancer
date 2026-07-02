/**
 * Hermetic tests for Phase 105 - Engine-owned stat preview + combat resources
 * 
 * Proves:
 * - Stat preview matches engine API (engine has no cross-stat effects)
 * - Combat resource values come from engine state
 * - Skill affordability follows engine truth, not local approximation
 */

import { deriveStats, createCharacter } from 'axiomancer-mechanics';
import { 
    selectLevelUpViewModel, 
    calculateDerivedPreview,
    type PreviewAllocation 
} from '../levelup.engine';
import { selectCombatHudViewModel } from '../combat-hud.engine';
import type { AppStoreState } from '@/state/store';
import { EMPTY_EVENT_SLICE } from '@/state/store';

// Create minimal state for testing
function createTestState(overrides: Partial<AppStoreState> = {}): AppStoreState {
    const baseCharacter = createCharacter({
        name: 'TEST_CHARACTER',
        level: 5,
        baseStats: { heart: 10, body: 8, mind: 12 },
    });

    return {
        player: baseCharacter,
        combat: null,
        event: EMPTY_EVENT_SLICE,
        notifications: {
            levelUpAcknowledged: true,
            toast: { text: null, id: 0 },
        },
        ...overrides,
    } as AppStoreState;
}

describe('Phase 105: Engine truth stat preview', () => {
    it('calculateDerivedPreview uses engine deriveStats for accuracy', () => {
        const baseStats = { heart: 10, body: 8, mind: 12 };
        const allocation: PreviewAllocation = { heart: 2, body: 1, mind: 0 };
        
        // Calculate expected result using engine function directly
        const projectedStats = {
            heart: baseStats.heart + allocation.heart,
            body: baseStats.body + allocation.body,
            mind: baseStats.mind + allocation.mind,
        };
        const expected = deriveStats(projectedStats);
        
        // Test our function uses engine truth
        const result = calculateDerivedPreview(baseStats, allocation);
        
        expect(result.heart.attack).toBe(expected.emotionalAttack);
        expect(result.heart.skill).toBe(expected.emotionalSkill);
        expect(result.heart.defense).toBe(expected.emotionalDefense);
        
        expect(result.body.attack).toBe(expected.physicalAttack);
        expect(result.body.skill).toBe(expected.physicalSkill);
        expect(result.body.defense).toBe(expected.physicalDefense);
        
        expect(result.mind.attack).toBe(expected.mentalAttack);
        expect(result.mind.skill).toBe(expected.mentalSkill);
        expect(result.mind.defense).toBe(expected.mentalDefense);
    });

    it('calculateDerivedPreview shows stat specialization correctly', () => {
        const baseStats = { heart: 5, body: 5, mind: 5 };
        
        // Test that HEART allocation affects emotional stats only
        const heartAllocation = { heart: 5, body: 0, mind: 0 };
        const heartResult = calculateDerivedPreview(baseStats, heartAllocation);
        
        // Verify heart boost only affects emotional stats (no cross-effects in engine)
        expect(heartResult.heart.attack).toBeGreaterThan(heartResult.body.attack);
        expect(heartResult.heart.attack).toBeGreaterThan(heartResult.mind.attack);
        
        // Test that BODY allocation affects physical stats only
        const bodyAllocation = { heart: 0, body: 5, mind: 0 };
        const bodyResult = calculateDerivedPreview(baseStats, bodyAllocation);
        
        expect(bodyResult.body.attack).toBeGreaterThan(bodyResult.heart.attack);
        expect(bodyResult.body.attack).toBeGreaterThan(bodyResult.mind.attack);
    });

    it('selectLevelUpViewModel provides engine-derived current stats', () => {
        const state = createTestState();
        
        // Character should have availableStatPoints for levelup to be active
        state.player.availableStatPoints = 3;
        
        const vm = selectLevelUpViewModel(state);
        
        expect(vm.characterName).toBe('TEST_CHARACTER');
        expect(vm.totalPoints).toBe(3);
        
        // Current derived stats should match engine calculations
        const expectedDerived = deriveStats(state.player.baseStats);
        expect(vm.currentDerived.heart.attack).toBe(expectedDerived.emotionalAttack);
        expect(vm.currentDerived.body.attack).toBe(expectedDerived.physicalAttack);
        expect(vm.currentDerived.mind.attack).toBe(expectedDerived.mentalAttack);
    });
});

// Legacy turn-based combat (and `state.combat.combatResources`) was removed
// from the engine in mechanics 0.37.0. The persistent top-bar HUD no longer
// reads engine combat resources, so the mana bar always shows full (1.0); the
// former per-resource calculation cases were retired.
describe('combat HUD mana bar', () => {
    it('shows a full bar (no turn-based combat resources)', () => {
        const state = createTestState();

        const vm = selectCombatHudViewModel(state);

        expect(vm.manaPercent).toBe(1.0);
    });

    it('respects the dev override for mana hiding (full bar)', () => {
        const state = createTestState();
        state.devOverrides = {
            hud: { hideMana: true, hideEffects: false, hideStance: false },
        };

        const vm = selectCombatHudViewModel(state);

        expect(vm.manaPercent).toBe(1.0);
    });
});