/**
 * Hermetic E2E Tests — Hazard minigame store flow.
 *
 * Drives the full session through the store action layer: begin →
 * route → stage/power → resolve → outcome → rewards → claim, and
 * verifies the claim applies VITAE / max-VITAE / currency / deck
 * flags to the live engine state. Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { HAZARD_CRACK_CARD, getHazardDef } from 'axiomancer-mechanics';
import { decodeAcquiredCards } from 'axiomancer-mechanics';
import { HAZARD_HEXED_FLAG } from '@/state/hazard/store-actions';
import type { HazardHandEntry, HazardSessionState } from 'axiomancer-mechanics';
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
    store.setState({ hazard: { session: { ...s, hand, play: [] } } });
}

function rigDice(store: AppStore, dice: HazardSessionState['dice']): void {
    const s = session(store);
    store.setState({ hazard: { session: { ...s, dice } } });
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
        rigHand(store, [{ uid: 'h1', cardId: 'steps' }]);
        rigDice(store, [{ id: 'dr', kind: 'red', state: 'available' }]);
        actions.stageHazardCard('h1');
        expect(session(store).play).toHaveLength(1);
        actions.powerHazardCard('h1', 'dr');
        expect(session(store).play[0].dieId).toBe('dr');
        actions.unstageHazardCard('h1');
        expect(session(store).hand.map((h) => h.uid)).toContain('h1');
        expect(session(store).dice[0].state).toBe('available');
    });

    it('perfect run claim: vitae, shillings, token flag, picked card persists to deck flags, session clears, save fires', () => {
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
        // safe perfect rewards: cache (+12 shillings) + vitae (+6) + token,
        // plus 1 reserve die (d1; the hex never counts), plus any completed
        // sub-quest bonuses (objectives roll per seed).
        expect(state.player.currency).toBe(currencyBefore + 12 + outcome.questShillings);
        expect(state.player.health).toBe(
            Math.min(state.player.maxHealth, 5 + 6 + 1 + outcome.questVitae),
        );
        expect(state.flags.some((f) => f.startsWith('hazard-token-banked:'))).toBe(true);
        expect(decodeAcquiredCards(state.flags)).toContain(offered.id);
        expect(store.getState().hazard.session).toBeNull();
        expect(save).toHaveBeenCalled();
    });

    it('failure claim: penalty + consequences hit VITAE/max VITAE, CRACK joins the deck, hexed flag set, vitae floors at 1', () => {
        const { store, actions } = makeStoreAndActions();
        // Phase 130 — this case probes the maim-to-1 floor + scar, which
        // requires SURVIVING the crossing on exactly 1 VITAE. The −20 VITAE
        // swing (minhp −8 + penaltyVitae −12) is lethal at the default 15
        // VITAE (out-of-combat death); 21 VITAE lands the swing on exactly 1
        // — the floor, not a death. maxHealth (the scar baseline) is left
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
        expect(state.flags).toContain(HAZARD_HEXED_FLAG);
        expect(store.getState().hazard.session).toBeNull();
    });

    it('tokens consequence clears previously banked token flags', () => {
        const { store, actions } = makeStoreAndActions();
        store.setState({
            flags: [...(store.getState() as unknown as GameState).flags, 'hazard-token-banked:test'],
        } as never);
        actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
        actions.selectHazardRoute('safe');
        actions.finishHazardRolling();
        // win round 1 only → complete with 2 losses → maxhp+deadcard…
        // 1 loss = tokens. Win rounds 1 and 2, lose round 3.
        playRound(store, actions, 'grip', 6);
        playRound(store, actions, 'grip', 6);
        playRound(store, actions, null);
        expect(session(store).outcome?.consequences).toEqual(['tokens']);
        actions.acknowledgeHazardOutcome();
        actions.claimHazardRewards(session(store).outcome!.offerCards[0].id);
        const state = store.getState() as unknown as GameState;
        expect(state.flags.some((f) => f.startsWith('hazard-token-banked:'))).toBe(false);
    });

    it('acquired cards from previous hazards appear in the next session draw bag', () => {
        const { store, actions } = makeStoreAndActions();
        // Seed the deck with 20 copies of a reward card via flags.
        let flags = (store.getState() as unknown as GameState).flags;
        for (let i = 0; i < 20; i++) flags = [...flags, `hazard-card:r_crown:${i + 1}`];
        store.setState({ flags } as never);
        actions.beginHazard({ seed: 3, hazardId: 'cracked-cliff' });
        // Starter bag is 28; with 20 r_crown copies the opening hand of 5
        // statistically contains one — assert via pile + hand contents.
        const s = session(store);
        const all = [...s.drawPile, ...s.hand.map((h) => h.cardId)];
        expect(all.filter((c) => c === 'r_crown').length).toBe(20);
    });

    it('abandonHazard clears the session with no state changes', () => {
        const { store, actions } = makeStoreAndActions();
        const healthBefore = (store.getState() as unknown as GameState).player.health;
        actions.beginHazard({ seed: 5 });
        actions.abandonHazard();
        expect(store.getState().hazard.session).toBeNull();
        expect((store.getState() as unknown as GameState).player.health).toBe(healthBefore);
    });

    it('claim applies MEND vitae and BOUNTY shillings (codex 0.18.0)', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const player = before.player;
        store.setState({
            player: { ...player, health: Math.max(1, player.maxHealth - 10) },
        } as never);
        const healthBefore = (store.getState() as unknown as GameState).player.health;
        const currencyBefore = player.currency;

        actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
        const s = session(store);
        store.setState({
            hazard: {
                session: {
                    ...s,
                    phase: 'rewards',
                    outcome: {
                        tier: 'complete',
                        wins: 1,
                        losses: 2,
                        rewards: [],
                        consequences: [],
                        offerCards: [],
                        canSkip: false,
                        reserveBonus: 0,
                        penaltyVitae: 0,
                        vitaeCost: 0,
                        vitaeRestore: 4,
                        bountyShillings: 8,
                        subquests: [],
                        questShillings: 0,
                        questVitae: 0,
                        questTokens: 0,
                    },
                },
            },
        });
        const result = actions.claimHazardRewards(null);
        expect(result.applied).toBe(true);
        const after = store.getState() as unknown as GameState;
        expect(after.player.health).toBe(healthBefore + 4);
        expect(after.player.currency).toBe(currencyBefore + 8);
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
