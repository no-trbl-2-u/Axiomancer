/**
 * FE-007 — the "walk away" control must read as a control.
 *
 * On `/dialogue` and `/blacksmith` this exit was bare bone-coloured text
 * under solid bordered choices, with a ~27px hit target. These guards pin the
 * border, the 44px minimum target, and that the press still fires.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { LeaveRow } from '../LeaveRow';

/** Collapse a possibly-array RN style prop into one object. */
function flatten(style: unknown): Record<string, unknown> {
    if (Array.isArray(style)) {
        return Object.assign({}, ...style.flat(Infinity).filter(Boolean)) as Record<string, unknown>;
    }
    return (style ?? {}) as Record<string, unknown>;
}

describe('LeaveRow', () => {
    const props = {
        label: 'TIP YOUR CAP AND GO',
        accessibilityLabel: 'Walk away',
        onPress: () => {},
        testID: 'dialogue-leave',
    };

    it('renders its label', () => {
        render(<LeaveRow {...props} />);
        expect(screen.getByText('TIP YOUR CAP AND GO')).toBeTruthy();
    });

    it('is a button with the given screen-reader name', () => {
        render(<LeaveRow {...props} />);
        const row = screen.getByTestId('dialogue-leave');
        expect(row.props.accessibilityRole).toBe('button');
        expect(row.props.accessibilityLabel).toBe('Walk away');
    });

    it('carries a visible border so it does not read as a caption', () => {
        render(<LeaveRow {...props} />);
        const style = flatten(screen.getByTestId('dialogue-leave').props.style);
        expect(style.borderWidth).toBeGreaterThan(0);
        expect(style.borderStyle).toBe('dashed');
    });

    it('meets the 44px minimum touch target', () => {
        render(<LeaveRow {...props} />);
        const style = flatten(screen.getByTestId('dialogue-leave').props.style);
        expect(style.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('fires onPress', () => {
        const onPress = jest.fn();
        render(<LeaveRow {...props} onPress={onPress} />);
        fireEvent.press(screen.getByTestId('dialogue-leave'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
