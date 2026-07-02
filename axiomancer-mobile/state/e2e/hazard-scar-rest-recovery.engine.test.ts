/**
 * Hermetic E2E Tests — Hazard max-VITAE scar recovery at inn rest.
 *
 * Pins the Phase 128 contract through the store action layer:
 *  - a `maxhp` hazard scar bakes the loss into maxHealth AND records a
 *    durable `hazard-scar:` flag;
 *  - an inn-grade rest (`healFraction >= 1.0`) mends the scarred
 *    max-VITAE back toward baseline and clears the scar flags;
 *  - a wilderness field-camp watch (`healFraction: 0.5`) does NOT mend
 *    the scar and leaves the flags intact;
 *  - recovered max-VITAE never exceeds the pre-scar baseline.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from 'axiomancer-mechanics';
import { HAZARD_CRACK_CARD } from 'axiomancer-mechanics';
import type { HazardHandEntry, HazardSessionState, RestSession } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { bankedScarMagnitude, HAZARD_SCAR_FLAG_PREFIX } from '@/state/hazard/store-actions';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_HAZARD_SEED__?: number }).__AXM_HAZARD_SEED__;
    delete (globalThis as { __AXM_HAZARD_ID__?: string }).__AXM_HAZARD_ID__;
    delete (globalThis as { __AXM_REST_SEED__?: number }).__AXM_REST_SEED__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function hazardSession(store: AppStore): HazardSessionState {
    const s = store.getState().hazard.session;
    if (!s) throw new Error('expected an active hazard session');
    return s;
}

function restSession(store: AppStore): RestSession {
    const s = store.getState().rest.session;
    if (!s) throw new Error('expected an active rest session');
    return s;
}

function rigHand(store: AppStore, cards: { uid: string; cardId: string }[]): void {
    const s = hazardSession(store);
    const hand: HazardHandEntry[] = cards.map((c) => ({ ...c, dieId: null }));
    store.setState({ hazard: { session: { ...s, hand, play: [] } } });
}

/** Plays one rigged losing round: stage a single CRACK, resolve, continue. */
function playLosingRound(store: AppStore, actions: AppActions): void {
    rigHand(store, [{ uid: `t${hazardSession(store).round}-0`, cardId: HAZARD_CRACK_CARD.id }]);
    for (const h of hazardSession(store).hand.slice()) actions.stageHazardCard(h.uid);
    actions.resolveHazardRound();
    actions.continueHazardAfterResolve();
}

/** Drives a full failing hazard that scars max-VITAE; returns the applied scar. */
function scarThePlayer(store: AppStore, actions: AppActions): number {
    const maxBefore = (store.getState() as unknown as GameState).player.maxHealth;
    // Phase 130 — the failing crossing's VITAE swing (−20) is lethal at the
    // default 15 VITAE, which would route through out-of-combat death and
    // skip the scar entirely. These tests probe max-VITAE *scarring*, so
    // give the pilgrim enough current VITAE to survive the maiming. Only
    // current health is raised; maxHealth (the scar baseline) is untouched.
    const survivor = (store.getState() as unknown as GameState).player;
    store.setState({ player: { ...survivor, health: survivor.maxHealth + 40 } } as never);
    actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
    actions.selectHazardRoute('risk');
    actions.finishHazardRolling();
    for (let r = 0; r < 3; r++) playLosingRound(store, actions);
    expect(hazardSession(store).outcome?.tier).toBe('failure');
    actions.acknowledgeHazardOutcome();
    const result = actions.claimHazardRewards(null);
    expect(result.applied).toBe(true);
    expect(result.maxVitaeDelta).toBeLessThan(0);
    const maxAfter = (store.getState() as unknown as GameState).player.maxHealth;
    return maxBefore - maxAfter;
}

/** Drives a rest night to dawn under a feed-everything policy. */
function playRestToDawn(store: AppStore, actions: AppActions): void {
    actions.chooseRestPosture('deep');
    for (let i = 0; i < 30; i++) {
        const s = restSession(store);
        if (s.phase === 'outcome') return;
        if (s.phase !== 'watch' || s.pending === null) throw new Error(`unexpected phase ${s.phase}`);
        if (s.pending.result === null) {
            const enabled = s.pending.options.filter((o) => !o.disabledReason);
            const pick = enabled.find((o) => ['feed', 'fade'].includes(o.id)) ?? enabled[0];
            actions.chooseRestOption(pick.id);
        } else {
            actions.continueRestWatch();
        }
    }
    throw new Error('no dawn after 30 steps');
}

describe('hazard scar recovery at inn rest', () => {
    it('a maxhp scar bakes into maxHealth and records a durable scar flag', () => {
        const { store, actions } = makeStoreAndActions();
        const scar = scarThePlayer(store, actions);
        expect(scar).toBeGreaterThan(0);

        const flags = (store.getState() as unknown as GameState).flags ?? [];
        const scarFlags = flags.filter((f) => f.startsWith(HAZARD_SCAR_FLAG_PREFIX));
        expect(scarFlags).toHaveLength(1);
        expect(bankedScarMagnitude(flags)).toBe(scar);
    });

    it('an inn rest mends the scarred max-VITAE back toward baseline and clears the flag', () => {
        const { store, actions } = makeStoreAndActions();
        const baseline = (store.getState() as unknown as GameState).player.maxHealth;
        const scar = scarThePlayer(store, actions);
        const scarredMax = (store.getState() as unknown as GameState).player.maxHealth;
        expect(scarredMax).toBe(baseline - scar);

        // Inn rest: default healFraction is 1.0 (full-recovery shelter).
        expect(actions.beginRest({ seed: 7 })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();

        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(scar);

        const after = store.getState() as unknown as GameState;
        expect(after.player.maxHealth).toBe(baseline); // restored, never exceeds baseline
        expect((after.flags ?? []).some((f) => f.startsWith(HAZARD_SCAR_FLAG_PREFIX))).toBe(false);
        expect(after.player.health).toBeLessThanOrEqual(after.player.maxHealth);
    });

    it('a field-camp watch does NOT mend the scar and leaves the flag intact', () => {
        const { store, actions } = makeStoreAndActions();
        const baseline = (store.getState() as unknown as GameState).player.maxHealth;
        const scar = scarThePlayer(store, actions);
        const scarredMax = (store.getState() as unknown as GameState).player.maxHealth;
        expect(scarredMax).toBe(baseline - scar);

        // Field camp: authored wilderness rests heal only half the bar.
        expect(actions.beginRest({ seed: 7, healFraction: 0.5 })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();

        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(0);

        const after = store.getState() as unknown as GameState;
        expect(after.player.maxHealth).toBe(scarredMax); // still scarred
        expect(bankedScarMagnitude(after.flags ?? [])).toBe(scar); // flag intact
    });

    it('a scarless inn rest leaves maxHealth unchanged', () => {
        const { store, actions } = makeStoreAndActions();
        const baseline = (store.getState() as unknown as GameState).player.maxHealth;
        expect(actions.beginRest({ seed: 7 })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();
        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(0);
        expect((store.getState() as unknown as GameState).player.maxHealth).toBe(baseline);
    });
});
