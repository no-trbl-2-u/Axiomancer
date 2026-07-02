/**
 * Phase 130 — Constants verification tests
 * 
 * Verifies that Phase 130 constants changes are correctly applied.
 */

import { describe, it, expect } from 'vitest';
import { EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD, EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD, EFFECT_BASE_PROC_INTENSITY } from '../../Game/game-mechanics.constants';
import { AuditSentinel, RimeclawProwler, TheMarketArbiter } from '../../Enemy/enemy.library';

describe('Phase 130 — Constants and config verification', () => {
    describe('Resolution thresholds lowered from Phase 126', () => {
        it('should have lowered debuff intensity threshold from 4 to 3', () => {
            expect(EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD).toBe(3);
        });

        it('should have lowered DoT damage threshold from 3 to 2', () => {
            expect(EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD).toBe(2);
        });
    });

    describe('Base proc intensity increased for STRATEGIST targeting', () => {
        it('should have increased base proc intensity from 1 to 2', () => {
            expect(EFFECT_BASE_PROC_INTENSITY).toBe(2);
        });
    });

    describe('L15-tier enemy befriendability improvements', () => {
        it('AuditSentinel should now be befriendable', () => {
            expect(AuditSentinel.befriendabilityConfig).toBeDefined();
            expect(AuditSentinel.befriendabilityConfig?.hpGate?.belowPct).toBe(0.7); // Phase 138 tuning
            expect(AuditSentinel.befriendabilityConfig?.requiredStances).toContain('mind');
            expect(AuditSentinel.befriendabilityConfig?.roundsThreshold).toBe(1); // Phase 138 tuning
            expect(AuditSentinel.friendshipReward).toBeDefined();
            expect(AuditSentinel.friendshipReward?.flagSet).toBe('befriended-audit-sentinel');
        });

        it('RimeclawProwler should now be befriendable', () => {
            expect(RimeclawProwler.befriendabilityConfig).toBeDefined();
            expect(RimeclawProwler.befriendabilityConfig?.hpGate?.belowPct).toBe(0.35);
            expect(RimeclawProwler.befriendabilityConfig?.requiredStances).toContain('body');
            expect(RimeclawProwler.befriendabilityConfig?.roundsThreshold).toBe(3);
            expect(RimeclawProwler.friendshipReward).toBeDefined();
            expect(RimeclawProwler.friendshipReward?.flagSet).toBe('befriended-rimeclaw-prowler');
        });

        it('TheMarketArbiter should have strengthened befriendability thresholds', () => {
            expect(TheMarketArbiter.befriendabilityConfig).toBeDefined();
            expect(TheMarketArbiter.befriendabilityConfig?.hpGate?.belowPct).toBe(0.3); // lowered from 0.35
            expect(TheMarketArbiter.befriendabilityConfig?.requiredStances).toContain('mind');
            expect(TheMarketArbiter.befriendabilityConfig?.roundsThreshold).toBe(3); // reduced from 4
        });
    });
});