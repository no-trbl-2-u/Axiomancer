/**
 * Hermetic component tests — AscendStrip (Phase 73 Tick A).
 *
 * Pins: mount, copy (level transition + points + chevron noise),
 * pluralization, tap handler wiring, accessibility.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { AscendStrip } from '@/components/levelup/AscendStrip';

describe('AscendStrip: render contract', () => {
    it('mounts the strip', () => {
        const tree = render(
            <AscendStrip pendingPoints={3} level={7} onOpen={() => {}} />,
        );
        expect(tree.queryByTestId('ascend-strip')).not.toBeNull();
    });

    it('renders the ASCEND title + subline with lowercase-roman target level', () => {
        const tree = render(
            <AscendStrip pendingPoints={3} level={7} onOpen={() => {}} />,
        );
        expect(tree.queryByText('✠ ASCEND')).not.toBeNull();
        expect(tree.queryByText(/3 points unspent · step into level viii/)).not.toBeNull();
    });

    it('pluralizes "point" / "points" correctly', () => {
        const single = render(
            <AscendStrip pendingPoints={1} level={4} onOpen={() => {}} />,
        );
        expect(single.queryByText(/1 point unspent/)).not.toBeNull();
        expect(single.queryByText(/points unspent/)).toBeNull();

        const many = render(
            <AscendStrip pendingPoints={4} level={4} onOpen={() => {}} />,
        );
        expect(many.queryByText(/4 points unspent/)).not.toBeNull();
    });

    it('omits the "ignored pings" chevron row at pendingPoints === 1', () => {
        const tree = render(
            <AscendStrip pendingPoints={1} level={4} onOpen={() => {}} />,
        );
        // The chevron row uses the "↑" character; check it's absent.
        expect(tree.queryByText(/↑/)).toBeNull();
    });

    it('renders one ↑ per point for pendingPoints in [2, 5]', () => {
        const tree = render(
            <AscendStrip pendingPoints={3} level={4} onOpen={() => {}} />,
        );
        expect(tree.queryByText('↑ ↑ ↑')).not.toBeNull();
    });

    it('switches to ↑×N form for pendingPoints > 5', () => {
        const tree = render(
            <AscendStrip pendingPoints={9} level={4} onOpen={() => {}} />,
        );
        expect(tree.queryByText('↑×9')).not.toBeNull();
    });
});

describe('AscendStrip: tap wiring', () => {
    it('calls onOpen once on press', () => {
        const onOpen = jest.fn();
        const tree = render(
            <AscendStrip pendingPoints={3} level={7} onOpen={onOpen} />,
        );
        fireEvent.press(tree.getByTestId('ascend-strip'));
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('exposes an accessible name with the level + points context', () => {
        const tree = render(
            <AscendStrip pendingPoints={3} level={7} onOpen={() => {}} />,
        );
        const strip = tree.getByTestId('ascend-strip');
        expect(strip.props.accessibilityLabel).toBe(
            'Ascend — 3 points unspent, step into level 8',
        );
    });
});
