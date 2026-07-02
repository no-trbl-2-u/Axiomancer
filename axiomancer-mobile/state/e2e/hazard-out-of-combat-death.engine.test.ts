/**
 * Hermetic E2E Tests — Hazard out-of-combat death (Phase 130).
 *
 * Pins the lethality contract through the store action layer:
 *  - a Hazard crossing whose net VITAE swing would drop the player to
 *    `health <= 0` (engine `isDefeated` threshold) is FATAL: it routes
 *    through the engine `resetRun({ keepCharacter: true })` primitive,
 *    stamps a durable `hazard-death:` tombstone flag, clears the
 *    session, and returns `died: true` with zeroed deltas;
 *  - the killing crossing FORFEITS its spoils (no shillings banked);
 *  - the character survives the reset (level kept) — only the run resets;
 *  - a survivable failing crossing still floors VITAE at 1, reports
 *    `died: false`, applies its (negative) delta, and stamps NO tombstone.
 *
 * Seeded `cracked-cliff` / risk route: a clean failure nets a −20 VITAE
 * swing (minhp −8 + penaltyVitae −12), which kills at the default 15
 * VITAE and merely maims at 40. No timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from 'axiomancer-mechanics';
import { HAZARD_CRACK_CARD } from 'axiomancer-mechanics';
import type { HazardHandEntry, HazardSessionState } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { HAZARD_DEATH_FLAG_PREFIX, hazardDeathCount } from '@/state/hazard/store-actions';
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

function hazardSession(store: AppStore): HazardSessionState {
    const s = store.getState().hazard.session;
    if (!s) throw new Error('expected an active hazard session');
    return s;
}

function gameState(store: AppStore): GameState {
    return store.getState() as unknown as GameState;
}

function setHealth(store: AppStore, health: number, maxHealth: number): void {
    const p = gameState(store).player;
    store.setState({ player: { ...p, health, maxHealth } } as never);
}

/** Plays one rigged losing round: stage a single CRACK, resolve, continue. */
function playLosingRound(store: AppStore, actions: AppActions): void {
    const s = hazardSession(store);
    const hand: HazardHandEntry[] = [{ uid: `t${s.round}-0`, cardId: HAZARD_CRACK_CARD.id, dieId: null }];
    store.setState({ hazard: { session: { ...s, hand, play: [] } } });
    for (const h of hazardSession(store).hand.slice()) actions.stageHazardCard(h.uid);
    actions.resolveHazardRound();
    actions.continueHazardAfterResolve();
}

/** Drives a full failing `cracked-cliff` / risk crossing up to the claim. */
function driveFailingCrossing(store: AppStore, actions: AppActions): void {
    actions.beginHazard({ seed: 9, hazardId: 'cracked-cliff' });
    actions.selectHazardRoute('risk');
    actions.finishHazardRolling();
    for (let r = 0; r < 3; r++) playLosingRound(store, actions);
    expect(hazardSession(store).outcome?.tier).toBe('failure');
    actions.acknowledgeHazardOutcome();
}

describe('hazard out-of-combat death', () => {
    it('a lethal crossing resets the run, stamps a tombstone, and forfeits spoils', () => {
        const { store, actions } = makeStoreAndActions();
        const levelBefore = gameState(store).player.level;
        const shillingsBefore = gameState(store).player.currency;
        // Wound the player low so the failing crossing's −20 swing crosses the
        // isDefeated threshold (the fresh-game default is now 75 VITAE).
        setHealth(store, 15, gameState(store).player.maxHealth);

        driveFailingCrossing(store, actions);
        const result = actions.claimHazardRewards(null);

        expect(result.applied).toBe(true);
        expect(result.died).toBe(true);
        // Death yields no reward: every delta zeroed.
        expect(result.vitaeDelta).toBe(0);
        expect(result.maxVitaeDelta).toBe(0);
        expect(result.shillings).toBe(0);
        expect(result.cardAdded).toBeNull();

        const after = gameState(store);
        // Run reset: session cleared, a tombstone recorded.
        expect(store.getState().hazard.session).toBeNull();
        expect(hazardDeathCount(after.flags ?? [])).toBe(1);
        expect((after.flags ?? []).some((f) => f.startsWith(HAZARD_DEATH_FLAG_PREFIX))).toBe(true);
        // Character survives the reset (keepCharacter): level kept, VITAE
        // restored by the fresh run rather than left at/below zero.
        expect(after.player.level).toBe(levelBefore);
        expect(after.player.health).toBeGreaterThan(0);
        // Spoils forfeit: no shillings banked on the killing crossing.
        expect(after.player.currency).toBe(shillingsBefore);
    });

    it('a survivable crossing still floors VITAE and stamps no tombstone', () => {
        const { store, actions } = makeStoreAndActions();
        // 40 VITAE absorbs the −20 swing — maimed, not killed.
        setHealth(store, 40, 40);

        driveFailingCrossing(store, actions);
        const result = actions.claimHazardRewards(null);

        expect(result.applied).toBe(true);
        expect(result.died).toBe(false);
        expect(result.vitaeDelta).toBeLessThan(0);

        const after = gameState(store);
        expect(after.player.health).toBeGreaterThan(0);
        expect(after.player.health).toBeLessThan(40);
        expect(hazardDeathCount(after.flags ?? [])).toBe(0);
        expect((after.flags ?? []).some((f) => f.startsWith(HAZARD_DEATH_FLAG_PREFIX))).toBe(false);
    });

    it('an exactly-lethal swing to zero VITAE is fatal (isDefeated boundary)', () => {
        const { store, actions } = makeStoreAndActions();
        // 20 VITAE − a 20 swing lands on exactly 0 → isDefeated → death.
        setHealth(store, 20, 20);

        driveFailingCrossing(store, actions);
        const result = actions.claimHazardRewards(null);

        expect(result.died).toBe(true);
        expect(hazardDeathCount(gameState(store).flags ?? [])).toBe(1);
    });

    it('a crossing landing on 1 VITAE survives (maim, not death)', () => {
        const { store, actions } = makeStoreAndActions();
        // 21 VITAE − a 20 swing lands on 1 → above the isDefeated floor.
        setHealth(store, 21, 21);

        driveFailingCrossing(store, actions);
        const result = actions.claimHazardRewards(null);

        expect(result.died).toBe(false);
        expect(gameState(store).player.health).toBe(1);
        expect(hazardDeathCount(gameState(store).flags ?? [])).toBe(0);
    });
});
