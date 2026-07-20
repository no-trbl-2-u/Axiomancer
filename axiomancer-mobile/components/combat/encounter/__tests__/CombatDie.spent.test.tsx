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
