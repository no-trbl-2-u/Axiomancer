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
import { SCREEN_ART_KEYS, screenBackdropFor } from '@/assets/images/screens';

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

describe('ScreenBg: the backdrop art slot (phase V5)', () => {
    it('mounts no image when no art key is passed — screens opt IN', () => {
        // The default must stay exactly what every screen had before V5: a
        // backdrop under a dense table is noise, so silence is the default.
        const tree = render(<ScreenBg><Text>x</Text></ScreenBg>);
        expect(tree.queryByTestId('screen-backdrop')).toBeNull();
    });

    it('mounts the plate behind the children for a known key', () => {
        const tree = render(<ScreenBg art="event"><Text testID="kid">x</Text></ScreenBg>);
        expect(tree.queryByTestId('screen-backdrop')).not.toBeNull();
        expect(tree.queryByTestId('kid')).not.toBeNull();
    });

    it('dims the plate rather than blurring it', () => {
        // "Dim, never blur" — the treatment MapCanvas proved. A blur would
        // soften the engraving lines that are the whole point of the look.
        const tree = render(<ScreenBg art="labyrinth"><Text>x</Text></ScreenBg>);
        const plate = tree.getByTestId('screen-backdrop');
        const style = Array.isArray(plate.props.style)
            ? Object.assign({}, ...plate.props.style)
            : plate.props.style;
        expect(style.opacity).toBeLessThanOrEqual(0.25);
        expect(plate.props.contentFit).toBe('cover');
        expect(style.blurRadius).toBeUndefined();
    });

    it('renders children in both branches with art present', () => {
        const scrolling = render(<ScreenBg art="event"><Text testID="a">x</Text></ScreenBg>);
        expect(scrolling.queryByTestId('a')).not.toBeNull();
        const fixed = render(
            <ScreenBg art="event" scrollable={false}><Text testID="b">y</Text></ScreenBg>,
        );
        expect(fixed.queryByTestId('b')).not.toBeNull();
    });
});

describe('the screen art resolver', () => {
    it('every wired key resolves to a registered asset', () => {
        expect(SCREEN_ART_KEYS.length).toBeGreaterThan(0);
        for (const key of SCREEN_ART_KEYS) {
            expect(screenBackdropFor(key)).not.toBeNull();
        }
    });

    it('an absent key is null, not a throw', () => {
        expect(screenBackdropFor(undefined)).toBeNull();
        expect(screenBackdropFor(null)).toBeNull();
    });
});
