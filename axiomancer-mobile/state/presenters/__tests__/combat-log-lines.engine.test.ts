/**
 * Hermetic presenter tests — `selectCombatLogLines` (playtest fix 2026-09-04).
 *
 * The playthrough found engine ledgers the log never narrated: a foe's bar
 * climbing (a STAGE or THREAT heal) with no line saying why, and the PLEA
 * tally decaying at the turn boundary in silence. This pins that every one of
 * them now has a sentence, that the sentence carries the engine's number, and
 * that the decay line quotes the engine's own constant rather than a copied
 * literal.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import { SWAY_DECAY_PER_TURN, type CombatEvent } from '@mechanics';

import { selectCombatLogLines } from '@/state/presenters/combat-encounter.engine';

describe('selectCombatLogLines — enemy healing is narrated with its source', () => {
    type HealSource = Extract<CombatEvent, { kind: 'enemy-healed' }>['source'];
    const cases: [HealSource, string][] = [
        ['STAGE', 'STAGE'],
        ['THREAT', 'threat'],
    ];
    it.each(cases)('%s heal names its cause and the amount', (source, word) => {
        const events: CombatEvent[] = [{ kind: 'enemy-healed', enemyId: 'e', source, amount: 13 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('enemy-healed');
        expect(line.side).toBe('enemy');
        expect(line.text).toContain(word);
        expect(line.text).toContain('VITAE +13');
        expect(line.float).toBe('+13');
    });
});

describe('selectCombatLogLines — PLEA decay is narrated', () => {
    it('the turn-boundary decay is log-only and quotes the engine constant + the remainder', () => {
        const events: CombatEvent[] = [{ kind: 'sway-decayed', total: 6 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('sway-decayed');
        expect(line.text).toContain(`PLEA −${SWAY_DECAY_PER_TURN}`);
        expect(line.text).toContain('6 holds');
        expect(line.float).toBeNull();
    });
});

/**
 * Burn-day audit 3.4 — a refused action is narrated, not swallowed. It used to
 * fall to `default:` and vanish from the log and the history together.
 */
describe('selectCombatLogLines — a refused action is narrated (audit 3.4)', () => {
    it('a refused action reaches the log in the engine’s own words, and does not shout', () => {
        const message = 'need 2 ◆ Conviction (have 0)';
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: 'a1', effectId: '', message }];
        const [line] = selectCombatLogLines(events);
        expect(line).toBeDefined();
        expect(line.side).toBe('player');
        // VERBATIM on purpose: the presenter must not re-word or re-case the
        // engine's player-facing message, or the two vocabularies drift.
        expect(line.text).toContain(message);
        // `effect-fizzled` fires from two dozen sites (empty discard, no glyph
        // to charge, an unaffordable signature). A float here would carpet the
        // board with toasts on every mis-tap. The log is the ledger; the float
        // is the shout.
        expect(line.float).toBeNull();
    });
});
