/**
 * Hermetic e2e — Phase 60 befriendable-enemy content arc (2026-07-06 roster).
 *
 * Drives a friendship outcome for the Brine Hag end-to-end
 * through `createGameStore`, asserts the per-enemy `friendshipReward`
 * threads through `store.endCombat()` per Phase 60 D5 / D6 / D7:
 *
 *   - items append to `report.loot` (D6)
 *   - xpBonus adds to `report.xpGained` on top of Phase 36 half-XP (D5)
 *   - narrative surfaces on `report.friendshipReward.narrative` (D7)
 *
 * Phase 36 mechanics (half-XP base) are preserved.
 *
 * Combat is now decoupled from the store: `endCombat(outcome)` takes the
 * resolved outcome directly (the Hazard-Pattern engine decides eligibility
 * outside the store), so the reward-threading assertions are driven by
 * calling `endCombat('friendship')` / `endCombat('victory')` directly.
 */

import { describe, it, expect } from 'vitest';
import { FloatEye, BrineHag } from '../../Enemy/enemy.library';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';

describe('Phase 60 — befriendable-enemy content arc', () => {
    it('FloatEye friendship omits report.friendshipReward — enemy has no authored reward', () => {
        // Regression guard for Phase 60 D12: existing consumers that
        // destructure { outcome, xpGained, loot } continue to work; the
        // friendshipReward field is undefined for enemies without authoring.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(FloatEye);

        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        expect(report.friendshipReward).toBeUndefined();
        // Phase 36 base still computes: half-XP only; no xpBonus applied.
        // Base half-XP for FloatEye (level 1, normal: 1 * 20 / 2 = 10).
        expect(report.xpGained).toBe(10);
    });

    it('victory outcome does NOT thread friendshipReward content even when authored', () => {
        // Phase 60 D7 — friendshipReward field surfaces ONLY on
        // outcome === 'friendship'. Defeat / victory / flee paths skip it.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(BrineHag);
        const report = store.getState().endCombat('victory');

        expect(report.outcome).toBe('victory');
        expect(report.friendshipReward).toBeUndefined();
    });
});

describe('Phase 62 — quest-branch wire-in on outcome === friendship', () => {
    it('friendship outcome appends FriendshipReward.flagSet to state.flags (de-duped)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(BrineHag);
        store.getState().endCombat('friendship');
        // First friendship sets the flag.
        expect(store.getState().flags).toContain('befriended-brine-hag');

        // Drive a second friendship encounter (same flag would be a no-op).
        store.getState().startCombat(BrineHag);
        store.getState().endCombat('friendship');
        // De-duped: still exactly one occurrence per Phase 62 D3.
        const matches = store.getState().flags.filter(f => f === 'befriended-brine-hag');
        expect(matches.length).toBe(1);
    });

    it('victory outcome does NOT set the friendship flag (only fires for outcome === friendship)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(BrineHag);
        store.getState().endCombat('victory');
        expect(store.getState().flags).not.toContain('befriended-brine-hag');
    });
});

describe('Phase 102 — Befriendable-enemy Tier-2 expansion', () => {
    it('BrineHag friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(BrineHag);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        // heart-draught was a no-op consumable retired by Tier 0 item 2.
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(7 * 50 * 0.5) + 35); // base half-XP (elite) + 35 bonus
        expect(report.friendshipReward?.narrative).toMatch(/hag lowers her hands/);
        expect(store.getState().flags).toContain('befriended-brine-hag');
    });
});
