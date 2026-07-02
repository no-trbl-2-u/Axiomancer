/**
 * Hermetic E2E Tests — Gathering minigame store flow.
 *
 * Drives full gleanings through the store action layer: begin →
 * approach → harvest/offer/tool → withdraw (or erupt) → outcome →
 * spoils → claim, and verifies the claim applies materials / VITAE /
 * currency / flags to the live engine state. Seeded; no timers, no
 * network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import {
    GATHERING_SCAR_FLAG,
    GATHERING_GRACE_FLAG,
} from '@/state/gathering/store-actions';
import { GATHER_WRATH_MAX, GATHERING_TUNING } from 'axiomancer-mechanics';
import type { GatherPiece, GatherPlotEntry, GatheringSessionState } from 'axiomancer-mechanics';
import { selectGatheringViewModel } from '@/state/presenters/gathering.engine';
import { createMemoryAdapter, type MemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_GATHER_SEED__?: number }).__AXM_GATHER_SEED__;
    delete (globalThis as { __AXM_GATHER_SITE__?: string }).__AXM_GATHER_SITE__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions; adapter: MemoryAdapter } {
    const adapter = createMemoryAdapter();
    const store = createAppStore({ adapter });
    return { store, actions: createAppActions(store), adapter };
}

function session(store: AppStore): GatheringSessionState {
    const s = store.getState().gathering.session;
    if (!s) throw new Error('expected an active gathering session');
    return s;
}

function rigSession(store: AppStore, over: Partial<GatheringSessionState>): void {
    store.setState({ gathering: { ...store.getState().gathering, session: { ...session(store), ...over } } });
}

function plot(uid: string, plotId: string): GatherPlotEntry {
    return { uid, plotId };
}

function piece(uid: string, plotId: string, family: GatherPiece['family'], richness: number): GatherPiece {
    return { uid, plotId, family, richness, name: 'piece' };
}

describe('gathering store flow — a clean gleaning', () => {
    it('begin → glean → harvest → withdraw → claim applies materials and coin', () => {
        const { store, actions, adapter } = makeStoreAndActions();
        const startState = store.getState() as unknown as GameState;
        const startHealth = startState.player.health;
        const startCurrency = startState.player.currency;
        const startInventory = startState.player.inventory.length;

        expect(actions.beginGathering({ seed: 7, siteId: 'mire-mint' })).toBe(true);
        expect(actions.beginGathering({ seed: 8 })).toBe(false); // one at a time
        expect(session(store).phase).toBe('approach-select');

        actions.selectGatheringApproach('glean');
        expect(session(store).phase).toBe('foraging');
        expect(session(store).grace).toBe(GATHERING_TUNING.approaches.glean.startGrace);

        // Rig a known spread: two cheap takings.
        rigSession(store, { spread: [plot('a', 'widow-moss'), plot('b', 'wax-shelf'), plot('c', 'mint-crown')] });
        actions.harvestGatheringPlot('a');
        actions.harvestGatheringPlot('b');
        expect(session(store).satchel).toHaveLength(2);

        actions.withdrawFromGathering();
        expect(session(store).phase).toBe('outcome');
        actions.acknowledgeGatheringOutcome();
        expect(session(store).phase).toBe('rewards');

        const result = actions.claimGatheringSpoils();
        expect(result.applied).toBe(true);
        expect(result.piecesKept).toBe(2);

        const after = store.getState() as unknown as GameState;
        // Materials landed in the inventory as stacks.
        expect(after.player.inventory.length).toBe(startInventory + result.itemsAdded);
        const names = after.player.inventory.map((i) => i.name);
        expect(names).toContain("Widow's Moss");
        // No bites, no offerings: health and coin hold (no spoils coin here).
        expect(after.player.health).toBe(startHealth);
        expect(after.player.currency).toBeGreaterThanOrEqual(startCurrency);
        // Session cleared + persisted.
        expect(store.getState().gathering.session).toBeNull();
        expect(adapter.saveCount).toBeGreaterThan(0);
    });

    it('a communion exit blesses: vitae restored, grace flag, morale up', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ seed: 11, siteId: 'bone-orchard' });
        actions.selectGatheringApproach('glean');
        const player = (store.getState() as unknown as GameState).player;
        store.setState({ player: { ...player, health: Math.max(1, player.maxHealth - 10) } } as never);
        const woundedHealth = (store.getState() as unknown as GameState).player.health;

        rigSession(store, {
            grace: 2,
            wrath: 2,
            satchel: [piece('s1', 'widow-moss', 'bloom', 2)],
        });
        actions.withdrawFromGathering();
        expect(session(store).outcome?.tier).toBe('communion');
        actions.acknowledgeGatheringOutcome();
        const result = actions.claimGatheringSpoils();

        expect(result.blessed).toBe(true);
        const after = store.getState() as unknown as GameState;
        expect(after.player.health).toBe(woundedHealth + GATHERING_TUNING.outcome.blessingVitae);
        expect(after.flags).toContain(GATHERING_GRACE_FLAG);
        expect(after.flags).not.toContain(GATHERING_SCAR_FLAG);
    });

    it('an eruption routs: pieces clawed back, bite lands, scar flag set', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ seed: 13, siteId: 'weeping-pines' });
        actions.selectGatheringApproach('strip');
        const startHealth = (store.getState() as unknown as GameState).player.health;

        rigSession(store, {
            wrath: GATHER_WRATH_MAX - 1,
            thresholdsFired: [true, true],
            satchel: [
                piece('s1', 'amber-weep', 'resin', 3),
                piece('s2', 'wax-shelf', 'resin', 1),
                piece('s3', 'salt-lace', 'vein', 1),
                piece('s4', 'knuckle-cache', 'bone', 2),
            ],
            spread: [plot('a', 'gilt-scab')],
        });
        actions.harvestGatheringPlot('a');
        expect(session(store).phase).toBe('reprisal');
        expect(session(store).erupted).toBe(true);

        actions.continueGatheringAfterReprisal();
        expect(session(store).outcome?.tier).toBe('routed');
        // strip loses half (5 pieces → 3 clawed back).
        expect(session(store).outcome?.lost).toHaveLength(3);
        actions.acknowledgeGatheringOutcome();
        const result = actions.claimGatheringSpoils();

        expect(result.scarred).toBe(true);
        const after = store.getState() as unknown as GameState;
        expect(after.flags).toContain(GATHERING_SCAR_FLAG);
        expect(after.player.health).toBe(
            Math.max(1, startHealth - GATHERING_TUNING.eruption.bite),
        );
    });

    it('offerings are affordability-gated by the store wrapper', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ seed: 17, siteId: 'drowned-garden' });
        actions.selectGatheringApproach('glean');
        rigSession(store, { offerings: [{ id: 'coin-toll', paid: false }], wrath: 5, thresholdsFired: [true, false] });

        // Broke: the coin toll is refused.
        const player = (store.getState() as unknown as GameState).player;
        store.setState({ player: { ...player, currency: 0 } } as never);
        expect(actions.payGatheringOffering('coin-toll')).toBe(false);
        expect(session(store).offerings[0].paid).toBe(false);

        // Funded: it pays, eases wrath, and the cost settles at claim.
        const funded = (store.getState() as unknown as GameState).player;
        store.setState({ player: { ...funded, currency: 25 } } as never);
        expect(actions.payGatheringOffering('coin-toll')).toBe(true);
        expect(session(store).wrath).toBe(5 - GATHERING_TUNING.offerings.wrathRelief);

        rigSession(store, { satchel: [piece('s1', 'widow-moss', 'bloom', 1)] });
        actions.withdrawFromGathering();
        actions.acknowledgeGatheringOutcome();
        actions.claimGatheringSpoils();
        const after = store.getState() as unknown as GameState;
        expect(after.player.currency).toBe(25 - GATHERING_TUNING.offerings.shillings);
    });

    it('abandon clears the session without spoils or penalties', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        actions.beginGathering({ seed: 19 });
        actions.selectGatheringApproach('strip');
        actions.abandonGathering();
        expect(store.getState().gathering.session).toBeNull();
        const after = store.getState() as unknown as GameState;
        expect(after.player.health).toBe(before.player.health);
        expect(after.player.inventory.length).toBe(before.player.inventory.length);
    });

    it('the dev seed override pins the session', () => {
        const { store, actions } = makeStoreAndActions();
        globalThis.__AXM_GATHER_SEED__ = 99;
        globalThis.__AXM_GATHER_SITE__ = 'mire-mint';
        actions.beginGathering();
        expect(session(store).seed).toBe(99);
        expect(session(store).siteId).toBe('mire-mint');
    });
});

describe('gathering presenter — view-model composition', () => {
    it('maps a foraging session onto a render-ready VM', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ seed: 7, siteId: 'mire-mint' });
        actions.selectGatheringApproach('glean');
        rigSession(store, { spread: [plot('a', 'kings-rue'), plot('b', 'green-breath')] });

        const vm = selectGatheringViewModel(store.getState());
        expect(vm.active).toBe(true);
        expect(vm.phase).toBe('foraging');
        expect(vm.title).toBe('A STAND OF MIRE-MINT');
        expect(vm.approachLabel).toBe('THE TENDER HAND');
        expect(vm.spread).toHaveLength(2);
        const rue = vm.spread.find((p) => p.plotId === 'kings-rue');
        // glean caps the 3-rich plot at 2.
        expect(rue?.yieldRichness).toBe(GATHERING_TUNING.approaches.glean.richnessCap);
        const breath = vm.spread.find((p) => p.plotId === 'green-breath');
        expect(breath?.isBreath).toBe(true);
        expect(breath?.wrathCost).toBeLessThan(0);
        expect(vm.wrath.max).toBe(GATHER_WRATH_MAX);
        expect(vm.satchelFamilies).toHaveLength(4);
        expect(vm.boons.length).toBe(GATHERING_TUNING.boons.pickCount);
        expect(vm.withdrawEnabled).toBe(true);
    });

    it('surfaces the reprisal flash and the spoils ledger', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginGathering({ seed: 23, siteId: 'mire-mint' });
        actions.selectGatheringApproach('glean');
        rigSession(store, {
            wrath: 3,
            spread: [plot('a', 'widow-moss')],
            reprisalDeck: ['thorns', 'rot', 'mire', 'watcher'],
        });
        actions.harvestGatheringPlot('a');
        let vm = selectGatheringViewModel(store.getState());
        expect(vm.reprisalFlash?.kind).toBe('thorns');
        expect(vm.reprisalFlash?.detail).toContain('VITAE');

        actions.continueGatheringAfterReprisal();
        actions.withdrawFromGathering();
        actions.acknowledgeGatheringOutcome();
        vm = selectGatheringViewModel(store.getState());
        expect(vm.spoils).not.toBeNull();
        expect(vm.spoils?.keptStacks.length).toBeGreaterThan(0);
        expect(vm.spoils?.vitaeNotes.join(' ')).toContain('VITAE');
    });
});
