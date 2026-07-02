/**
 * Hermetic E2E Tests — Engine store integration
 *
 * Drives `createAppStore` (which wraps `createGameStore` from
 * axiomancer-mechanics) end-to-end with a memory persistence adapter.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 *
 * Note: legacy turn-based combat (the `state.combat` slice, `selectCombat`,
 * `setCombatPhase`, …) was removed from the engine in mechanics 0.37.0.
 * "In combat" is now the engine's `currentEncounter` (`selectIsInCombat`);
 * the live card/dice combat runs in the encounter panel's local state.
 */

import { afterEach, beforeEach, describe, it, expect, jest } from '@jest/globals';
import {
    buildCombatDeck,
    createEnemy,
    getSkillById,
    initializeCombatEncounter,
    handCards,
    selectIsInCombat,
    selectPlayer,
    selectVersion,
} from 'axiomancer-mechanics';

import { createAppStore } from '../store';
import { createAppActions } from '../actions';
import { createMemoryAdapter, type MemoryAdapter } from '@/test-utils/memoryAdapter';

function makeEnemy() {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Lich',
        description: 'Stub for tests.',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        // The map.library types are unreachable from the published dist;
        // cast is fine — this is test scaffolding, not production data.
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
    });
}

let adapter: MemoryAdapter;

beforeEach(() => {
    adapter = createMemoryAdapter();
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path — provider-equivalent boot with a memory adapter
// ---------------------------------------------------------------------------

describe('createAppStore: happy path', () => {
    it('boots from createNewGameState when the adapter is empty', () => {
        const store = createAppStore({ adapter });
        const state = store.getState();

        expect(selectVersion(state)).toBeGreaterThan(0);
        expect(selectPlayer(state)).toBeTruthy();
        expect(selectPlayer(state).level).toBe(1);
        expect(selectIsInCombat(state)).toBe(false);
    });

    it('honours overrides supplied at construction time', () => {
        const store = createAppStore({
            adapter,
            // World/player default; only override moralMeter to assert the merge.
            overrides: { moralMeter: 7 },
        });
        expect(store.getState().moralMeter).toBe(7);
    });
});

// ---------------------------------------------------------------------------
// Action dispatch through the typed action layer
// ---------------------------------------------------------------------------

describe('createAppActions: dispatch', () => {
    it('startCombat records an active encounter', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        expect(selectIsInCombat(store.getState())).toBe(false);

        actions.startCombat(makeEnemy());

        expect(selectIsInCombat(store.getState())).toBe(true);
        expect(store.getState().currentEncounter?.enemies[0]?.name).toBe('Test Lich');
    });

    // Regression: a level-1 player's starter skills must ALL be learnable at
    // level 1 and yield a varied, powerable card hand. The old starter sourced
    // the engine's STARTING_SKILL_IDS, which included a level-14 skill the
    // player silently failed to learn — collapsing the deck to a single 0-power
    // guard card, so the hand drew the same ~3 do-nothing duplicates each turn.
    it('seeds a varied, effective starter deck for a fresh level-1 player', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        // startCombat runs ensureStarterSkills for a skill-less new player.
        actions.startCombat(makeEnemy());
        const player = selectPlayer(store.getState());

        // Every seeded starter skill must actually have been learned (none
        // silently dropped by an unmet learning requirement).
        expect(player.knownSkills.length).toBeGreaterThanOrEqual(5);
        for (const id of player.knownSkills) {
            expect(getSkillById(id)).toBeTruthy();
        }

        // The card deck is built from those known skills; after the synthetic
        // retreat card, the player must draw 5 distinct action cards (the hand
        // size) with no duplicates.
        const deck = buildCombatDeck(player);
        const encounter = initializeCombatEncounter(player, makeEnemy(), undefined, 7);
        const visible = handCards(encounter).filter(
            ({ card }) => card.id !== 'card-retreat' && card.verbClass !== 'retreat',
        );
        expect(deck.length).toBeGreaterThanOrEqual(6);
        expect(visible.length).toBeGreaterThanOrEqual(5);
        const distinct = new Set(visible.map(({ card }) => card.id));
        expect(distinct.size).toBe(visible.length);
        // At least one card must deal damage and at least one must defend —
        // i.e. the hand is actually playable, not all 0-power guards.
        const verbs = visible.map(({ card }) => card.verbClass);
        expect(verbs.some((v) => v.startsWith('direct'))).toBe(true);
        expect(verbs).toContain('defend');
    });

    it('endCombat clears the active encounter and preserves player progress', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        actions.startCombat(makeEnemy());
        expect(selectIsInCombat(store.getState())).toBe(true);

        actions.endCombat('victory');
        expect(selectIsInCombat(store.getState())).toBe(false);
        expect(selectPlayer(store.getState())).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Persistence adapter lifecycle — save() routes through the adapter
// ---------------------------------------------------------------------------

describe('persistence adapter: invocation pattern', () => {
    it('does not call save() during routine action dispatch', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        actions.startCombat(makeEnemy());
        actions.endCombat('victory');

        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('routes the explicit save() action through the adapter exactly once', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        actions.save();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(adapter.saveCount).toBe(1);
    });

    it('rehydrates from the adapter on the next boot when state was saved', () => {
        const a = createAppStore({ adapter });
        createAppActions(a).save();

        // New store with the same adapter — load() returns the persisted state.
        const b = createAppStore({ adapter });
        expect(selectVersion(b.getState())).toBe(selectVersion(a.getState()));
    });
});

// ---------------------------------------------------------------------------
// Selector stability — primitives stay === equal across unrelated changes
// ---------------------------------------------------------------------------

describe('selectors: stability', () => {
    it('primitive selector returns === equal results when unrelated state changes', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        const before = selectVersion(store.getState());
        actions.startCombat(makeEnemy());
        const after = selectVersion(store.getState());

        // Version is unrelated to the encounter — must be === stable.
        expect(after).toBe(before);
    });

    it('selectIsInCombat is false both before and after a complete combat cycle', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        expect(selectIsInCombat(store.getState())).toBe(false);
        actions.startCombat(makeEnemy());
        actions.endCombat('victory');
        expect(selectIsInCombat(store.getState())).toBe(false);
    });
});
