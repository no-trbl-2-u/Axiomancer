/**
 * Hermetic presenter tests — `selectCombatLogLines`.
 *
 * Engine ledgers such as a foe's bar climbing (a STAGE or THREAT heal) must
 * each be narrated. This pins that every one of them has a sentence and that the sentence carries the
 * engine's number.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import type { CombatEvent } from '@mechanics';

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

/**
 * A refused action is narrated, not swallowed: it must not fall to `default:`
 * and vanish from the log and the history together.
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
