/**
 * Phase 32 part 1b — Harvest's persistent Soul bank ("the jar travels").
 *
 * `applyHazardOutcome` (the panel's economy write-back, same call site that
 * already writes `floatingDice` back to the character) must fold whatever
 * `CombatEncounterState.souls` remains unspent at combat end into
 * `player.bankedSouls`, on every outcome — mirrors the floating-die pool's
 * own "persists regardless of how the fight ended" convention.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { createCharacter, initializeCombatEncounter, type CombatEncounterState, type CombatOutcome } from '@mechanics';

import { applyHazardOutcome } from '@/components/combat/encounter/CombatEncounterPanel';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

afterEach(() => {
    jest.restoreAllMocks();
});

function openEncounter(): CombatEncounterState {
    const player = createCharacter({ name: 'Reaper', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    return initializeCombatEncounter(player, createMockEncounterEnemy(), ['the-gleaners-due'], 7);
}

describe('applyHazardOutcome: Souls bank write-back (phase 32 part 1b)', () => {
    it('banks unspent souls onto a fresh character (starts at 0)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const finalState = { ...openEncounter(), souls: 5 };
        const enemy = createMockEncounterEnemy();

        applyHazardOutcome(store, 'victory' as CombatOutcome, finalState, enemy);

        expect(store.getState().player?.bankedSouls).toBe(5);
    });

    it('accumulates across repeated combats rather than overwriting', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const player = store.getState().player;
        store.setState({ player: { ...player, bankedSouls: 3 } } as never);
        const finalState = { ...openEncounter(), souls: 4 };
        const enemy = createMockEncounterEnemy();

        applyHazardOutcome(store, 'victory' as CombatOutcome, finalState, enemy);

        expect(store.getState().player?.bankedSouls).toBe(7);
    });

    it('banks on every outcome, not just victory — the jar travels regardless', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const finalState = { ...openEncounter(), souls: 2 };
        const enemy = createMockEncounterEnemy();

        applyHazardOutcome(store, 'defeat' as CombatOutcome, finalState, enemy);

        expect(store.getState().player?.bankedSouls).toBe(2);
    });

    it('a combat that never generated souls contributes 0', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const finalState = openEncounter();
        expect(finalState.souls ?? 0).toBe(0);
        const enemy = createMockEncounterEnemy();

        applyHazardOutcome(store, 'victory' as CombatOutcome, finalState, enemy);

        expect(store.getState().player?.bankedSouls).toBe(0);
    });
});
