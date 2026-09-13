/**
 * Audit 2026-09-12 — the REST offer's promise equals the commit's payoff.
 *
 * FE-024's first cut computed `round(max × fraction)` in the presenter and
 * skipped the engine's missing-VITAE cap, so a pilgrim at 170/175 read
 * "Restores 44 VITAE" and then healed 5. The presenter now words the
 * engine's `previewRestChoiceHeal`, which shares its arithmetic with
 * `chooseRestChoiceOffer`.
 */

import {
    chooseRestChoiceOffer,
    createRestChoiceSession,
    RESTCHOICE_TUNING,
} from '@mechanics';
import type { RestChoiceSession } from '@mechanics';

import { REST_CHOICE_OFFER_DESC } from '../rest.copy';
import { selectRestVM } from '../rest.engine';

const DECK = Array.from({ length: 13 }, (_, i) => `card-${i}`);

function session(health: number, maxHealth: number): RestChoiceSession {
    return createRestChoiceSession(1, {
        shelter: 'camp',
        maxHealth,
        health,
        currency: 9999,
        deckCardIds: DECK,
    });
}

function restDesc(s: RestChoiceSession): string {
    const vm = selectRestVM({ rest: { session: s } });
    const rest = vm.offers.find((o) => o.id === 'rest');
    if (!rest) throw new Error('no rest offer');
    return rest.desc;
}

describe('REST offer copy pays what the engine pays (audit 2026-09-12)', () => {
    it('promises the full fraction to a hurt pilgrim', () => {
        const expected = Math.round(175 * RESTCHOICE_TUNING.restHealFraction);
        expect(restDesc(session(20, 175))).toBe(
            `${REST_CHOICE_OFFER_DESC.rest} Restores ${expected} VITAE.`,
        );
    });

    it('promises only the missing VITAE near full — the walked 170/175 case', () => {
        const s = session(170, 175);
        expect(restDesc(s)).toBe(`${REST_CHOICE_OFFER_DESC.rest} Restores 5 VITAE.`);
        // And the commit pays exactly that.
        expect(chooseRestChoiceOffer(s, 'rest').outcome?.healed).toBe(5);
    });

    it('promises nothing at full VITAE', () => {
        expect(restDesc(session(175, 175))).toBe(REST_CHOICE_OFFER_DESC.rest);
    });
});
