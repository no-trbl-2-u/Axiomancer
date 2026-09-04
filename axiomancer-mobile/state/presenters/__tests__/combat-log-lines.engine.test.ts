/**
 * Hermetic presenter tests — `selectCombatLogLines` (playtest fix 2026-09-04).
 *
 * The playthrough found three engine ledgers the log never narrated: a foe's
 * bar climbing (RAVENOUS / REGROW / STAGE / THREAT heal) with no line saying
 * why, and the PLEA tally falling twice a round (a THREAT cleanse, then the
 * turn-boundary decay) in silence. This pins that every one of them now has a
 * sentence, that the sentence carries the engine's number, and that the
 * decay line quotes the engine's own constant rather than a copied literal.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import { SWAY_DECAY_PER_TURN, type CombatEvent } from '@mechanics';

import { selectCombatLogLines } from '@/state/presenters/combat-encounter.engine';

describe('selectCombatLogLines — enemy healing is narrated with its source', () => {
    type HealSource = Extract<CombatEvent, { kind: 'enemy-healed' }>['source'];
    const cases: [HealSource, string][] = [
        ['RAVENOUS', 'RAVENOUS'],
        ['REGROW', 'REGROW'],
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

describe('selectCombatLogLines — PLEA losses are narrated', () => {
    it('a THREAT cleanse prints the amount shed and floats it over the foe', () => {
        const events: CombatEvent[] = [{ kind: 'threat-sway-cleansed', phaseIndex: 2, amount: 3 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('threat-sway-cleansed');
        expect(line.text).toContain('PLEA −3');
        expect(line.float).toBe('PLEA −3');
    });

    it('the turn-boundary decay is log-only and quotes the engine constant + the remainder', () => {
        const events: CombatEvent[] = [{ kind: 'sway-decayed', total: 6 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('sway-decayed');
        expect(line.text).toContain(`PLEA −${SWAY_DECAY_PER_TURN}`);
        expect(line.text).toContain('6 holds');
        expect(line.float).toBeNull();
    });
});

describe('selectCombatLogLines — HIDE now reaches the log through the keyword receipt', () => {
    it('a HIDE receipt reads as the keyword answering for the soaked amount', () => {
        const events: CombatEvent[] = [{ kind: 'enemy-keyword-fired', enemyId: 'e', keyword: 'HIDE', amount: 4 }];
        const [line] = selectCombatLogLines(events);
        expect(line.text).toMatch(/^HIDE answers for 4\./);
        expect(line.float).toBe('HIDE for 4');
    });
});
