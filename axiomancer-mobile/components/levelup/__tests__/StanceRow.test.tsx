/**
 * Hermetic component tests — StanceRow (level-up stat-allocation row).
 *
 * Tests the per-stance allocation row logic:
 *   - newValue = current + spent projection ("newValue from current")
 *   - showDelta = spent > 0 gate (delta label vs. waiting bar)
 *   - inc/dec press gating (handler fires when enabled, no-op when disabled)
 *   - disabled accessibilityState on the controls
 *   - per-stance testIDs / accessibility labels
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { StanceRow } from '@/components/levelup/StanceRow';

function renderRow(overrides: Partial<React.ComponentProps<typeof StanceRow>> = {}) {
    const onInc = jest.fn();
    const onDec = jest.fn();
    const props = {
        stance: 'heart' as const,
        current: 10,
        spent: 0,
        canInc: true,
        canDec: false,
        onInc,
        onDec,
        ...overrides,
    };
    return { tree: render(<StanceRow {...props} />), onInc, onDec, props };
}

describe('StanceRow: layout and per-stance identity', () => {
    it('mounts the row for each stance with its testID', () => {
        const heart = render(
            <StanceRow stance="heart" current={5} spent={0} canInc canDec={false} onInc={() => {}} onDec={() => {}} />
        );
        const body = render(
            <StanceRow stance="body" current={5} spent={0} canInc canDec={false} onInc={() => {}} onDec={() => {}} />
        );
        const mind = render(
            <StanceRow stance="mind" current={5} spent={0} canInc canDec={false} onInc={() => {}} onDec={() => {}} />
        );
        expect(heart.queryByTestId('levelup-modal-row-heart')).not.toBeNull();
        expect(body.queryByTestId('levelup-modal-row-body')).not.toBeNull();
        expect(mind.queryByTestId('levelup-modal-row-mind')).not.toBeNull();
    });

    it('renders the inc/dec controls with stance-scoped testIDs and labels', () => {
        const { tree } = renderRow({ stance: 'mind' });
        const inc = tree.getByTestId('levelup-modal-inc-mind');
        const dec = tree.getByTestId('levelup-modal-dec-mind');
        expect(inc.props.accessibilityLabel).toBe('Increment mind');
        expect(dec.props.accessibilityLabel).toBe('Decrement mind');
    });

    it('uppercases the stance label', () => {
        const { tree } = renderRow({ stance: 'body' });
        expect(tree.queryByText('BODY')).not.toBeNull();
    });
});

describe('StanceRow: newValue projection', () => {
    it('shows current value when nothing is spent (newValue === current)', () => {
        const { tree } = renderRow({ current: 12, spent: 0 });
        expect(tree.queryByText('12')).not.toBeNull();
        expect(tree.queryByText('from 12')).not.toBeNull();
    });

    it('projects newValue = current + spent', () => {
        const { tree } = renderRow({ current: 12, spent: 3 });
        expect(tree.queryByText('15')).not.toBeNull();
        expect(tree.queryByText('from 12')).not.toBeNull();
    });
});

describe('StanceRow: showDelta gate', () => {
    it('hides the +N delta label when nothing is spent', () => {
        const { tree } = renderRow({ current: 10, spent: 0 });
        expect(tree.queryByText('+0')).toBeNull();
        expect(tree.queryByText('+1')).toBeNull();
    });

    it('shows the +N delta label when spent > 0', () => {
        const { tree } = renderRow({ current: 10, spent: 2 });
        expect(tree.queryByText('+2')).not.toBeNull();
    });
});

describe('StanceRow: increment gating', () => {
    it('fires onInc when canInc is true', () => {
        const { tree, onInc } = renderRow({ canInc: true });
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        expect(onInc).toHaveBeenCalledTimes(1);
    });

    it('does not fire onInc when canInc is false', () => {
        const { tree, onInc } = renderRow({ canInc: false });
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        expect(onInc).not.toHaveBeenCalled();
    });

    it('reflects canInc in the inc control accessibilityState', () => {
        const enabled = renderRow({ canInc: true });
        const disabled = renderRow({ canInc: false });
        expect(enabled.tree.getByTestId('levelup-modal-inc-heart').props.accessibilityState).toMatchObject({ disabled: false });
        expect(disabled.tree.getByTestId('levelup-modal-inc-heart').props.accessibilityState).toMatchObject({ disabled: true });
    });
});

describe('StanceRow: decrement gating', () => {
    it('fires onDec when canDec is true', () => {
        const { tree, onDec } = renderRow({ canDec: true });
        fireEvent.press(tree.getByTestId('levelup-modal-dec-heart'));
        expect(onDec).toHaveBeenCalledTimes(1);
    });

    it('does not fire onDec when canDec is false', () => {
        const { tree, onDec } = renderRow({ canDec: false });
        fireEvent.press(tree.getByTestId('levelup-modal-dec-heart'));
        expect(onDec).not.toHaveBeenCalled();
    });

    it('reflects canDec in the dec control accessibilityState', () => {
        const enabled = renderRow({ canDec: true });
        const disabled = renderRow({ canDec: false });
        expect(enabled.tree.getByTestId('levelup-modal-dec-heart').props.accessibilityState).toMatchObject({ disabled: false });
        expect(disabled.tree.getByTestId('levelup-modal-dec-heart').props.accessibilityState).toMatchObject({ disabled: true });
    });
});
