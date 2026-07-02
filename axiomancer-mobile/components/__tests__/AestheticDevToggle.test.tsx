/**
 * Hermetic component tests — AestheticDevToggle (Phase 50 tick A).
 *
 * The dev-only sibling of the Debug* family. Pins the DEV gate,
 * the press routing into `useAesthetic().toggle`, and the
 * subtitle "mode: <mode>" reflecting the current aesthetic.
 * Coverage gap filed by `/iterate` 2026-05-20 after the rest of
 * the Debug* family already had colocated tests.
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { AestheticDevToggle } from '@/components/AestheticDevToggle';
import { AestheticModeProvider } from '@/state/aesthetic-mode';

afterEach(() => {
    // No global state to reset — `skipHydration` keeps the test
    // self-contained in each render.
});

function withProvider(child: React.ReactNode, initialMode: 'canonical' | 'codex' = 'canonical') {
    return (
        <AestheticModeProvider skipHydration initialMode={initialMode}>
            {child}
        </AestheticModeProvider>
    );
}

describe('AestheticDevToggle: DEV gate', () => {
    it('renders the FLIP button when __DEV__ is true (jest default)', () => {
        const tree = render(withProvider(<AestheticDevToggle />));
        expect(tree.queryByText('FLIP')).not.toBeNull();
        expect(tree.queryByText('AESTHETIC · DEV')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {

        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(withProvider(<AestheticDevToggle />));
            expect(tree.queryByText('FLIP')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('AestheticDevToggle: subtitle', () => {
    it('shows the current mode in the subtitle line', () => {
        const tree = render(withProvider(<AestheticDevToggle />, 'canonical'));
        expect(tree.queryByText('mode: canonical')).not.toBeNull();
    });

    it('reflects an alternate initial mode (codex)', () => {
        const tree = render(withProvider(<AestheticDevToggle />, 'codex'));
        expect(tree.queryByText('mode: codex')).not.toBeNull();
    });
});

describe('AestheticDevToggle: press routing', () => {
    it('FLIP toggles canonical → codex', () => {
        const tree = render(withProvider(<AestheticDevToggle />, 'canonical'));
        expect(tree.queryByText('mode: canonical')).not.toBeNull();

        fireEvent.press(tree.getByText('FLIP'));

        expect(tree.queryByText('mode: codex')).not.toBeNull();
        expect(tree.queryByText('mode: canonical')).toBeNull();
    });

    it('FLIP toggles codex → canonical', () => {
        const tree = render(withProvider(<AestheticDevToggle />, 'codex'));
        fireEvent.press(tree.getByText('FLIP'));
        expect(tree.queryByText('mode: canonical')).not.toBeNull();
    });

    it('repeated FLIPs cycle without crashing', () => {
        const tree = render(withProvider(<AestheticDevToggle />, 'canonical'));
        expect(() => {
            fireEvent.press(tree.getByText('FLIP'));
            fireEvent.press(tree.getByText('FLIP'));
            fireEvent.press(tree.getByText('FLIP'));
        }).not.toThrow();
        // Odd-count flips land on codex.
        expect(tree.queryByText('mode: codex')).not.toBeNull();
    });
});

describe('AestheticDevToggle: accessibility', () => {
    it('exposes accessibilityRole=button and a label naming the current mode', () => {
        const tree = render(withProvider(<AestheticDevToggle />, 'canonical'));
        const btn = tree.getByLabelText(/Toggle aesthetic mode/);
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/canonical/);
    });
});
