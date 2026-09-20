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
    getCardById,
    initializeCombatEncounter,
    handCards,
    selectIsInCombat,
    selectPlayer,
    selectVersion,
} from '@mechanics';

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

    // Phase 104 (the grey office) — the authored starting deck: two
    // colourless shapes (`grey-strike` ×7, `grey-ward` ×3), every die colour
    // powers either, so fight one teaches STRIKE, WARD, FREE-vs-PAID, and the
    // die-spend loop with zero colour arithmetic. No synthetic Retreat is
    // appended (no in-combat retreat exists).
    it('seeds the grey office for a fresh level-1 player', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        // startCombat runs ensureStarterCards for a card-less new player.
        actions.startCombat(makeEnemy());
        const player = selectPlayer(store.getState());

        // Every seeded starter card must resolve, verbatim copies kept.
        expect(player.knownCards).toEqual([
            'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike',
            'grey-strike', 'grey-strike', 'grey-strike',
            'grey-ward', 'grey-ward', 'grey-ward',
        ]);
        for (const id of player.knownCards) {
            expect(getCardById(id)).toBeTruthy();
        }

        // Every seeded starter shares the same colourless aspect — any die
        // powers any starter, so there is no colour left to fail to cover.
        const aspects = new Set(
            player.knownCards.map((id) => getCardById(id)!.philosophicalAspect),
        );
        expect([...aspects]).toEqual(['any']);

        // The card deck is built from those known cards; the player must draw
        // real action cards from it.
        const deck = buildCombatDeck(player);
        const encounter = initializeCombatEncounter(player, makeEnemy(), undefined, 7);
        const visible = handCards(encounter).filter(
            ({ card }) => card.id !== 'card-retreat' && card.verbClass !== 'retreat',
        );
        expect(deck.length).toBe(10);
        expect(visible.length).toBeGreaterThanOrEqual(5);
        const distinct = new Set(visible.map(({ card }) => card.id));
        expect(distinct).toEqual(new Set(['grey-strike', 'grey-ward']));
        // grey-ward defends; grey-strike's plain `deal` mechanic falls to the
        // classifier's default bucket (no dedicated direct-damage class for
        // a bare hit — see `classifyVerbClass`).
        const verbs = visible.map(({ card }) => card.verbClass);
        expect(verbs).toContain('defend');
    });

    it('seeding the grey office sets the bundle-chosen flag (no picker re-shown)', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        expect((store.getState() as unknown as { flags?: string[] }).flags ?? []).not.toContain('starter-bundle-chosen');
        actions.startCombat(makeEnemy());
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        expect(flags).toContain('starter-bundle-chosen');
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
