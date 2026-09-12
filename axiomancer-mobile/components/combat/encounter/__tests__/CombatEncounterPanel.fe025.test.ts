/**
 * FE-025 — the pre-fight commit gate must show the player's VITAE.
 *
 * The reveal priced the fight entirely in the foe's numbers — its
 * '120 / 120' and five phases of damage aimed at the player — while the
 * player's own VITAE appeared nowhere. The screen now prints
 * `vm.player.hp / vm.player.maxHp` beside the foe's, so this pins that the
 * view model carries the player pool the gate reads, separately from the
 * enemy's.
 */

import { describe, expect, it } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice, createCharacter } from '@mechanics';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

function encounterVm(health: number, maxHealth: number) {
    const base = createCharacter({ name: 'Pilgrim', level: 5, baseStats: { heart: 8, body: 8, mind: 8 } });
    const player = { ...base, health, maxHealth };
    const s = rollEncounterDice(
        initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16),
    ).state;
    return buildCombatViewModel(s);
}

describe('FE-025: the reveal has the player numbers it prints', () => {
    it('carries the player VITAE pool, not just the enemy one', () => {
        const vm = encounterVm(160, 160);
        expect(vm.player.hp).toBe(160);
        expect(vm.player.maxHp).toBe(160);
        expect(vm.enemy.maxHp).toBeGreaterThan(0);
    });

    it('tracks a hurt pilgrim rather than echoing the maximum', () => {
        const vm = encounterVm(37, 160);
        expect(vm.player.hp).toBe(37);
        expect(vm.player.maxHp).toBe(160);
        expect(vm.player.hp).not.toBe(vm.player.maxHp);
    });
});
