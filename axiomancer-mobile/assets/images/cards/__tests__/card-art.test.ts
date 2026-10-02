import { STARTING_CARD_IDS } from '@mechanics';
import { FALLBACK_CARD_ART, getCardArt } from '../index';

describe('card art registry', () => {
    it('gives every starting card a painting, not the fallback', () => {
        for (const id of new Set(STARTING_CARD_IDS)) {
            expect(getCardArt(id)).not.toBe(FALLBACK_CARD_ART);
        }
    });

    it('falls back for an unmapped id', () => {
        expect(getCardArt('no-such-card')).toBe(FALLBACK_CARD_ART);
    });
});
