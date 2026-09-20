/**
 * Hermetic test pin — Phase 104 (the grey office): the mobile palette's
 * colourless 'any' aspect.
 *
 * `STANCE_COLORS.any` must be a real AXM token (never a hex literal — the
 * house rule the rest of this palette is grandfathered out of, since those
 * rows are the fixed owner-specified dice identity; 'any' is new and has no
 * such exemption), distinct from every real stance colour, and
 * `dieCanPowerCardVM` must treat a grey card as powerable by every die
 * colour (mirroring THE COLOUR LAW's engine-side exception).
 */

import { describe, expect, it } from '@jest/globals';

import { STANCE_COLORS, dieCanPowerCardVM } from '@/state/presenters/combat-encounter.engine';
import { AXM } from '@/theme/axm';

describe('Phase 104 — the grey office: mobile palette', () => {
    it('STANCE_COLORS.any is the neutral ink token, distinct from every real stance', () => {
        expect(STANCE_COLORS.any).toBe(AXM.bone);
        const named = ['heart', 'body', 'mind', 'wild', 'x'] as const;
        for (const key of named) {
            expect(STANCE_COLORS.any).not.toBe(STANCE_COLORS[key]);
        }
    });

    it('dieCanPowerCardVM: every non-X, non-miss die powers a grey card', () => {
        const colors = ['heart', 'body', 'mind', 'wild'] as const;
        for (const color of colors) {
            expect(dieCanPowerCardVM({ color }, 'any')).toBe(true);
        }
        expect(dieCanPowerCardVM({ color: 'x', isX: true }, 'any')).toBe(false);
        expect(dieCanPowerCardVM({ color: 'body', face: 'miss' }, 'any')).toBe(false);
    });
});
