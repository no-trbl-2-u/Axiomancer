/**
 * Hermetic E2E — the WS6.1 reward-draft harness (telemetry-only).
 *
 * Asserts the MECHANISM, never balance: the sim runs for every preset origin,
 * its counts add up, and it is deterministic from its seed. The WS6.3 evidence
 * gate (bridge pick rates, per-origin floors) reads the emitted counts in
 * `/deck-tuning` reports — no balance band lives in this file.
 *
 * PROFANE-CANON RESET (2026-08-08): the origins are the three campaign
 * presets (threadbare/pilgrim/apostate) and the shipped sandbox-set registry
 * is EMPTY (the spec-32 'bridge-rewards' set retired with the old library).
 * The WS6.2 injection hook is still live code, so it is exercised through a
 * test-local FIXTURE set registered into the same registry the CLI reads —
 * the code path under test is unchanged.
 *
 * The sim carries its own local seeded LCG (no global-singleton or
 * `Math.random` use), so no RNG stubbing is required here.
 */

import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';

import { runRewardDraftSim } from '../combat.reward-draft.sim';
import { COMBAT_DECK_PRESET_ORDER, getDeckPreset } from '../combat.starter-deck-presets';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import { getCardById } from '../../Cards/cards.library';
import { SANDBOX_CARD_SETS } from '../../Cards/cards.sandbox-sets';
import { clearSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';

const SCREENS = 200; // WS6.1's N

afterEach(() => { clearSandboxCards(); });

describe('WS6.1 — reward-draft harness (telemetry only)', () => {
    it('runs for every preset origin and reports the origin it simulated', () => {
        for (const originId of COMBAT_DECK_PRESET_ORDER) {
            const result = runRewardDraftSim(originId, 1, SCREENS);
            expect(result.originId).toBe(originId);
            expect(result.screens).toBe(SCREENS);
            expect(result.seed).toBe(1);
            expect(result.focus).toBe(getDeckPreset(originId)!.focus);
            expect(['heart', 'body', 'mind']).toContain(result.archetype);
        }
    });

    it('pick counts sum to the screen count; offer counts to screens × 3', () => {
        for (const originId of COMBAT_DECK_PRESET_ORDER) {
            const result = runRewardDraftSim(originId, 7, SCREENS);
            const pickTotal = Object.values(result.picks).reduce((a, b) => a + b, 0);
            const offerTotal = Object.values(result.offers).reduce((a, b) => a + b, 0);
            expect(pickTotal).toBe(SCREENS);
            expect(offerTotal).toBe(SCREENS * 3);
        }
    });

    it('every counted card id resolves and belongs to the reward pool', () => {
        const result = runRewardDraftSim('threadbare', 3, SCREENS);
        for (const id of [...Object.keys(result.picks), ...Object.keys(result.offers)]) {
            expect(getCardById(id)).toBeTruthy();
            expect(COMBAT_REWARD_POOL).toContain(id);
        }
        // Every pick was drawn from that screen's offers, so picks ⊆ offers.
        for (const id of Object.keys(result.picks)) {
            expect(result.offers[id]).toBeGreaterThanOrEqual(result.picks[id]);
        }
    });

    it('the reward pool never stocks a curse (enemy-injected junk stays out of the shop)', () => {
        for (const id of COMBAT_REWARD_POOL) {
            expect(getCardById(id)?.theme, `curse card '${id}' in the reward pool`).not.toBe('curse');
        }
    });

    it('is deterministic: the same (origin, seed, screens) yields identical counts', () => {
        for (const originId of COMBAT_DECK_PRESET_ORDER) {
            const a = runRewardDraftSim(originId, 42, SCREENS);
            const b = runRewardDraftSim(originId, 42, SCREENS);
            expect(b.picks).toEqual(a.picks);
            expect(b.offers).toEqual(a.offers);
        }
    });

    it('throws on an unknown preset origin (a silent empty result would read as a finding)', () => {
        expect(() => runRewardDraftSim('no-such-origin', 1, 10)).toThrow(/unknown preset origin/);
    });
});

describe('WS6.2 — the sandbox-injection hook (extra cards at the reward screen)', () => {
    // A fixture set standing in for the retired 'bridge-rewards' set: two
    // synthetic canon-schema cards (no raw HP damage — the strike is dead).
    const FIXTURE_SET = 'e2e-fixture-bridge';
    const fixtureCards: readonly Card[] = [
        {
            id: 'e2e-fixture-tincture',
            name: 'Fixture Tincture',
            philosophicalAspect: 'body',
            description: 'A synthetic reward-screen candidate (WS6.2 hook fixture).',
            tier: 1, rank: 1, cardType: 'spell',
            targetType: 'enemy',
            paidSummary: 'Inflict POISON 1 (2 turns).',
            combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
            tags: ['e2e-fixture'],
        },
        {
            id: 'e2e-fixture-lantern',
            name: 'Fixture Lantern',
            philosophicalAspect: 'mind',
            description: 'A synthetic reward-screen candidate (WS6.2 hook fixture).',
            tier: 1, rank: 3, cardType: 'spell',
            targetType: 'self',
            paidSummary: 'Gain SWAY 1 (3 turns).',
            combatEffects: [{ effectId: 'buff_sway', appliedTo: 'self', intensity: 1, duration: 3 }],
            tags: ['e2e-fixture'],
        },
    ];
    const bridgeIds = fixtureCards.map(c => c.id);

    beforeAll(() => {
        SANDBOX_CARD_SETS[FIXTURE_SET] = {
            id: FIXTURE_SET,
            name: 'E2E fixture bridge',
            description: 'Synthetic candidates exercising the WS6.2 injection hook.',
            cards: fixtureCards,
        };
    });
    afterAll(() => { delete SANDBOX_CARD_SETS[FIXTURE_SET]; });

    it('a plain library run reports an empty injected pool and never offers sandbox ids', () => {
        const result = runRewardDraftSim('threadbare', 1, SCREENS);
        expect(result.extraPoolIds).toEqual([]);
        for (const id of bridgeIds) {
            expect(result.offers[id], `${id} offered without injection`).toBeUndefined();
            expect(COMBAT_REWARD_POOL, `${id} leaked into the pinned pool`).not.toContain(id);
        }
    });

    it('sandboxSetId applies the set, reports its ids, and the counts still add up', () => {
        const result = runRewardDraftSim('threadbare', 1, SCREENS, { sandboxSetId: FIXTURE_SET });
        expect(result.extraPoolIds).toEqual(bridgeIds);
        // The set is live in the registry: every id resolves.
        for (const id of bridgeIds) expect(getCardById(id), id).toBeDefined();
        const pickTotal = Object.values(result.picks).reduce((a, b) => a + b, 0);
        const offerTotal = Object.values(result.offers).reduce((a, b) => a + b, 0);
        expect(pickTotal).toBe(SCREENS);
        expect(offerTotal).toBe(SCREENS * 3);
    });

    it('injected cards actually surface: across the 3 origins every bridge id is OFFERED', () => {
        const offered = new Set<string>();
        for (const originId of COMBAT_DECK_PRESET_ORDER) {
            const result = runRewardDraftSim(originId, 11, SCREENS, { sandboxSetId: FIXTURE_SET });
            for (const id of Object.keys(result.offers)) offered.add(id);
        }
        for (const id of bridgeIds) {
            expect(offered.has(id), `${id} never offered across any origin`).toBe(true);
        }
    });

    it('is deterministic with the hook: same (origin, seed, screens, set) → identical counts', () => {
        const a = runRewardDraftSim('pilgrim', 42, SCREENS, { sandboxSetId: FIXTURE_SET });
        const b = runRewardDraftSim('pilgrim', 42, SCREENS, { sandboxSetId: FIXTURE_SET });
        expect(b.picks).toEqual(a.picks);
        expect(b.offers).toEqual(a.offers);
        expect(b.extraPoolIds).toEqual(a.extraPoolIds);
    });

    it('an explicit extraPool id that is NOT registered is dropped by the resolve filter, never offered', () => {
        const result = runRewardDraftSim('threadbare', 5, SCREENS, { extraPool: ['no-such-card'] });
        expect(result.extraPoolIds).toEqual(['no-such-card']); // reported for reproducibility …
        expect(result.offers['no-such-card']).toBeUndefined(); // … but never rollable
        expect(Object.values(result.offers).reduce((a, b) => a + b, 0)).toBe(SCREENS * 3);
    });

    it('throws on an unknown sandbox set id (a silently-empty injection would read as a dead bridge)', () => {
        expect(() => runRewardDraftSim('threadbare', 1, 10, { sandboxSetId: 'no-such-set' }))
            .toThrow(/unknown sandbox set/);
    });
});
