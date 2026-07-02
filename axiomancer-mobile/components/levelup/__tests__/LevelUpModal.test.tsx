/**
 * Hermetic component tests — LevelUpModal (Phase 73 Tick B).
 *
 * The modal is presentation-only with local allocation state. The
 * tests exercise the user flow:
 *   - mount + chrome (eyebrow, level transition, title, flavor)
 *   - points-remaining strip arithmetic + the "lit" wake at 0
 *   - ± controls per stance (canInc / canDec gates)
 *   - reset link gating
 *   - COMMIT button ghost ↔ live transition
 *   - "keep deliberating" cancel path
 *   - discard-confirm inset when canceling with sumSpent > 0
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { LevelUpModal } from '@/components/levelup/LevelUpModal';

const BASE_PROPS = {
    characterName: 'Grief-for-No-One',
    fromLevel: 6,
    toLevel: 7,
    totalPoints: 3,
    current: { heart: 11, body: 13, mind: 9 },
    onCommit: () => undefined,
    onCancel: () => undefined,
};

// Phase 88: derived stats for ribbon testing
const DERIVED_STATS = {
    heart: { attack: 12, skill: 10, defense: 8 },
    body: { attack: 14, skill: 8, defense: 11 },
    mind: { attack: 9, skill: 13, defense: 7 },
};

const PROPS_WITH_DERIVED = {
    ...BASE_PROPS,
    currentDerived: DERIVED_STATS,
};

describe('LevelUpModal: chrome render', () => {
    it('mounts the modal', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByTestId('levelup-modal')).not.toBeNull();
    });

    it('renders the eyebrow + level transition with lowercase roman', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByText('✠ THE LEDGER OPENS')).not.toBeNull();
        expect(tree.queryByText('level vi')).not.toBeNull();
        expect(tree.queryByText('level vii')).not.toBeNull();
    });

    it('renders the character name uppercased', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByText('GRIEF-FOR-NO-ONE')).not.toBeNull();
    });

    it('renders the consolation line at the bottom', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByText('the chronicle records each change.')).not.toBeNull();
    });
});

describe('LevelUpModal: points-remaining strip', () => {
    it('starts at totalPoints / totalPoints', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByText('3 / 3')).not.toBeNull();
    });

    it('decrements as the player increments stances', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        expect(tree.queryByText('2 / 3')).not.toBeNull();
        fireEvent.press(tree.getByTestId('levelup-modal-inc-body'));
        expect(tree.queryByText('1 / 3')).not.toBeNull();
    });
});

describe('LevelUpModal: ± controls per stance', () => {
    it('blocks inc when remaining is 0', () => {
        const onCommit = jest.fn();
        const tree = render(<LevelUpModal {...BASE_PROPS} onCommit={onCommit} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        // Now spent.heart === 3; remaining === 0. Try one more inc — should no-op.
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        // The number row reads `current.heart + spent.heart` = 11 + 3 = 14.
        expect(tree.queryByText('14')).not.toBeNull();
        expect(tree.queryByText('15')).toBeNull();
    });

    it('blocks dec when spent is 0', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        fireEvent.press(tree.getByTestId('levelup-modal-dec-mind'));
        // No-op — counter still shows current.mind === 9.
        expect(tree.queryByText('9')).not.toBeNull();
    });

    it('dec reverses an inc', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-body'));
        fireEvent.press(tree.getByTestId('levelup-modal-dec-body'));
        // body is back to current === 13.
        expect(tree.queryByText('13')).not.toBeNull();
        // Points-remaining strip is back to 3 / 3.
        expect(tree.queryByText('3 / 3')).not.toBeNull();
    });
});

describe('LevelUpModal: reset', () => {
    it('reset is disabled when sumSpent === 0', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        const reset = tree.getByTestId('levelup-modal-reset');
        expect(reset.props.accessibilityState?.disabled).toBe(true);
    });

    it('reset is enabled and clears spent counts when sumSpent > 0', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-mind'));
        expect(tree.queryByText('1 / 3')).not.toBeNull();
        fireEvent.press(tree.getByTestId('levelup-modal-reset'));
        expect(tree.queryByText('3 / 3')).not.toBeNull();
    });
});

describe('LevelUpModal: COMMIT button', () => {
    it('renders the COMMIT button label', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByText('✠ COMMIT')).not.toBeNull();
    });

    it('is disabled until all points are spent (accessibility state)', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        const commit = tree.getByTestId('levelup-modal-commit');
        expect(commit.props.accessibilityState?.disabled).toBe(true);
    });

    it('wakes when sumSpent === totalPoints', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-body'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-mind'));
        const commit = tree.getByTestId('levelup-modal-commit');
        expect(commit.props.accessibilityState?.disabled).toBe(false);
    });

    it('fires onCommit with the spent payload when pressed live', () => {
        const onCommit = jest.fn();
        const tree = render(<LevelUpModal {...BASE_PROPS} onCommit={onCommit} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-body'));
        fireEvent.press(tree.getByTestId('levelup-modal-inc-mind'));
        fireEvent.press(tree.getByTestId('levelup-modal-commit'));
        expect(onCommit).toHaveBeenCalledWith({ heart: 1, body: 1, mind: 1 });
    });
});

describe('LevelUpModal: keep-deliberating + discard-confirm', () => {
    it('keep-deliberating with sumSpent === 0 calls onCancel directly', () => {
        const onCancel = jest.fn();
        const tree = render(<LevelUpModal {...BASE_PROPS} onCancel={onCancel} />);
        fireEvent.press(tree.getByTestId('levelup-modal-deliberate'));
        expect(onCancel).toHaveBeenCalledTimes(1);
        // Discard inset should NOT mount when no points are spent.
        expect(tree.queryByTestId('levelup-modal-discard')).toBeNull();
    });

    it('keep-deliberating with sumSpent > 0 surfaces the discard-confirm inset', () => {
        const onCancel = jest.fn();
        const tree = render(<LevelUpModal {...BASE_PROPS} onCancel={onCancel} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-deliberate'));
        expect(tree.queryByTestId('levelup-modal-discard')).not.toBeNull();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('discard STEP BACK clears local state and fires onCancel', () => {
        const onCancel = jest.fn();
        const tree = render(<LevelUpModal {...BASE_PROPS} onCancel={onCancel} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-deliberate'));
        fireEvent.press(tree.getByTestId('levelup-modal-discard-confirm'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('discard STAY ON THE PAGE dismisses the inset without canceling', () => {
        const onCancel = jest.fn();
        const tree = render(<LevelUpModal {...BASE_PROPS} onCancel={onCancel} />);
        fireEvent.press(tree.getByTestId('levelup-modal-inc-heart'));
        fireEvent.press(tree.getByTestId('levelup-modal-deliberate'));
        fireEvent.press(tree.getByTestId('levelup-modal-discard-cancel'));
        expect(tree.queryByTestId('levelup-modal-discard')).toBeNull();
        expect(onCancel).not.toHaveBeenCalled();
    });
});

describe('LevelUpModal: derived preview ribbon (Phase 88)', () => {
    it('does not render ribbon when currentDerived not provided', () => {
        const tree = render(<LevelUpModal {...BASE_PROPS} />);
        expect(tree.queryByTestId('derived-preview-ribbon')).toBeNull();
    });

    it('renders ribbon when currentDerived is provided', () => {
        const tree = render(<LevelUpModal {...PROPS_WITH_DERIVED} />);
        expect(tree.queryByTestId('derived-preview-ribbon')).not.toBeNull();
    });

    it('ribbon shows ATK/SKL/DEF headers', () => {
        const tree = render(<LevelUpModal {...PROPS_WITH_DERIVED} />);
        expect(tree.queryByText('ATK')).not.toBeNull();
        expect(tree.queryByText('SKL')).not.toBeNull();
        expect(tree.queryByText('DEF')).not.toBeNull();
    });

    it('ribbon initially shows current values without deltas', () => {
        const tree = render(<LevelUpModal {...PROPS_WITH_DERIVED} />);
        
        // Should show the derived preview ribbon
        expect(tree.queryByTestId('derived-preview-ribbon')).not.toBeNull();
        
        // Should show some of the derived stat values in the ribbon
        expect(tree.queryByTestId('preview-body-attack')).not.toBeNull();
        expect(tree.queryByTestId('preview-mind-skill')).not.toBeNull();
        
        // Should not show delta arrows initially
        expect(tree.queryByText('→')).toBeNull();
    });
});
