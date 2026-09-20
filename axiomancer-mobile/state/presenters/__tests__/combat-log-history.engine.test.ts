/**
 * Hermetic presenter tests — `selectCombatLogHistory` (playtest fix
 * 2026-09-04).
 *
 * The playtest found combat has no persistent log: every beat is a floating
 * token that vanishes in ~1s, so the player cannot reconstruct what just
 * happened. This pins the history selector: it walks the full `state.log`
 * event stream, narrates the raw beats `selectCombatLogLines` deliberately
 * omits (damage, DoT ticks, card plays, threats, stance checks, turn
 * dividers), and still carries every line that function already produces.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import type { CombatEncounterState, CombatEvent } from '@mechanics';

import { selectCombatLogHistory } from '@/state/presenters/combat-encounter.engine';

/** `selectCombatLogHistory` only reads `state.log` — a bare literal cast
 *  keeps these hermetic, matching `combat-log-lines.engine.test.ts`'s own
 *  bare-array-of-events convention one level up. */
function stateWith(events: CombatEvent[]): CombatEncounterState {
    return { log: events } as unknown as CombatEncounterState;
}

describe('selectCombatLogHistory — damage-dealt is narrated on both sides', () => {
    it('damage dealt TO the enemy reads as "You deal N" and carries the card name', () => {
        const events: CombatEvent[] = [{ kind: 'damage-dealt', cardId: 'spoiled-poultice', target: 'enemy', amount: 9 }];
        const history = selectCombatLogHistory(stateWith(events));
        expect(history).toHaveLength(1);
        expect(history[0].side).toBe('enemy');
        expect(history[0].text).toContain('You deal 9');
        expect(history[0].text).toContain('Spoiled Poultice');
    });

    it('damage dealt TO the player reads as "It deals N to you"', () => {
        const events: CombatEvent[] = [{ kind: 'damage-dealt', cardId: 'spoiled-poultice', target: 'self', amount: 4 }];
        const history = selectCombatLogHistory(stateWith(events));
        expect(history).toHaveLength(1);
        expect(history[0].side).toBe('player');
        expect(history[0].text).toContain('It deals 4 to you');
    });
});

describe('selectCombatLogHistory — dot-tick', () => {
    it('a DoT tick names the affliction, the amount, and whose side it hit', () => {
        const events: CombatEvent[] = [{ kind: 'dot-tick', effectId: 'debuff_poison', label: 'POISON', amount: 3, target: 'enemy' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.side).toBe('enemy');
        expect(line.text).toContain('POISON');
        expect(line.text).toContain('3');
    });
});

describe('selectCombatLogHistory — card-played: FREE vs die-powered', () => {
    it('dieId === null reads as FREE', () => {
        const events: CombatEvent[] = [{ kind: 'card-played', cardId: 'spoiled-poultice', useBottom: false, dieId: null, advantage: 'neutral' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toContain('Spoiled Poultice');
        expect(line.text).toContain('FREE');
        expect(line.text).not.toContain('die-powered');
    });

    it('a real dieId reads as die-powered', () => {
        const events: CombatEvent[] = [{ kind: 'card-played', cardId: 'spoiled-poultice', useBottom: true, dieId: 'die-0', advantage: 'advantage' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toContain('die-powered');
    });
});

describe('selectCombatLogHistory — stance-check-resolved wording matches the open telegraph', () => {
    it('punished quotes the ×1.5 multiplier', () => {
        const events: CombatEvent[] = [{ kind: 'stance-check-resolved', phaseIndex: 0, outcome: 'punished', stance: 'body' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toBe('Punished ×1.5');
    });

    it('yielded quotes the ×0.5 multiplier plus the Conviction gain', () => {
        const events: CombatEvent[] = [{ kind: 'stance-check-resolved', phaseIndex: 0, outcome: 'yielded', stance: 'mind' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toBe('Yielded ×0.5 +1◆');
    });

    it('none, with a stance, names the stance', () => {
        const events: CombatEvent[] = [{ kind: 'stance-check-resolved', phaseIndex: 0, outcome: 'none', stance: 'heart' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toBe('HEART — neither, ×1');
    });

    it('none, with no stance drafted, prints the no-stance line', () => {
        const events: CombatEvent[] = [{ kind: 'stance-check-resolved', phaseIndex: 0, outcome: 'none', stance: null }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toBe('No stance — neither, ×1');
    });
});

describe('selectCombatLogHistory — turn dividers', () => {
    it('emits one TURN N divider per distinct turn, not per event', () => {
        const dice = [{ id: 'die-0', color: 'body' as const, state: 'available' as const, temporary: false }];
        const events: CombatEvent[] = [
            { kind: 'turn-dice-rolled', turn: 1, dice },
            { kind: 'turn-dice-rolled', turn: 1, dice },
            { kind: 'turn-dice-rolled', turn: 2, dice },
        ];
        const history = selectCombatLogHistory(stateWith(events));
        const dividers = history.filter((l) => l.side === 'system' && /^TURN \d+$/.test(l.text));
        expect(dividers.map((d) => d.text)).toEqual(['TURN 1', 'TURN 2']);
    });

    it('the dice-tray summary names each die\'s stance and face', () => {
        const dice = [
            { id: 'die-0', color: 'body' as const, state: 'available' as const, temporary: false, face: 'special' as const },
            { id: 'die-1', color: 'mind' as const, state: 'available' as const, temporary: false, face: 'mana' as const },
        ];
        const events: CombatEvent[] = [{ kind: 'turn-dice-rolled', turn: 3, dice }];
        const history = selectCombatLogHistory(stateWith(events));
        const summary = history.find((l) => l.text.startsWith('Turn 3. Dice:'));
        expect(summary?.text).toContain('BODY special');
        expect(summary?.text).toContain('MIND mana');
    });
});

describe('selectCombatLogHistory — caps at the most recent 200 entries', () => {
    it('a longer event stream is trimmed to the last 200, oldest first dropped', () => {
        const events: CombatEvent[] = Array.from({ length: 250 }, (_, i) => (
            { kind: 'damage-dealt', cardId: 'spoiled-poultice', target: 'enemy', amount: i } as CombatEvent
        ));
        const history = selectCombatLogHistory(stateWith(events));
        expect(history).toHaveLength(200);
        // The first 50 (amount 0..49) were dropped; the surviving oldest line
        // is the 51st event (amount 50).
        expect(history[0].text).toContain('You deal 50');
        expect(history[history.length - 1].text).toContain('You deal 249');
    });
});

describe('selectCombatLogHistory — carries every line selectCombatLogLines already produces', () => {
    it('an enemy-healed ledger line appears in the history untouched', () => {
        const events: CombatEvent[] = [{ kind: 'enemy-healed', enemyId: 'e', source: 'RAVENOUS', amount: 13 }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.side).toBe('enemy');
        expect(line.text).toContain('RAVENOUS');
        expect(line.text).toContain('VITAE +13');
    });

    it('a stage-entered line still carries its ‡ banner', () => {
        const events: CombatEvent[] = [{ kind: 'stage-entered', enemyId: 'e', name: 'The Brine Hag', text: 'She rises anew.' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toContain('THE BRINE HAG');
        expect(line.text).toContain('She rises anew.');
    });
});

describe('selectCombatLogHistory — DENIED never denies a bite that landed', () => {
    // Phase 102 / burn-day audit 3.3. The engine pushes `add-bit` immediately
    // before that phase's `phase-resolved`, so a hindered phase with a live
    // brood is `add-bit` + `phase-resolved: clear` — and the history wrote
    // `PHASE n — DENIED.` over the top of VITAE the player had just lost.
    //
    // The amount is read back off the event in every assertion (THE BIG
    // NUMBERS REWRITE): retune the bite and nothing here moves.
    const BIT = 8;
    const bite = (dealt: number): CombatEvent =>
        ({ kind: 'add-bit', addIds: ['qa-add-0'], raw: BIT, dealt } as CombatEvent);

    it('names the bite in the DENIED line when the brood took VITAE that phase', () => {
        const events: CombatEvent[] = [bite(BIT), { kind: 'phase-resolved', phaseIndex: 2, mark: 'clear' }];
        const denied = selectCombatLogHistory(stateWith(events)).filter((l) => l.text.includes('DENIED'));
        expect(denied).toHaveLength(1);
        expect(denied[0].text).not.toBe('PHASE 2 — DENIED.');
        expect(denied[0].text).toContain(String(BIT));
    });

    it('still reads as a clean DENIED when no brood was on the board', () => {
        const events: CombatEvent[] = [{ kind: 'phase-resolved', phaseIndex: 2, mark: 'clear' }];
        const [line] = selectCombatLogHistory(stateWith(events));
        expect(line.text).toBe('PHASE 2 — DENIED.');
    });

    it('still reads as a clean DENIED when the wall soaked the whole bite', () => {
        const events: CombatEvent[] = [bite(0), { kind: 'phase-resolved', phaseIndex: 2, mark: 'clear' }];
        const denied = selectCombatLogHistory(stateWith(events)).filter((l) => l.text.includes('DENIED'));
        expect(denied[0].text).toBe('PHASE 2 — DENIED.');
    });

    it('a bite in an EARLIER phase never colours a later DENIED', () => {
        const events: CombatEvent[] = [
            bite(BIT),
            { kind: 'phase-resolved', phaseIndex: 1, mark: 'overwhelmed' },
            { kind: 'phase-resolved', phaseIndex: 2, mark: 'clear' },
        ];
        const denied = selectCombatLogHistory(stateWith(events)).filter((l) => l.text.includes('DENIED'));
        expect(denied).toHaveLength(1);
        expect(denied[0].text).toBe('PHASE 2 — DENIED.');
    });
});
