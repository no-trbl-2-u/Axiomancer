import { describe, expect, it } from '@jest/globals';

import { spentDieTreatment } from '../spentDie';

describe('spentDieTreatment', () => {
    it('greys a dead face at full opacity — the crack/miss/X rim carries the read', () => {
        expect(spentDieTreatment({ spent: false, dead: true }))
            .toEqual({ greyed: true, opacity: 1 });
    });

    it('greys and desaturates a spent die', () => {
        const t = spentDieTreatment({ spent: true, dead: false });
        expect(t.greyed).toBe(true);
        expect(t.opacity).toBeLessThan(1);
    });

    it('a live, unspent die reads full color', () => {
        expect(spentDieTreatment({ spent: false, dead: false }))
            .toEqual({ greyed: false, opacity: 1 });
    });

    it('THE FLIP model — a used tray die is spent but never drafted: it must still grey', () => {
        // Under Upgradeable Dice a card is powered by a tray die directly (no
        // draft step), so a used die is `spent` with no `drafted` flag. This is
        // the normal case the old `drafted && spent` gate wrongly excluded.
        expect(spentDieTreatment({ spent: true, dead: false }))
            .toEqual({ greyed: true, opacity: 0.55 });
    });
});
