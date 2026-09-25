/**
 * Phase 54 — `applyHazardOutcome` now routes rewards through the engine's
 * real `endCombat` reducer instead of hand-rolling XP/loot/quest-advancement
 * itself. These tests stage `state.currentEncounter` via `startCombat` the
 * way `beginHazardEncounter` now does, then assert `endCombat`'s full grant
 * lands live: quest kill-objective advancement + completion reward, and —
 * on a merciful win — the authored `friendshipReward` payload (flags,
 * codex unlock, alignment shift, faction deltas, moral-meter). Resolves
 * `plan/AUDIT.md`'s endCombat row (first-map audit 2026-08-08, finding F3).
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    createCharacter, initializeCombatEncounter, type CombatEncounterState, type CombatOutcome,
    ENEMY_REGISTRY, getMapDefinition, emptyQuestLog, startQuest,
} from '@mechanics';

import { applyHazardOutcome } from '@/components/combat/encounter/CombatEncounterPanel';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

afterEach(() => {
    jest.restoreAllMocks();
});

function openEncounter(enemy = createMockEncounterEnemy()): CombatEncounterState {
    const player = createCharacter({ name: 'Reaper', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    return initializeCombatEncounter(player, enemy, ['the-gleaners-due'], 7);
}

describe('applyHazardOutcome: routes through endCombat (phase 54)', () => {
    it('victory grants endCombat-derived XP and clears the staged encounter', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const enemy = createMockEncounterEnemy();
        store.getState().startCombat(enemy);
        expect(store.getState().currentEncounter).not.toBeUndefined();

        const before = store.getState().player!.experience;
        const finalState = openEncounter(enemy);

        applyHazardOutcome(store, 'victory' as CombatOutcome, finalState, enemy);

        expect(store.getState().currentEncounter).toBeUndefined();
        expect(store.getState().player!.experience).toBe(before + (enemy.xpReward ?? 0));
    });

    it('defeat routes through endCombat too (no XP, encounter still clears)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const enemy = createMockEncounterEnemy();
        store.getState().startCombat(enemy);

        const before = store.getState().player!.experience;
        const finalState = openEncounter(enemy);

        applyHazardOutcome(store, 'defeat' as CombatOutcome, finalState, enemy);

        expect(store.getState().currentEncounter).toBeUndefined();
        expect(store.getState().player!.experience).toBe(before);
    });

    it('a merciful win maps to the reducer\'s friendship outcome and activates authored friendshipReward content', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        // Little Belle: friendshipReward carries items, xpBonus, flagSet,
        // alignmentDelta and journalEntry — real authored content, not a test
        // fixture, previously unreachable from live hazard combat.
        const littleBelle = ENEMY_REGISTRY['little-belle'];
        store.getState().startCombat(littleBelle);
        const finalState = openEncounter(littleBelle);

        applyHazardOutcome(store, 'mercy' as CombatOutcome, finalState, littleBelle);

        const state = store.getState();
        expect(state.currentEncounter).toBeUndefined();
        expect(state.flags).toContain(littleBelle.friendshipReward!.flagSet);
        expect(state.philosophicalAlignment.outlook).toBe(littleBelle.friendshipReward!.alignmentDelta!.outlook);
        expect(state.codex.unlockedEntries).toContain(littleBelle.journalEntry!.id);
        expect(state.moralMeter).toBe(1);
        const expectedXp = Math.floor((littleBelle.xpReward ?? 0) * 0.5) + (littleBelle.friendshipReward!.xpBonus ?? 0);
        expect(state.player!.experience).toBe(expectedXp);
    });

    it('befriending the King of Revenge completes starting-quest and grants its currency reward', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const boss = ENEMY_REGISTRY['king-of-revenge'];
        const startingQuest = getMapDefinition('coastal-continent', 'fishing-village').quests!.find((q) => q.name === 'starting-quest')!;
        store.setState({ quests: startQuest(emptyQuestLog(), startingQuest) });
        store.getState().startCombat(boss);
        const finalState = openEncounter(boss);
        const currencyBefore = store.getState().player!.currency;

        // capitulate is one of the three merciful outcomes (mercy / capitulate
        // / concede) — the audit's F3 finding named exactly this class of win
        // as the one that never advanced kill objectives live.
        applyHazardOutcome(store, 'capitulate' as CombatOutcome, finalState, boss);

        const state = store.getState();
        expect(state.quests.completed).toContain('starting-quest');
        expect(state.player!.currency).toBe(currencyBefore + 25);
        expect(state.flags).toContain(boss.friendshipReward!.flagSet);
    });
});
