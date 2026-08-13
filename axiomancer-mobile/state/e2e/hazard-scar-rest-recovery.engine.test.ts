/**
 * Hermetic E2E Tests — Hazard max-VITAE scar recovery at inn rest.
 *
 * Pins the Phase 128 contract through the store action layer, re-homed by
 * Phase 52b onto the authored `RestPayload.shelter` marker:
 *  - a `maxhp` hazard scar bakes the loss into maxHealth AND records a
 *    durable `hazard-scar:` flag;
 *  - a rest at an INN (`shelter: 'inn'`) mends the scarred max-VITAE
 *    back toward baseline and clears the scar flags;
 *  - a CAMP watch (`shelter: 'camp'`, and the default when a node is
 *    silent) does NOT mend the scar and leaves the flags intact;
 *  - recovered max-VITAE never exceeds the pre-scar baseline.
 *
 * The old trigger was `baseHealFraction >= 1.0`, which two authored
 * wilderness springs (`nf-4`, `nf-24`) also passed — they mended scars
 * like a paid shelter. The BEHAVIOUR below is unchanged; only its
 * trigger is honest now.
 * Seeded; no timers, no network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState } from '@mechanics';
import { HAZARD_CRACK_CARD } from '@mechanics';
import type { HazardHandEntry, HazardSessionState, RestChoiceSession } from '@mechanics';

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

function restSession(store: AppStore): RestChoiceSession {
    const s = store.getState().rest.session;
    if (!s) throw new Error('expected an active rest session');
    return s;
}

function rigHand(store: AppStore, cards: { uid: string; cardId: string }[]): void {
    const s = hazardSession(store);
    const hand: HazardHandEntry[] = cards.map((c) => ({ ...c, dieId: null }));
    store.setState({ hazard: { session: { ...s, hand, play: [] }, tutorial: false } });
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

/** Commits the free `rest` offer, driving the node straight to its outcome. */
function playRestToDawn(store: AppStore, actions: AppActions): void {
    actions.chooseRestChoiceOffer('rest');
    if (restSession(store).phase !== 'outcome') {
        throw new Error(`unexpected phase ${restSession(store).phase}`);
    }
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

        // Inn rest: the authored paid shelter (fishing-village rest nodes).
        expect(actions.beginRest({ seed: 7, shelter: 'inn' })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();

        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(scar);

        const after = store.getState() as unknown as GameState;
        expect(after.player.maxHealth).toBe(baseline); // restored, never exceeds baseline
        expect((after.flags ?? []).some((f) => f.startsWith(HAZARD_SCAR_FLAG_PREFIX))).toBe(false);
        expect(after.player.health).toBeLessThanOrEqual(after.player.maxHealth);
    });

    it('a camp watch does NOT mend the scar and leaves the flag intact', () => {
        const { store, actions } = makeStoreAndActions();
        const baseline = (store.getState() as unknown as GameState).player.maxHealth;
        const scar = scarThePlayer(store, actions);
        const scarredMax = (store.getState() as unknown as GameState).player.maxHealth;
        expect(scarredMax).toBe(baseline - scar);

        // Camp: every authored wilderness rest node.
        expect(actions.beginRest({ seed: 7, shelter: 'camp' })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();

        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(0);

        const after = store.getState() as unknown as GameState;
        expect(after.player.maxHealth).toBe(scarredMax); // still scarred
        expect(bankedScarMagnitude(after.flags ?? [])).toBe(scar); // flag intact
    });

    it('a rest with NO authored shelter defaults to camp and does NOT mend', () => {
        // Phase 52b — silence is never a paid bed. This is the regression
        // that mattered: `nf-4` / `nf-24` were full-heal wilderness springs
        // and the old `>= 1.0` heuristic mended their scars for free.
        const { store, actions } = makeStoreAndActions();
        const scar = scarThePlayer(store, actions);
        const scarredMax = (store.getState() as unknown as GameState).player.maxHealth;

        expect(actions.beginRest({ seed: 7 })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();

        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(0);

        const after = store.getState() as unknown as GameState;
        expect(after.player.maxHealth).toBe(scarredMax);
        expect(bankedScarMagnitude(after.flags ?? [])).toBe(scar);
    });

    it('a scarless inn rest leaves maxHealth unchanged', () => {
        const { store, actions } = makeStoreAndActions();
        const baseline = (store.getState() as unknown as GameState).player.maxHealth;
        expect(actions.beginRest({ seed: 7, shelter: 'inn' })).toBe(true);
        playRestToDawn(store, actions);
        const result = actions.claimRestOutcome();
        expect(result.applied).toBe(true);
        expect(result.scarMended).toBe(0);
        expect((store.getState() as unknown as GameState).player.maxHealth).toBe(baseline);
    });

    it('the fishing-village inn node routes an inn rest through the live interceptor', () => {
        // End-to-end witness that the AUTHORED marker (not a heal number)
        // is what reaches the claim: fv-3 is an `fvRestPool` node.
        const { store, actions } = makeStoreAndActions();
        const scar = scarThePlayer(store, actions);

        const before = store.getState() as unknown as GameState;
        store.setState({
            world: {
                ...before.world,
                currentMap: {
                    ...before.world.currentMap,
                    continent: 'coastal-continent',
                    name: 'fishing-village',
                    currentNode: 'fv-3',
                },
            },
        } as never);

        expect(actions.resolveCurrentMapEvent()).toBe(true);
        expect(restSession(store).shelter).toBe('inn');

        playRestToDawn(store, actions);
        expect(actions.claimRestOutcome().scarMended).toBe(scar);
    });

    it('a northern-forest spring routes a CAMP rest through the live interceptor', () => {
        // nf-4 (cold spring) was authored at healFraction 1.0 and therefore
        // mended scars under the retired heuristic. It must not any more.
        const { store, actions } = makeStoreAndActions();
        const scar = scarThePlayer(store, actions);
        const scarredMax = (store.getState() as unknown as GameState).player.maxHealth;

        const before = store.getState() as unknown as GameState;
        store.setState({
            world: {
                ...before.world,
                currentMap: {
                    ...before.world.currentMap,
                    continent: 'coastal-continent',
                    name: 'northern-forest',
                    currentNode: 'nf-4',
                },
            },
        } as never);

        expect(actions.resolveCurrentMapEvent()).toBe(true);
        expect(restSession(store).shelter).toBe('camp');

        playRestToDawn(store, actions);
        expect(actions.claimRestOutcome().scarMended).toBe(0);
        expect((store.getState() as unknown as GameState).player.maxHealth).toBe(scarredMax);
        expect(bankedScarMagnitude((store.getState() as unknown as GameState).flags ?? [])).toBe(scar);
    });
});
