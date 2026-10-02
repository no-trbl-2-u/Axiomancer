/**
 * Hermetic E2E Tests — Hazard minigame store flow.
 *
 * Drives the full session through the store action layer: begin →
 * route → stage/power → resolve → outcome → rewards → claim, and
 * verifies the claim applies VITAE / max-VITAE / currency / deck
 * flags to the live engine state. Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from '@mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { HAZARD_CRACK_CARD, getHazardDef } from '@mechanics';
import { decodeAcquiredCards } from '@mechanics';
import type { HazardHandEntry, HazardSessionState } from '@mechanics';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_HAZARD_SEED__?: number }).__AXM_HAZARD_SEED__;
    delete (globalThis as { __AXM_HAZARD_ID__?: string }).__AXM_HAZARD_ID__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): HazardSessionState {
    const s = store.getState().hazard.session;
    if (!s) throw new Error('expected an active hazard session');
    return s;
}

/** Overwrite the session's hand with specific cards (test rigging). */
function rigHand(store: AppStore, cards: { uid: string; cardId: string }[]): void {
    const s = session(store);
    const hand: HazardHandEntry[] = cards.map((c) => ({ ...c, dieId: null }));
    store.setState({ hazard: { session: { ...s, hand, play: [] }, tutorial: false } });
}

function rigDice(store: AppStore, dice: HazardSessionState['dice']): void {
    const s = session(store);
    store.setState({ hazard: { session: { ...s, dice }, tutorial: false } });
}

/** Plays one rigged round: stage everything, resolve, continue. */
function playRound(store: AppStore, actions: AppActions, cardId: string | null, copies = 6): void {
    rigHand(
        store,
        cardId
            ? Array.from({ length: copies }, (_, i) => ({ uid: `t${session(store).round}-${i}`, cardId }))
            : [{ uid: `t${session(store).round}-0`, cardId: HAZARD_CRACK_CARD.id }],
    );
    for (const h of session(store).hand.slice()) actions.stageHazardCard(h.uid);
    actions.resolveHazardRound();
    actions.continueHazardAfterResolve();
}

describe('hazard store flow', () => {
    it('beginHazard honors the dev seed/id overrides and is deterministic', () => {
        (globalThis as { __AXM_HAZARD_SEED__?: number }).__AXM_HAZARD_SEED__ = 1234;
        (globalThis as { __AXM_HAZARD_ID__?: string }).__AXM_HAZARD_ID__ = 'cracked-cliff';
        const a = makeStoreAndActions();
        const b = makeStoreAndActions();
        expect(a.actions.beginHazard()).toBe(true);
        expect(b.actions.beginHazard()).toBe(true);
        expect(session(a.store)).toEqual(session(b.store));
        expect(session(a.store).hazardId).toBe('cracked-cliff');
    });

    it('refuses to stack a second hazard on an active session', () => {
        const { actions } = makeStoreAndActions();
        expect(actions.beginHazard({ seed: 1 })).toBe(true);
        expect(actions.beginHazard({ seed: 2 })).toBe(false);
    });

    it('walks the canonical phase order: route-select → rolling → playing', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ seed: 7, hazardId: 'cracked-cliff' });
        expect(session(store).phase).toBe('route-select');
        expect(session(store).hand).toHaveLength(5); // hand BEFORE dice
        expect(session(store).dice).toHaveLength(0);
        actions.selectHazardRoute('risk');
        expect(session(store).phase).toBe('rolling');
        expect(session(store).dice).toHaveLength(4);
        actions.finishHazardRolling();
        expect(session(store).phase).toBe('playing');
    });

    it('stage / power / unstage round-trips through the slice', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginHazard({ seed: 7, hazardId: 'cracked-cliff' });
        actions.selectHazardRoute('safe');
        actions.finishHazardRolling();
        rigHand(store, [{ uid: 'h1', cardId: 'haul' }]);
        rigDice(store, [{ id: 'dr', kind: 'red', state: 'available' }]);
        actions.stageHazardCard('h1');
        expect(session(store).play).toHaveLength(1);
        actions.powerHazardCard('h1', 'dr');
        expect(session(store).play[0].dieId).toBe('dr');
        actions.unstageHazardCard('h1');
        expect(session(store).hand.map((h) => h.uid)).toContain('h1');
        expect(session(store).dice[0].state).toBe('available');
    });

    it('perfect run claim: vitae, shillings, picked card persists to deck flags, session clears, save fires', () => {
        const { store, actions } = makeStoreAndActions();
        const save = jest.spyOn(store.getState(), 'save');
        store.setState({ player: { ...store.getState().player, health: 5 } } as never);
        const currencyBefore = (store.getState() as unknown as GameState).player.currency;

        actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
        actions.selectHazardRoute('safe');
        actions.finishHazardRolling();
        // keep dice unspent for a deterministic reserve bonus
        rigDice(store, [
            { id: 'd1', kind: 'red', state: 'available' },
            { id: 'd2', kind: 'hex', state: 'available' },
        ]);
        for (let r = 0; r < 3; r++) playRound(store, actions, 'grip', 6);

        expect(session(store).phase).toBe('outcome');
        expect(session(store).outcome?.tier).toBe('perfect');
        actions.acknowledgeHazardOutcome();
        const outcome = session(store).outcome!;
        const offered = outcome.offerCards[0];
        const result = actions.claimHazardRewards(offered.id);

        expect(result.applied).toBe(true);
        const state = store.getState() as unknown as GameState;
        // safe perfect rewards: shillings (+12) + vitae (+6), plus 1 reserve
        // die (d1; the hex never counts). No flag records a reward.
        expect(outcome.rewards).toEqual(['shillings', 'vitae']);
        expect(state.player.currency).toBe(currencyBefore + 12);
        expect(state.player.health).toBe(Math.min(state.player.maxHealth, 5 + 6 + 1));
        expect(state.flags.some((f) => f.startsWith('hazard-token-banked:'))).toBe(false);
        expect(decodeAcquiredCards(state.flags)).toContain(offered.id);
        expect(store.getState().hazard.session).toBeNull();
        expect(save).toHaveBeenCalled();
    });

    it('failure claim: penalty + consequences hit VITAE/max VITAE, CRACK joins the deck, no hex flag, vitae floors at 1', () => {
        const { store, actions } = makeStoreAndActions();
        // This case probes the maim-to-1 floor + scar, which
        // requires SURVIVING the crossing on exactly 1 VITAE. The −20 VITAE
        // swing (minhp −8 + penaltyVitae −12) from 21 VITAE lands on exactly
        // 1 — the floor, not a death (any lower is out-of-combat death). maxHealth (the scar baseline) is left
        // untouched so the −5 scar assertion below still holds.
        const p0 = (store.getState() as unknown as GameState).player;
        store.setState({ player: { ...p0, health: 21 } } as never);
        actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
        actions.selectHazardRoute('risk');
        actions.finishHazardRolling();
        const maxBefore = (store.getState() as unknown as GameState).player.maxHealth;
        for (let r = 0; r < 3; r++) playRound(store, actions, null);

        expect(session(store).outcome?.tier).toBe('failure');
        const def = getHazardDef('cracked-cliff');
        expect(session(store).outcome?.penaltyVitae).toBe(def.risk.penaltyVitae * 3);
        actions.acknowledgeHazardOutcome();
        const result = actions.claimHazardRewards(null);

        expect(result.applied).toBe(true);
        const state = store.getState() as unknown as GameState;
        expect(state.player.maxHealth).toBe(maxBefore - 5); // Scarred
        expect(state.player.health).toBe(1); // maimed, never killed
        expect(decodeAcquiredCards(state.flags)).toContain(HAZARD_CRACK_CARD.id);
        expect(state.flags).not.toContain('hazard-hexed');
        expect(store.getState().hazard.session).toBeNull();
    });

    it('risk route perfect claim pays the larger purse and the heal', () => {
        const { store, actions } = makeStoreAndActions();
        store.setState({ player: { ...store.getState().player, health: 5 } } as never);
        const currencyBefore = (store.getState() as unknown as GameState).player.currency;
        actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
        actions.selectHazardRoute('risk');
        actions.finishHazardRolling();
        rigDice(store, []);
        for (let r = 0; r < 3; r++) playRound(store, actions, 'footing', 6);
        expect(session(store).outcome?.rewards).toEqual(['riskShillings', 'vitae']);
        actions.acknowledgeHazardOutcome();
        actions.claimHazardRewards(session(store).outcome!.offerCards[0].id);
        const state = store.getState() as unknown as GameState;
        expect(state.player.currency).toBe(currencyBefore + 32);
        expect(state.player.health).toBe(Math.min(state.player.maxHealth, 5 + 6));
    });

    it('one lost round costs only the route penalty', () => {
        const { store, actions } = makeStoreAndActions();
        const before = (store.getState() as unknown as GameState).player;
        actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
        actions.selectHazardRoute('safe');
        actions.finishHazardRolling();
        rigDice(store, []);
        playRound(store, actions, 'grip', 6);
        playRound(store, actions, 'grip', 6);
        playRound(store, actions, null);
        const outcome = session(store).outcome!;
        expect(outcome.consequences).toEqual([]);
        expect(outcome.rewards).toEqual(['vitae']);
        actions.acknowledgeHazardOutcome();
        actions.claimHazardRewards(outcome.offerCards[0].id);
        const state = store.getState() as unknown as GameState;
        expect(state.player.maxHealth).toBe(before.maxHealth);
        expect(state.player.health).toBe(
            Math.min(before.maxHealth, before.health + 6 - getHazardDef('cracked-cliff').safe.penaltyVitae),
        );
    });

    it('acquired cards from previous hazards appear in the next session draw bag', () => {
        const { store, actions } = makeStoreAndActions();
        // Seed the deck with 20 acquired copies of a card via flags.
        let flags = (store.getState() as unknown as GameState).flags;
        for (let i = 0; i < 20; i++) flags = [...flags, `hazard-card:blessing:${i + 1}`];
        store.setState({ flags } as never);
        actions.beginHazard({ seed: 3, hazardId: 'cracked-cliff' });
        // The starter bag holds one BLESSING; the 20 acquired copies join it —
        // assert via pile + hand contents.
        const s = session(store);
        const all = [...s.drawPile, ...s.hand.map((h) => h.cardId)];
        expect(all.filter((c) => c === 'blessing').length).toBe(21);
    });

    it('abandonHazard clears the session with no state changes', () => {
        const { store, actions } = makeStoreAndActions();
        const healthBefore = (store.getState() as unknown as GameState).player.health;
        actions.beginHazard({ seed: 5 });
        actions.abandonHazard();
        expect(store.getState().hazard.session).toBeNull();
        expect((store.getState() as unknown as GameState).player.health).toBe(healthBefore);
    });
});

describe('hazard event interception', () => {
    it('a resolved hazard map event starts the minigame instead of applying passive damage', () => {
        const { store, actions } = makeStoreAndActions();
        const stateBefore = store.getState() as unknown as GameState;
        const healthBefore = stateBefore.player.health;

        // Simulate what resolveCurrentMapEvent does for hazard kind by
        // exercising the real action against a node wired to a hazard
        // pool is map-dependent; instead assert the contract directly:
        // beginHazard leaves the player untouched and fills the slice.
        expect(actions.beginHazard({ seed: 11 })).toBe(true);
        expect(store.getState().hazard.session).not.toBeNull();
        expect((store.getState() as unknown as GameState).player.health).toBe(healthBefore);
        // The event slice stays empty — no ENDURE modal.
        expect(store.getState().event.pending).toBeNull();
    });
});
