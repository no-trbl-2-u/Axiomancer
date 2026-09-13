/**
 * MECHANIC-TEXT COVERAGE — `mechanicText`'s `switch (m.kind)` carries a
 * `default: return null` arm (see `combat.cards.ts`). That arm is correct for
 * a genuinely blank clause, but it is also how a `CardSpecialMechanic` kind
 * that never got a display case fails SILENTLY: `paidText` just drops the
 * clause, and any card that leans on the generator instead of an authored
 * `paidSummary` prints a PAID line missing part of what it does.
 *
 * `/adjust-keywords` pass 8 found exactly this gap for `conjure_card` — it
 * had no case at all (not even the plain-English fallback every other
 * de-badged kind gets), masked only by grave-goods' own authored
 * `paidSummary`. `scripts/export-catalog.ts`'s `specialMechanicLabel` has NO
 * such mask (no `paidSummary` fallback there) and was leaking the raw
 * `conjure_card` id straight into the built catalog.
 *
 * Guard (whole live roster, no RNG, hermetic): every `CardSpecialMechanic`
 * kind actually carried by a card in `cardLibrary` produces non-null text
 * from `mechanicText`, so a future kind that skips its display case fails a
 * test instead of shipping silent.
 */

import { describe, expect, it } from 'vitest';
import { cardLibrary } from '../../Cards/cards.library';
import { mechanicText } from '../combat.cards';

describe('mechanicText covers every live CardSpecialMechanic kind', () => {
    it('every specialMechanics entry on every card renders non-null text', () => {
        const offenders: string[] = [];
        for (const card of cardLibrary) {
            for (const m of card.specialMechanics ?? []) {
                if (mechanicText(m) === null) {
                    offenders.push(`${card.id} → kind '${m.kind}' renders null (silent default: arm)`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    it('the roster actually carries at least one specialMechanics entry (the guard has teeth)', () => {
        const total = cardLibrary.reduce((n, c) => n + (c.specialMechanics?.length ?? 0), 0);
        expect(total).toBeGreaterThan(0);
    });

    it('conjure_card renders the conjured card\'s real name, not its raw id', () => {
        const carrier = cardLibrary.find(c => (c.specialMechanics ?? []).some(m => m.kind === 'conjure_card'));
        expect(carrier).toBeDefined();
        const mech = carrier!.specialMechanics!.find(m => m.kind === 'conjure_card')!;
        const text = mechanicText(mech);
        expect(text).not.toBeNull();
        expect(text).not.toContain('conjure_card');
        expect(text).toContain('Cinder');
    });
});
