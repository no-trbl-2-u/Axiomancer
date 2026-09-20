/**
 * Hermetic presenter tests — `selectEnemyActionCard` (2026-08-10).
 *
 * The user report this shapes: "the enemy's card/attack — can we show the card
 * to the player for a moment so the player knows what happened on the enemy's
 * turn?" The enemy plays no literal cards, so the selector reads its resolved
 * threat phase back off the event stream and shapes it as one.
 *
 * Pins:
 *   - only the ENEMY's turn produces a card (a player APPLY does not)
 *   - a fired phase carries its action sentence + structured payload lines
 *   - a HINDERED phase still produces a card, marked denied
 *   - a HINDERED phase the BROOD still bit reports the bite (burn-day audit
 *     3.3): `denied` means the foe's own blow was held, never "nothing
 *     landed", because the engine resolves the bite outside that gate
 *   - the `buildThreatAction` parenthetical is stripped from the sentence
 *     (the payload lines carry it — printing both reads as a stutter)
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import type { CombatEncounterState, CombatEvent } from '@mechanics';

import { selectEnemyActionCard } from '@/state/presenters/combat-encounter.engine';

/** The only fields the selector reads off state. */
function stateWithPhases(): CombatEncounterState {
    return {
        threatPhases: [
            {
                index: 1,
                enemyStance: 'body',
                intentType: 'damage',
                threatAction: {
                    description: 'Cairn-rot presses the attack (+6 damage).',
                    effects: [{ damage: 6 }],
                },
                isFinalPhase: false,
            },
            {
                index: 2,
                enemyStance: 'mind',
                intentType: 'combo',
                intentLabel: 'CHARGES UP',
                threatAction: {
                    description: 'Cairn-rot exhales rot (+4 damage, Poison).',
                    effects: [{ damage: 4 }, { effectId: 'debuff_poison', intensity: 2 }],
                },
                isFinalPhase: true,
            },
        ],
    } as unknown as CombatEncounterState;
}

const FIRED_PHASE_2: CombatEvent = {
    kind: 'threat-fired',
    phaseIndex: 2,
    description: 'Cairn-rot exhales rot (+4 damage, Poison).',
    effects: [{ damage: 4 }, { effectId: 'debuff_poison', intensity: 2 }],
};

describe('selectEnemyActionCard: when a card is produced at all', () => {
    it('returns null for a bump with no threat resolution (the player played a card)', () => {
        const events: CombatEvent[] = [
            { kind: 'damage-dealt', target: 'enemy', amount: 7 } as CombatEvent,
        ];
        expect(selectEnemyActionCard(events, stateWithPhases())).toBeNull();
    });

    it('returns null on an empty event list', () => {
        expect(selectEnemyActionCard([], stateWithPhases())).toBeNull();
    });

    it('produces a card when the threat fired', () => {
        const card = selectEnemyActionCard([FIRED_PHASE_2], stateWithPhases());
        expect(card).not.toBeNull();
        expect(card!.phaseIndex).toBe(2);
        expect(card!.denied).toBe(false);
    });
});

describe('selectEnemyActionCard: what the card says', () => {
    it('keeps the action sentence and drops its payload parenthetical', () => {
        const card = selectEnemyActionCard([FIRED_PHASE_2], stateWithPhases());
        expect(card!.actionText).toBe('Cairn-rot exhales rot');
    });

    it('carries the payload as structured lines, in the keyword vocabulary', () => {
        const card = selectEnemyActionCard([FIRED_PHASE_2], stateWithPhases());
        expect(card!.lines.map((l) => l.text)).toEqual(['4 DAMAGE', 'POISON ×2']);
    });

    it('omits the multiplier on a single-stack effect', () => {
        const events: CombatEvent[] = [{
            kind: 'threat-fired',
            phaseIndex: 1,
            description: 'Cairn-rot bites (Poison).',
            effects: [{ effectId: 'debuff_poison', intensity: 1 }],
        }];
        const card = selectEnemyActionCard(events, stateWithPhases());
        expect(card!.lines.map((l) => l.text)).toEqual(['POISON']);
    });

    it('names the self-heal / cleanse riders too', () => {
        const events: CombatEvent[] = [{
            kind: 'threat-fired',
            phaseIndex: 1,
            description: 'Cairn-rot loses patience (+9 damage, heals 4).',
            effects: [{ damage: 9 }, { enemyHeal: 4 }, { enemyCleanse: 2 }],
        }];
        const card = selectEnemyActionCard(events, stateWithPhases());
        expect(card!.lines.map((l) => l.text)).toEqual(['9 DAMAGE', 'HEALS 4', 'SHEDS 2']);
    });

    it('prefers the phase\'s authored intent label over the generic intent word', () => {
        const card = selectEnemyActionCard([FIRED_PHASE_2], stateWithPhases());
        expect(card!.label).toBe('CHARGES UP');
    });

    it('falls back to the intent word when the phase authored no label', () => {
        const events: CombatEvent[] = [{
            kind: 'threat-fired',
            phaseIndex: 1,
            description: 'Cairn-rot presses the attack (+6 damage).',
            effects: [{ damage: 6 }],
        }];
        const card = selectEnemyActionCard(events, stateWithPhases());
        expect(card!.label).toBe('ATTACKS');
    });

    it('leaves a description with no parenthetical unchanged (bar the full stop)', () => {
        const events: CombatEvent[] = [{
            kind: 'threat-fired',
            phaseIndex: 1,
            description: 'Cairn-rot waits.',
            effects: [],
        }];
        const card = selectEnemyActionCard(events, stateWithPhases());
        expect(card!.actionText).toBe('Cairn-rot waits');
        expect(card!.lines).toEqual([]);
    });
});

describe('selectEnemyActionCard: the denied phase', () => {
    // A hindered phase emits `phase-resolved` with mark 'clear' and NO
    // 'threat-fired' — the proof the player's control worked, which is exactly
    // the turn most worth showing back.
    const HINDERED: CombatEvent[] = [{ kind: 'phase-resolved', phaseIndex: 2, mark: 'clear' }];

    it('still produces a card, marked denied', () => {
        const card = selectEnemyActionCard(HINDERED, stateWithPhases());
        expect(card).not.toBeNull();
        expect(card!.denied).toBe(true);
    });

    it('reads the averted action off the phase itself', () => {
        const card = selectEnemyActionCard(HINDERED, stateWithPhases());
        expect(card!.actionText).toBe('Cairn-rot exhales rot');
        expect(card!.lines.map((l) => l.text)).toEqual(['4 DAMAGE', 'POISON ×2']);
    });

    it('is NOT denied when the phase resolved overwhelmed (the threat fired)', () => {
        const card = selectEnemyActionCard(
            [FIRED_PHASE_2, { kind: 'phase-resolved', phaseIndex: 2, mark: 'overwhelmed' }],
            stateWithPhases(),
        );
        expect(card!.denied).toBe(false);
    });

    it('returns null when the resolved phase is unknown and carries no description', () => {
        const card = selectEnemyActionCard(
            [{ kind: 'phase-resolved', phaseIndex: 99, mark: 'clear' }],
            stateWithPhases(),
        );
        expect(card).toBeNull();
    });
});

describe('selectEnemyActionCard: a denied phase the brood still bit', () => {
    // Phase 102 — the brood bites OUTSIDE the engine's `!hindered` gate, in an
    // `add-bit` event of its own. A card read off the telegraph alone called a
    // phase that cost real VITAE "denied", with nothing on it that landed.
    //
    // THE BIG NUMBERS REWRITE: the amount below is arbitrary and every
    // assertion reads it back off the event — retune the bite and this suite
    // is unmoved. What is pinned is that the card reports what LANDED.
    const BIT = 8;
    const bite = (dealt: number): CombatEvent =>
        ({ kind: 'add-bit', addIds: ['qa-add-0', 'qa-add-1'], raw: BIT, dealt } as CombatEvent);
    const CLEAR: CombatEvent = { kind: 'phase-resolved', phaseIndex: 2, mark: 'clear' };

    it('reports what the brood took, as a line of its own', () => {
        const card = selectEnemyActionCard([bite(BIT), CLEAR], stateWithPhases())!;
        expect(card.denied).toBe(true);
        expect(card.addDealt).toBe(BIT);
        const brood = card.lines.filter((l) => l.source === 'brood');
        expect(brood).toHaveLength(1);
        expect(brood[0].text).toContain(String(BIT));
    });

    it('keeps the averted telegraph marked as the foe\'s own, so only it reads as averted', () => {
        const card = selectEnemyActionCard([bite(BIT), CLEAR], stateWithPhases())!;
        expect(card.lines.filter((l) => l.source === 'telegraph').map((l) => l.text))
            .toEqual(['4 DAMAGE', 'POISON ×2']);
    });

    it('reports nothing landed when the wall soaked the whole bite', () => {
        const card = selectEnemyActionCard([bite(0), CLEAR], stateWithPhases())!;
        expect(card.addDealt).toBe(0);
        expect(card.lines.every((l) => l.source === 'telegraph')).toBe(true);
    });

    it('a denied phase with no brood at all is unchanged', () => {
        const card = selectEnemyActionCard([CLEAR], stateWithPhases())!;
        expect(card.addDealt).toBe(0);
        expect(card.lines.map((l) => l.text)).toEqual(['4 DAMAGE', 'POISON ×2']);
    });
});
