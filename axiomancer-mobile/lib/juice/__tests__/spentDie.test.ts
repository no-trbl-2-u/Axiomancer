import { describe, expect, it } from '@jest/globals';

import { spentDieTreatment } from '../spentDie';

describe('spentDieTreatment', () => {
    it('greys a dead face at full opacity — the crack/miss/X rim carries the read', () => {
        expect(spentDieTreatment({ drafted: false, spent: false, dead: true }))
            .toEqual({ greyed: true, opacity: 1 });
    });

    it('greys and desaturates a drafted die once spent', () => {
        const t = spentDieTreatment({ drafted: true, spent: true, dead: false });
        expect(t.greyed).toBe(true);
        expect(t.opacity).toBeLessThan(1);
    });

    it('a drafted-but-unspent die reads full color', () => {
        expect(spentDieTreatment({ drafted: true, spent: false, dead: false }))
            .toEqual({ greyed: false, opacity: 1 });
    });

    it('an un-drafted, un-spent, live die reads full color', () => {
        expect(spentDieTreatment({ drafted: false, spent: false, dead: false }))
            .toEqual({ greyed: false, opacity: 1 });
    });

    it('spent without drafted (should not occur, but not dead either) reads full color', () => {
        expect(spentDieTreatment({ drafted: false, spent: true, dead: false }))
            .toEqual({ greyed: false, opacity: 1 });
    });
});
