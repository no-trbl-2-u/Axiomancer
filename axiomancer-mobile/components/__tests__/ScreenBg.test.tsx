/**
 * Hermetic component tests — ScreenBg (universal screen
 * wrapper). Pins the children-pass-through behavior + the
 * `scrollable` prop branch (default true → ScrollView; false
 * → fixed View).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ScrollView, Text } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';

describe('ScreenBg: children rendering', () => {
    it('renders the passed children', () => {
        const tree = render(
            <ScreenBg>
                <Text testID="child">contents</Text>
            </ScreenBg>,
        );
        expect(tree.queryByTestId('child')).not.toBeNull();
        expect(tree.queryByText('contents')).not.toBeNull();
    });

    it('renders multiple children', () => {
        const tree = render(
            <ScreenBg>
                <Text testID="first">one</Text>
                <Text testID="second">two</Text>
            </ScreenBg>,
        );
        expect(tree.queryByTestId('first')).not.toBeNull();
        expect(tree.queryByTestId('second')).not.toBeNull();
    });
});

describe('ScreenBg: scrollable branch', () => {
    it('mounts a ScrollView by default (scrollable=true)', () => {
        const tree = render(
            <ScreenBg>
                <Text>contents</Text>
            </ScreenBg>,
        );
        expect(tree.UNSAFE_queryByType(ScrollView)).not.toBeNull();
    });

    it('mounts a ScrollView when scrollable is explicitly true', () => {
        const tree = render(
            <ScreenBg scrollable>
                <Text>contents</Text>
            </ScreenBg>,
        );
        expect(tree.UNSAFE_queryByType(ScrollView)).not.toBeNull();
    });

    it('omits the ScrollView when scrollable is false (fixed-height surfaces)', () => {
        const tree = render(
            <ScreenBg scrollable={false}>
                <Text>contents</Text>
            </ScreenBg>,
        );
        expect(tree.UNSAFE_queryByType(ScrollView)).toBeNull();
        // Children still mount in the fixed View.
        expect(tree.queryByText('contents')).not.toBeNull();
    });

    it('hides the scrollbar indicator on the ScrollView (matches design)', () => {
        const tree = render(
            <ScreenBg>
                <Text>contents</Text>
            </ScreenBg>,
        );
        const scroll = tree.UNSAFE_getByType(ScrollView);
        expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
    });
});
