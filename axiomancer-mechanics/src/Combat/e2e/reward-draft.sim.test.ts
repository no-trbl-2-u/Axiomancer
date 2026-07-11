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

import { describe, it, expect } from 'vitest';

import { runRewardDraftSim } from '../combat.reward-draft.sim';
import { COMBAT_DECK_PRESET_ORDER, getDeckPreset } from '../combat.deck-presets';
import { COMBAT_REWARD_POOL } from '../combat.rewards';
import { getCardById } from '../../Cards/cards.library';

const SCREENS = 200; // WS6.1's N

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
