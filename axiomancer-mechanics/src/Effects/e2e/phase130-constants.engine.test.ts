/**
 * Phase 130 — Constants verification tests
 *
 * Verifies that Phase 130 constants changes are correctly applied. (The
 * befriendability pins on the retired mid-tier foes went with them in the
 * enemy roster reset, R2.)
 */

import { describe, it, expect } from 'vitest';
import { EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD, EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD} from '../../Game/game-mechanics.constants';

describe('Phase 130 — Constants and config verification', () => {
    describe('Resolution thresholds lowered from Phase 126', () => {
        it('should have lowered debuff intensity threshold from 4 to 3', () => {
            expect(EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD).toBe(3);
        });

        it('should have lowered DoT damage threshold from 3 to 2', () => {
            expect(EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD).toBe(2);
        });
    });

});
