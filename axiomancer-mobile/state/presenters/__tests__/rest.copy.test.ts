/**
 * FE-024 — the REST offer must name the VITAE it restores.
 *
 * The walked screen showed 'REST / FREE / SLEEP WHERE YOU STAND. FREE.' beside
 * a bar reading 'VITAE 20/175': three statements of the price and none of the
 * payoff, so the only number a hurt player is deciding on was withheld until
 * after the choice was committed.
 *
 * The heal fraction stays in the engine (`RESTCHOICE_TUNING.restHealFraction`,
 * a flat fraction of MAX vitae). This helper reads it; it does not restate it.
 */

import { RESTCHOICE_TUNING } from '@mechanics';

import { REST_CHOICE_OFFER_DESC, restOfferDesc } from '../rest.copy';

describe('restOfferDesc', () => {
    const fraction = RESTCHOICE_TUNING.restHealFraction;

    it('appends the restored amount for the walked case', () => {
        // 175 max at the engine's own fraction.
        const expected = Math.round(175 * fraction);
        expect(restOfferDesc(175, fraction)).toBe(
            `${REST_CHOICE_OFFER_DESC.rest} Restores ${expected} VITAE.`,
        );
    });

    it('uses the canon VITAE word', () => {
        expect(restOfferDesc(175, fraction)).toContain('VITAE');
        expect(restOfferDesc(175, fraction)).not.toMatch(/\bHP\b|\bhealth\b/);
    });

    it('scales with the pilgrim rather than hardcoding a number', () => {
        const small = restOfferDesc(100, fraction);
        const large = restOfferDesc(640, fraction);
        expect(small).not.toBe(large);
        expect(large).toContain(String(Math.round(640 * fraction)));
    });

    it('falls back to the bare sentence when the maximum is unknown', () => {
        expect(restOfferDesc(0, fraction)).toBe(REST_CHOICE_OFFER_DESC.rest);
        expect(restOfferDesc(-5, fraction)).toBe(REST_CHOICE_OFFER_DESC.rest);
        expect(restOfferDesc(Number.NaN, fraction)).toBe(REST_CHOICE_OFFER_DESC.rest);
    });

    it('falls back rather than promising a zero heal', () => {
        expect(restOfferDesc(1, 0)).toBe(REST_CHOICE_OFFER_DESC.rest);
    });
});
