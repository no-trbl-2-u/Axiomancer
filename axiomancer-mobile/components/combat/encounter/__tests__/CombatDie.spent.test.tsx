/**
 * Owner jot (`/jot` 2026-07-20, routed to Phase 38 via `/oversight`): a used
 * die reads as spent — greyed out. Proves `CombatDie` wires the lib/juice
 * `spentDieTreatment` static state through to the rendered die.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { CombatDie } from '@/components/combat/encounter/CombatDie';
import type { CombatDieVM } from '@/state/presenters/combat-encounter.engine';

const BASE_DIE: CombatDieVM = {
    id: 'd-heart', color: 'heart', colorHex: '#c23b3b', glyph: '♥', stanceLabel: 'Heart',
    drafted: true, spent: false, isX: false, readPip: null, draggable: false,
};

describe('CombatDie — spent-state greying', () => {
    it('a drafted, unspent die renders at full opacity', () => {
        render(<CombatDie die={BASE_DIE} />);
        const el = screen.getByTestId(`combat-die-${BASE_DIE.id}`);
        expect(el.props.style.opacity).toBe(1);
    });

    it('a drafted, spent die renders desaturated (opacity < 1)', () => {
        const spentDie: CombatDieVM = { ...BASE_DIE, spent: true };
        render(<CombatDie die={spentDie} />);
        const el = screen.getByTestId(`combat-die-${spentDie.id}`);
        expect(el.props.style.opacity).toBeLessThan(1);
    });

    it('THE FLIP model — a used tray die is spent WITHOUT drafted, and must still grey', () => {
        // Under Upgradeable Dice (on for every build) a card is powered by a tray
        // die directly — no draft step — so a used die is `spent` with `drafted`
        // false. The old `drafted && spent` gate excluded exactly this, live case
        // and used dice never greyed. This is the regression the owner reported.
        const usedDie: CombatDieVM = { ...BASE_DIE, drafted: false, spent: true, face: 'mana' };
        render(<CombatDie die={usedDie} />);
        const el = screen.getByTestId(`combat-die-${usedDie.id}`);
        expect(el.props.style.opacity).toBeLessThan(1);
        expect(el.props.accessibilityLabel).toContain('spent');
    });

    it('a dead (miss) face is unaffected by spent — it already reads dead', () => {
        const deadDie: CombatDieVM = { ...BASE_DIE, drafted: false, spent: false, face: 'miss' };
        render(<CombatDie die={deadDie} />);
        const el = screen.getByTestId(`combat-die-${deadDie.id}`);
        expect(el.props.style.opacity).toBe(1);
        expect(el.props.accessibilityLabel).toContain('a miss');
    });

    it('the a11y label calls out the spent state in words', () => {
        const spentDie: CombatDieVM = { ...BASE_DIE, spent: true };
        render(<CombatDie die={spentDie} />);
        const el = screen.getByTestId(`combat-die-${spentDie.id}`);
        expect(el.props.accessibilityLabel).toContain('spent as your stance');
    });
});
