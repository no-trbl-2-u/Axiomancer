/**
 * Hermetic component tests — FriendshipMeter (combat-HUD heart
 * counter). Pins the render contract: N hearts drawn, filled
 * count matches `value`, compact mode hides the SECTION label,
 * counter text shows `value/max`.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Path } from 'react-native-svg';

import { FriendshipMeter } from '@/components/FriendshipMeter';
import { AXM } from '@/theme/axm';

describe('FriendshipMeter: heart rendering', () => {
    it('renders `max` hearts (default 5)', () => {
        const tree = render(<FriendshipMeter />);
        const hearts = tree.UNSAFE_getAllByType(Path);
        expect(hearts).toHaveLength(5);
    });

    it('renders a custom max heart count', () => {
        const tree = render(<FriendshipMeter max={3} />);
        const hearts = tree.UNSAFE_getAllByType(Path);
        expect(hearts).toHaveLength(3);
    });
});

describe('FriendshipMeter: fill semantics', () => {
    it('fills the first `value` hearts when value < max', () => {
        const tree = render(<FriendshipMeter value={2} max={5} />);
        const hearts = tree.UNSAFE_getAllByType(Path);
        expect(hearts[0].props.fill).toBe(AXM.rust);
        expect(hearts[1].props.fill).toBe(AXM.rust);
        expect(hearts[2].props.fill).toBe('none');
        expect(hearts[3].props.fill).toBe('none');
        expect(hearts[4].props.fill).toBe('none');
    });

    it('leaves every heart empty when value is 0 (default)', () => {
        const tree = render(<FriendshipMeter max={4} />);
        const hearts = tree.UNSAFE_getAllByType(Path);
        for (const heart of hearts) {
            expect(heart.props.fill).toBe('none');
        }
    });

    it('fills every heart when value === max', () => {
        const tree = render(<FriendshipMeter value={5} max={5} />);
        const hearts = tree.UNSAFE_getAllByType(Path);
        for (const heart of hearts) {
            expect(heart.props.fill).toBe(AXM.rust);
        }
    });
});

describe('FriendshipMeter: counter text', () => {
    it('shows `value/max` (defaults to 0/5)', () => {
        const tree = render(<FriendshipMeter />);
        expect(tree.queryByText('0/5')).not.toBeNull();
    });

    it('reflects custom value + max', () => {
        const tree = render(<FriendshipMeter value={3} max={7} />);
        expect(tree.queryByText('3/7')).not.toBeNull();
    });
});

describe('FriendshipMeter: compact branch', () => {
    it('hides the FRIEND section label when compact=true', () => {
        const tree = render(<FriendshipMeter compact />);
        expect(tree.queryByText('FRIEND')).toBeNull();
    });

    it('shows the FRIEND section label by default (compact=false)', () => {
        const tree = render(<FriendshipMeter />);
        expect(tree.queryByText('FRIEND')).not.toBeNull();
    });
});
