/**
 * FE-001 — `formatAveragedStat` must never leak a raw float tail into a
 * player-facing stat readout.
 *
 * The walked build printed `LUCK · AVG 7.666666666666667` on the SELF sheet
 * and `🍀 LUCK 27.666666666666668` on the combat pilgrim sheet. Both call
 * sites now route through this formatter, so the guard lives with it.
 */

import { formatAveragedStat } from '../stat-format';

describe('formatAveragedStat', () => {
    it('caps a repeating average at one decimal (the walked regression)', () => {
        expect(formatAveragedStat((5 + 5 + 13) / 3)).toBe('7.7');
        expect(formatAveragedStat((25 + 25 + 33) / 3)).toBe('27.7');
    });

    it('renders a whole average as an integer, with no trailing .0', () => {
        expect(formatAveragedStat(12)).toBe('12');
        expect(formatAveragedStat((3 + 6 + 9) / 3)).toBe('6');
    });

    it('rounds rather than truncates', () => {
        expect(formatAveragedStat(7.65)).toBe('7.7');
        expect(formatAveragedStat(7.64)).toBe('7.6');
    });

    it('never emits a long float tail for any three-stat average', () => {
        for (let a = 1; a <= 30; a += 1) {
            for (let b = 1; b <= 30; b += 3) {
                const out = formatAveragedStat((a + b + (a + b)) / 3);
                expect(out).toMatch(/^-?\d+(\.\d)?$/);
            }
        }
    });

    it('falls back to 0 for non-finite input', () => {
        expect(formatAveragedStat(Number.NaN)).toBe('0');
        expect(formatAveragedStat(Number.POSITIVE_INFINITY)).toBe('0');
    });
});
