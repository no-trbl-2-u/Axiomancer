/**
 * Hermetic E2E — the WS6.1 reward-draft harness (telemetry-only).
 *
 * Asserts the MECHANISM, never balance: the sim runs for every preset origin,
 * its counts add up, and it is deterministic from its seed. The WS6.3 evidence
 * gate (bridge pick rates, per-origin floors) reads the emitted counts in
 * `/deck-tuning` reports — no balance band lives in this file.
 *
 * The sim carries its own local seeded LCG (no global-singleton or
 * `Math.random` use), so no RNG stubbing is required here.
 */

import { describe, it, expect, afterEach } from 'vitest';

import { runRewardDraftSim } from '../combat.reward-draft.sim';
import { COMBAT_DECK_PRESET_ORDER, getDeckPreset } from '../combat.starter-deck-presets';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import { getCardById } from '../../Cards/cards.library';
import { SANDBOX_CARD_SETS } from '../../Cards/cards.sandbox-sets';
import { clearSandboxCards } from '../../Cards/cards.sandbox';

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
        const result = runRewardDraftSim('erosion', 3, SCREENS);
        for (const id of [...Object.keys(result.picks), ...Object.keys(result.offers)]) {
            expect(getCardById(id)).toBeTruthy();
            expect(COMBAT_REWARD_POOL).toContain(id);
        }
        // Every pick was drawn from that screen's offers, so picks ⊆ offers.
        for (const id of Object.keys(result.picks)) {
            expect(result.offers[id]).toBeGreaterThanOrEqual(result.picks[id]);
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
    const BRIDGE_SET = 'bridge-rewards';
    const bridgeIds = SANDBOX_CARD_SETS[BRIDGE_SET]!.cards.map(c => c.id);

    it('a plain library run reports an empty injected pool and never offers sandbox ids', () => {
        const result = runRewardDraftSim('erosion', 1, SCREENS);
        expect(result.extraPoolIds).toEqual([]);
        for (const id of bridgeIds) {
            expect(result.offers[id], `${id} offered without injection`).toBeUndefined();
            expect(COMBAT_REWARD_POOL, `${id} leaked into the pinned pool`).not.toContain(id);
        }
    });

    it('sandboxSetId applies the set, reports its ids, and the counts still add up', () => {
        const result = runRewardDraftSim('erosion', 1, SCREENS, { sandboxSetId: BRIDGE_SET });
        expect(result.extraPoolIds).toEqual(bridgeIds);
        // The set is live in the registry: every id resolves.
        for (const id of bridgeIds) expect(getCardById(id), id).toBeDefined();
        const pickTotal = Object.values(result.picks).reduce((a, b) => a + b, 0);
        const offerTotal = Object.values(result.offers).reduce((a, b) => a + b, 0);
        expect(pickTotal).toBe(SCREENS);
        expect(offerTotal).toBe(SCREENS * 3);
    });

    it('injected cards actually surface: across the 10 origins every bridge id is OFFERED', () => {
        const offered = new Set<string>();
        for (const originId of COMBAT_DECK_PRESET_ORDER) {
            const result = runRewardDraftSim(originId, 11, SCREENS, { sandboxSetId: BRIDGE_SET });
            for (const id of Object.keys(result.offers)) offered.add(id);
        }
        for (const id of bridgeIds) {
            expect(offered.has(id), `${id} never offered across any origin`).toBe(true);
        }
    });

    it('is deterministic with the hook: same (origin, seed, screens, set) → identical counts', () => {
        const a = runRewardDraftSim('grace', 42, SCREENS, { sandboxSetId: BRIDGE_SET });
        const b = runRewardDraftSim('grace', 42, SCREENS, { sandboxSetId: BRIDGE_SET });
        expect(b.picks).toEqual(a.picks);
        expect(b.offers).toEqual(a.offers);
        expect(b.extraPoolIds).toEqual(a.extraPoolIds);
    });

    it('an explicit extraPool id that is NOT registered is dropped by the resolve filter, never offered', () => {
        const result = runRewardDraftSim('erosion', 5, SCREENS, { extraPool: ['no-such-card'] });
        expect(result.extraPoolIds).toEqual(['no-such-card']); // reported for reproducibility …
        expect(result.offers['no-such-card']).toBeUndefined(); // … but never rollable
        expect(Object.values(result.offers).reduce((a, b) => a + b, 0)).toBe(SCREENS * 3);
    });

    it('throws on an unknown sandbox set id (a silently-empty injection would read as a dead bridge)', () => {
        expect(() => runRewardDraftSim('erosion', 1, 10, { sandboxSetId: 'no-such-set' }))
            .toThrow(/unknown sandbox set/);
    });
});
