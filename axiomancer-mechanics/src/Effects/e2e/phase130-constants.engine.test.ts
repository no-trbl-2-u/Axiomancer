/**
 * Phase 130 — Constants verification tests
 *
 * Verifies that Phase 130 constants changes are correctly applied, plus the
 * befriendability tuning carried forward onto the 2026-07-06 roster's
 * mid-tier befriendables.
 */

import { describe, it, expect } from 'vitest';
import { EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD, EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD} from '../../Game/game-mechanics.constants';
import { TriEyes, LadyGabriella, HasshakuSama } from '../../Enemy/enemy.library';

describe('Phase 130 — Constants and config verification', () => {
    describe('Resolution thresholds lowered from Phase 126', () => {
        it('should have lowered debuff intensity threshold from 4 to 3', () => {
            expect(EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD).toBe(3);
        });

        it('should have lowered DoT damage threshold from 3 to 2', () => {
            expect(EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD).toBe(2);
        });
    });

    describe('L15-tier enemy befriendability (carried onto the art roster)', () => {
        it('Tri-Eyes (Normal anchor) keeps the Phase 138 befriend tuning', () => {
            expect(TriEyes.befriendabilityConfig).toBeDefined();
            expect(TriEyes.befriendabilityConfig?.hpGate?.belowPct).toBe(0.7); // Phase 138 tuning
            expect(TriEyes.befriendabilityConfig?.roundsThreshold).toBe(1); // Phase 138 tuning
            expect(TriEyes.friendshipReward).toBeDefined();
            expect(TriEyes.friendshipReward?.flagSet).toBe('befriended-tri-eyes');
        });

        it('Lady Gabriella is befriendable on the mercy path', () => {
            expect(LadyGabriella.befriendabilityConfig).toBeDefined();
            expect(LadyGabriella.befriendabilityConfig?.hpGate?.belowPct).toBe(0.35);
            expect(LadyGabriella.befriendabilityConfig?.roundsThreshold).toBe(5);
            expect(LadyGabriella.friendshipReward).toBeDefined();
            expect(LadyGabriella.friendshipReward?.flagSet).toBe('befriended-lady-gabriella');
        });

        it('Hasshaku-sama carries mid-band befriendability thresholds', () => {
            expect(HasshakuSama.befriendabilityConfig).toBeDefined();
            expect(HasshakuSama.befriendabilityConfig?.hpGate?.belowPct).toBe(0.4);
            expect(HasshakuSama.befriendabilityConfig?.roundsThreshold).toBe(3);
        });
    });
});
