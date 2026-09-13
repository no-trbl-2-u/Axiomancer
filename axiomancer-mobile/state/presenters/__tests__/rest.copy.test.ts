/**
 * FE-024 — the REST offer names the VITAE it restores.
 *
 * Audit 2026-09-12: `restOfferDesc` now takes the engine's own preview
 * number (`previewRestChoiceHeal`) instead of re-deriving the heal from the
 * fraction. These cases pin the wording; the arithmetic is pinned in the
 * engine suite and in `rest-offer-heal-cap.audit.test.ts`.
 */

import { REST_CHOICE_OFFER_DESC, restOfferDesc } from '../rest.copy';

describe('restOfferDesc', () => {
    it('appends the restored amount for the walked case', () => {
        expect(restOfferDesc(44)).toBe(`${REST_CHOICE_OFFER_DESC.rest} Restores 44 VITAE.`);
    });

    it('uses the canon VITAE word', () => {
        expect(restOfferDesc(44)).toContain('VITAE');
        expect(restOfferDesc(44)).not.toMatch(/\bHP\b|\bhealth\b/);
    });

    it('prints whatever the engine says, not a hardcoded number', () => {
        expect(restOfferDesc(5)).toContain('Restores 5 VITAE');
        expect(restOfferDesc(160)).toContain('Restores 160 VITAE');
    });

    it('falls back to the bare sentence when there is nothing to promise', () => {
        expect(restOfferDesc(0)).toBe(REST_CHOICE_OFFER_DESC.rest);
        expect(restOfferDesc(-5)).toBe(REST_CHOICE_OFFER_DESC.rest);
        expect(restOfferDesc(Number.NaN)).toBe(REST_CHOICE_OFFER_DESC.rest);
    });
});
