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
    getCardById, STARTING_CARD_IDS,
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

    // Spec 32 v3 §7 — the authored starting deck: rot erosion + Guard, plus
    // one card in EACH stance colour (playthrough report 2026-09-05 — the old
    // two-card set was mono-BODY, so every opening hand read solid red and a
    // heart or mind die had nothing legal to power). No synthetic Retreat is
    // appended (no in-combat retreat exists). Every starter must be level-1
    // learnable (none silently dropped by an unmet learning requirement) and
    // each teaches a mechanic in fight one.
    it('seeds the authored v3 starter deck for a fresh level-1 player', () => {
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        // startCombat runs ensureStarterCards for a card-less new player.
        actions.startCombat(makeEnemy());
        const player = selectPlayer(store.getState());

        // Phase 104 — the seed is the engine's grey office, VERBATIM (copies
        // kept: 7 STRIKE / 3 WARD), never a learn-gated subset.
        expect(player.knownCards).toEqual([...STARTING_CARD_IDS]);
        expect(player.knownCards).toHaveLength(10);
        for (const id of player.knownCards) {
            expect(getCardById(id)).toBeTruthy();
        }

        // THE COLOUR LAW at the starter gate: no die colour is dead on turn
        // one — every grey card is powered by any die.
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
        expect(deck).toHaveLength(10);
        expect(visible.length).toBeGreaterThanOrEqual(4);
        // Phase 104 — the opening hand is dealt from the grey office alone:
        // every visible card is one of its two shapes, and every one of them
        // projects as the WILD stance (any die powers it).
        const distinct = new Set(visible.map(({ card }) => card.id));
        expect(distinct.size).toBeGreaterThan(0);
        for (const id of distinct) expect(['grey-strike', 'grey-ward']).toContain(id);
        for (const { card } of visible) expect(card.stance).toBe('wild');
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
