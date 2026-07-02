/**
 * Hermetic presenter tests — selectCombatHudViewModel (Phase 87).
 *
 * Pins:
 *   - HP percent calculation from player health
 *   - Mana bar shows full (1.0) — legacy turn-based combat resources
 *     were removed from the engine in mechanics 0.37.0
 *   - Effects list truncation at MAX_EFFECTS_SHOWN
 *   - Dev overrides (hideMana, hideEffects, hideStance) force empty states
 */

import { describe, expect, it } from '@jest/globals';

import { selectCombatHudViewModel } from '@/state/presenters/combat-hud.engine';
import type { AppStoreState } from '@/state/store';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeBaseState(): AppStoreState {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return store.getState();
}

describe('selectCombatHudViewModel: HP calculation', () => {
    it('returns 1.0 for full health player', () => {
        const state = makeBaseState();
        state.player.health = 100;
        state.player.maxHealth = 100;

        const vm = selectCombatHudViewModel(state);
        expect(vm.hpPercent).toBe(1.0);
    });

    it('returns 0.5 for half health player', () => {
        const state = makeBaseState();
        state.player.health = 50;
        state.player.maxHealth = 100;

        const vm = selectCombatHudViewModel(state);
        expect(vm.hpPercent).toBe(0.5);
    });

    it('returns 0 when maxHealth is 0 (defensive)', () => {
        const state = makeBaseState();
        state.player.health = 50;
        state.player.maxHealth = 0;

        const vm = selectCombatHudViewModel(state);
        expect(vm.hpPercent).toBe(0);
    });
});

describe('selectCombatHudViewModel: mana calculation', () => {
    // Legacy turn-based combat (and its `state.combat.combatResources`) was
    // removed in mechanics 0.37.0. This persistent top-bar HUD no longer has
    // an engine combat-resources source, so the mana bar always shows full
    // (1.0) out of combat; the live card/dice HUD renders in the encounter
    // panel. The former in-combat mana-percent cases were retired.
    it('returns 1.0 (full bar) with no active turn-based combat', () => {
        const state = makeBaseState();

        const vm = selectCombatHudViewModel(state);
        expect(vm.manaPercent).toBe(1.0);
    });
});

describe('selectCombatHudViewModel: effects list', () => {
    it('returns empty effects array when player has no effects', () => {
        const state = makeBaseState();
        state.player.effects = [];

        const vm = selectCombatHudViewModel(state);
        expect(vm.effects).toEqual([]);
    });

    it('maps player effects to display format', () => {
        const state = makeBaseState();
        state.player.effects = [
            { 
                effectId: 'blessing-of-flame', 
                intensity: 2, 
                remainingDuration: 5,
                appliedAt: 0,
                tier: 1,
            },
        ];

        const vm = selectCombatHudViewModel(state);
        expect(vm.effects).toEqual([
            { effectId: 'blessing-of-flame', intensity: 2, remainingDuration: 5 },
        ]);
    });

    it('truncates effects list at MAX_EFFECTS_SHOWN', () => {
        const state = makeBaseState();
        // Create more effects than the max (MAX_EFFECTS_SHOWN is 4)
        state.player.effects = Array.from({ length: 8 }, (_, i) => ({
            effectId: `effect-${i}`,
            intensity: 1,
            remainingDuration: 3,
            appliedAt: 0,
            tier: 1,
        }));

        const vm = selectCombatHudViewModel(state);
        expect(vm.effects).toHaveLength(4); // MAX_EFFECTS_SHOWN
    });
});

describe('selectCombatHudViewModel: dev overrides (Phase 87)', () => {
    it('hideMana override forces manaPercent to 1.0 regardless of actual resources', () => {
        const state = makeBaseState();
        state.devOverrides = {
            hud: { hideMana: true, hideEffects: false, hideStance: false },
        };

        const vm = selectCombatHudViewModel(state);
        expect(vm.manaPercent).toBe(1.0); // Forced to "full bar" appearance
    });

    it('hideEffects override forces empty effects array', () => {
        const state = makeBaseState();
        state.player.effects = [
            { effectId: 'blessing', intensity: 1, remainingDuration: 5, appliedAt: 0, tier: 1 },
            { effectId: 'curse', intensity: 2, remainingDuration: 3, appliedAt: 1, tier: 1 },
        ];
        state.devOverrides = {
            hud: { hideMana: false, hideEffects: true, hideStance: false },
        };

        const vm = selectCombatHudViewModel(state);
        expect(vm.effects).toEqual([]); // Forced empty for testing
    });

    it('overrides work independently — can hide multiple elements', () => {
        const state = makeBaseState();
        state.player.effects = [{ effectId: 'test', intensity: 1, remainingDuration: 2, appliedAt: 0, tier: 1 }];
        state.devOverrides = {
            hud: { hideMana: true, hideEffects: true, hideStance: false },
        };

        const vm = selectCombatHudViewModel(state);
        expect(vm.manaPercent).toBe(1.0); // Hidden
        expect(vm.effects).toEqual([]); // Hidden
    });

    it('works when devOverrides is missing (defensive)', () => {
        const state = makeBaseState();
        delete (state as any).devOverrides; // Simulate old state

        const vm = selectCombatHudViewModel(state);
        // No turn-based combat resources → full bar.
        expect(vm.manaPercent).toBe(1.0);
    });
});