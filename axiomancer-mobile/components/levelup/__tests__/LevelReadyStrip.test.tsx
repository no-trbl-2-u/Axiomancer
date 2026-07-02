/**
 * Hermetic component tests — LevelReadyStrip (Phase 73 follow-up,
 * user-jot 2026-05-24).
 *
 * Pins: mount, copy (level transition target in lowercase-roman),
 * tap handler wiring, accessibility label.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { LevelReadyStrip } from '@/components/levelup/LevelReadyStrip';

describe('LevelReadyStrip: render contract', () => {
    it('mounts the strip with the documented testID', () => {
        const tree = render(<LevelReadyStrip level={4} onLevelUp={() => {}} />);
        expect(tree.queryByTestId('level-ready-strip')).not.toBeNull();
    });

    it('renders the ASCEND READY title + subline with lowercase-roman target level', () => {
        const tree = render(<LevelReadyStrip level={7} onLevelUp={() => {}} />);
        expect(tree.queryByText('✠ ASCEND READY')).not.toBeNull();
        expect(tree.queryByText(/threshold crossed · step into level viii/)).not.toBeNull();
    });

    it('exposes an accessibility label naming the target level', () => {
        const tree = render(<LevelReadyStrip level={4} onLevelUp={() => {}} />);
        expect(tree.queryByLabelText(/advance to level 5/i)).not.toBeNull();
    });

    it('fires onLevelUp exactly once when pressed', () => {
        const onLevelUp = jest.fn();
        const tree = render(<LevelReadyStrip level={4} onLevelUp={onLevelUp} />);
        fireEvent.press(tree.getByTestId('level-ready-strip'));
        expect(onLevelUp).toHaveBeenCalledTimes(1);
    });
});
