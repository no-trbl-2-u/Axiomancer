/**
 * CombatDie — the spoken die (spec 33 a11y copy).
 *
 * Playtest 2026-09-04 finding 3: the die label still said "available to
 * draft", the pre-spec-33 one-draft vocabulary. Under spec 33 a die is never
 * drafted; it is dragged onto a staged card. A SPECIAL face powers the card
 * AND pays Conviction, a MANA face powers one paid line of its colour, gold
 * powers any colour, MISS is dead. The label is a pure function so the
 * e2e harness (`scripts/combat-round-e2e.mjs` readDice) and the screen
 * reader hear the same words.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { SPECIAL_CONVICTION_DEFAULT } from '@mechanics';
import { CombatDie, combatDieA11yLabel } from '@/components/combat/encounter/CombatDie';
import type { CombatDieVM } from '@/state/presenters/combat-encounter.engine';

const HEART: CombatDieVM = {
    id: 'd-heart', color: 'heart', colorHex: '#c23b3b', glyph: '♥', stanceLabel: 'HEART',
    spent: false, isX: false, draggable: true,
} as CombatDieVM;

const GOLD: CombatDieVM = { ...HEART, id: 'd-wild', color: 'wild', glyph: '★', stanceLabel: 'WILD' } as CombatDieVM;

describe('combatDieA11yLabel — spec 33 faces', () => {
    it('never speaks the pre-spec-33 draft vocabulary', () => {
        const dice: CombatDieVM[] = [
            { ...HEART, face: 'special' }, { ...HEART, face: 'mana' }, { ...HEART, face: 'miss' },
            { ...GOLD, face: 'special' }, { ...HEART, face: 'mana', spent: true },
        ];
        for (const die of dice) {
            expect(combatDieA11yLabel(die)).not.toMatch(/available to draft|draft it/i);
        }
    });

    it('SPECIAL: drag onto a staged card of its colour, powers it AND pays Conviction', () => {
        const label = combatDieA11yLabel({ ...HEART, face: 'special' });
        expect(label).toBe(`HEART die, SPECIAL face: drag onto a staged HEART card to power it and gain ${SPECIAL_CONVICTION_DEFAULT} Conviction`);
    });

    it('SPECIAL payload follows the gear slot, not the stock default', () => {
        const label = combatDieA11yLabel({ ...HEART, face: 'special' }, { specialConviction: 3 });
        expect(label).toContain('gain 3 Conviction');
    });

    it('MANA: drag onto a staged card of its colour to power its paid line', () => {
        expect(combatDieA11yLabel({ ...HEART, face: 'mana' }))
            .toBe('HEART die, MANA face: drag onto a staged HEART card to power its paid line');
    });

    it('gold is named gold and powers a card of any colour', () => {
        const label = combatDieA11yLabel({ ...GOLD, face: 'mana' });
        expect(label).toContain('(gold) die');
        expect(label).toContain('a staged card of any colour');
    });

    it('MISS and CRACKED faces read dead and power nothing', () => {
        expect(combatDieA11yLabel({ ...HEART, face: 'miss' })).toBe('HEART die, MISS face: dead, powers nothing');
        const cracked = combatDieA11yLabel({ ...HEART, face: 'special', cracked: true });
        expect(cracked).toContain('CRACKED');
        expect(cracked).toContain('powers nothing');
        expect(cracked).not.toContain('drag onto');
    });

    it('a spent die says so and no longer invites a drag', () => {
        const label = combatDieA11yLabel({ ...HEART, face: 'mana', spent: true, draggable: false });
        expect(label).toContain('spent');
        expect(label).not.toContain('drag onto');
    });

    it('an assigned die (socketed on a staged card) says APPLY will power it', () => {
        const label = combatDieA11yLabel({ ...HEART, face: 'special' }, { assigned: true });
        expect(label).toContain('assigned to a staged card');
        expect(label).toContain('APPLY');
        expect(label).not.toContain('drag onto');
    });

    it('Reserve and ghost dice keep the drag verb with their provenance', () => {
        expect(combatDieA11yLabel({ ...HEART, face: 'mana', reserve: true })).toContain('banked in the Reserve');
        expect(combatDieA11yLabel({ ...HEART, face: 'mana', floating: true })).toContain('a ghost');
        expect(combatDieA11yLabel({ ...HEART, face: 'mana', reserve: true })).toContain('drag onto');
    });

    it('an X (blocked) die powers nothing', () => {
        const label = combatDieA11yLabel({ ...HEART, id: 'd-x', color: 'x', isX: true, stanceLabel: 'X' } as CombatDieVM);
        expect(label).toContain('blocked');
        expect(label).toContain('powers nothing');
    });
});

describe('CombatDie — the rendered label is the pure label', () => {
    it('speaks the SPECIAL line, honouring the gear payload', () => {
        const die: CombatDieVM = { ...HEART, face: 'special' };
        render(<CombatDie die={die} specialConviction={4} />);
        expect(screen.getByTestId(`combat-die-${die.id}`).props.accessibilityLabel)
            .toBe(combatDieA11yLabel(die, { specialConviction: 4 }));
    });

    it('the socket copy on a staged card reads assigned', () => {
        const die: CombatDieVM = { ...HEART, face: 'mana' };
        render(<CombatDie die={die} assigned testID="combat-staged-die-face" />);
        expect(screen.getByTestId('combat-staged-die-face').props.accessibilityLabel).toContain('assigned');
    });
});
