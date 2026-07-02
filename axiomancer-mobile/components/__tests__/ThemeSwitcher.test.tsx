/**
 * Hermetic component tests — ThemeSwitcher (player-facing colour-theme switcher).
 *
 * Tests the appearance-switcher logic on the SELF/character tab:
 *   - collapsed-by-default gate (no swatch grid, Expand chevron + label)
 *   - expand/collapse toggle (chevron, accessibilityState, label flip)
 *   - active-theme header readout
 *   - one swatch per registered theme rendered when expanded
 *   - active vs inactive swatch accessibility (selected state + label)
 *   - setActiveTheme press switching the live active theme
 *
 * THEME_ORDER / THEME_SPECS / getActiveThemeId are read at runtime and the
 * theme is reset to DEFAULT_THEME_ID in afterEach so the suite survives
 * theme-content churn.
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DEFAULT_THEME_ID, THEME_ORDER, THEME_SPECS } from '@/theme/palette';
import { getActiveThemeId, setActiveTheme } from '@/theme/runtime';

afterEach(() => {
    setActiveTheme(DEFAULT_THEME_ID);
});

describe('ThemeSwitcher: collapsed default', () => {
    it('mounts the section with its testID and header label', () => {
        const tree = render(<ThemeSwitcher />);
        expect(tree.queryByTestId('theme-switcher')).not.toBeNull();
        expect(tree.queryByTestId('theme-switcher-toggle')).not.toBeNull();
        expect(tree.queryByText('COLOUR THEME')).not.toBeNull();
    });

    it('renders collapsed by default — no swatch grid, Expand chevron', () => {
        const tree = render(<ThemeSwitcher />);
        for (const id of THEME_ORDER) {
            expect(tree.queryByTestId(`theme-${id}`)).toBeNull();
        }
        const toggle = tree.getByTestId('theme-switcher-toggle');
        expect(toggle.props.accessibilityState).toEqual({ expanded: false });
        expect(toggle.props.accessibilityLabel).toContain('Expand to change');
        expect(tree.queryByText('▸')).not.toBeNull();
    });

    it('shows the active theme name in the header readout', () => {
        setActiveTheme(DEFAULT_THEME_ID);
        const tree = render(<ThemeSwitcher />);
        expect(tree.queryByText(THEME_SPECS[DEFAULT_THEME_ID].name)).not.toBeNull();
    });
});

describe('ThemeSwitcher: expand / collapse toggle', () => {
    it('renders expanded when initialExpanded is set', () => {
        const tree = render(<ThemeSwitcher initialExpanded />);
        const toggle = tree.getByTestId('theme-switcher-toggle');
        expect(toggle.props.accessibilityState).toEqual({ expanded: true });
        expect(toggle.props.accessibilityLabel).toContain('Collapse to change');
        expect(tree.queryByText('▾')).not.toBeNull();
        for (const id of THEME_ORDER) {
            expect(tree.queryByTestId(`theme-${id}`)).not.toBeNull();
        }
    });

    it('expands on toggle press and collapses again', () => {
        const tree = render(<ThemeSwitcher />);
        const sampleId = THEME_ORDER[0];
        expect(tree.queryByTestId(`theme-${sampleId}`)).toBeNull();

        fireEvent.press(tree.getByTestId('theme-switcher-toggle'));
        expect(tree.queryByTestId(`theme-${sampleId}`)).not.toBeNull();
        expect(tree.getByTestId('theme-switcher-toggle').props.accessibilityState).toEqual({
            expanded: true,
        });

        fireEvent.press(tree.getByTestId('theme-switcher-toggle'));
        expect(tree.queryByTestId(`theme-${sampleId}`)).toBeNull();
    });
});

describe('ThemeSwitcher: swatch grid', () => {
    it('renders one swatch per registered theme when expanded', () => {
        const tree = render(<ThemeSwitcher initialExpanded />);
        for (const id of THEME_ORDER) {
            const swatch = tree.queryByTestId(`theme-${id}`);
            expect(swatch).not.toBeNull();
            expect(tree.queryAllByText(THEME_SPECS[id].name).length).toBeGreaterThan(0);
        }
    });

    it('marks the active swatch selected and labels it active', () => {
        setActiveTheme(DEFAULT_THEME_ID);
        const tree = render(<ThemeSwitcher initialExpanded />);
        const inactiveId = THEME_ORDER.find((id) => id !== DEFAULT_THEME_ID)!;

        const active = tree.getByTestId(`theme-${DEFAULT_THEME_ID}`);
        const inactive = tree.getByTestId(`theme-${inactiveId}`);

        expect(active.props.accessibilityState).toEqual({ selected: true });
        expect(active.props.accessibilityLabel).toBe(
            `Theme ${THEME_SPECS[DEFAULT_THEME_ID].name}, active`
        );
        expect(inactive.props.accessibilityState).toEqual({ selected: false });
        expect(inactive.props.accessibilityLabel).toBe(`Theme ${THEME_SPECS[inactiveId].name}`);
    });
});

describe('ThemeSwitcher: selection wiring', () => {
    it('switches the live active theme when a swatch is pressed', () => {
        setActiveTheme(DEFAULT_THEME_ID);
        const tree = render(<ThemeSwitcher initialExpanded />);
        const targetId = THEME_ORDER.find((id) => id !== DEFAULT_THEME_ID)!;

        expect(getActiveThemeId()).toBe(DEFAULT_THEME_ID);
        fireEvent.press(tree.getByTestId(`theme-${targetId}`));
        expect(getActiveThemeId()).toBe(targetId);
    });
});
