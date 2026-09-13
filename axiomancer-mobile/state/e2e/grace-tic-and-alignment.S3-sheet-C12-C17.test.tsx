/**
 * Hermetic screen tests — the GRACE break tic and the alignment line
 * (clusters S3-sheet-C12 and S3-sheet-C17).
 *
 * S3-sheet-C12: a red tic sits at the arrears threshold on both grace tracks
 * (the exploration HUD's StatusCard and the SELF sheet's POOLS panel) and
 * nothing named it, so it read as a notch in the bar. Both tracks now carry
 * the presenter's legend line.
 *
 * S3-sheet-C17: the sheet's identity column is ~106pt wide and clamped the
 * alignment cell name to one line, cutting 'Agnostic-Pessimistic-Transcendent'
 * to 'Agnostic-…' with no other surface carrying the rest.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import CharacterScreen from '@/app/(tabs)/character';
import { StatusCard } from '@/components/StatusCard';
import { graceBreakLegend } from '@/state/presenters/character.engine';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Hoisted above the imports by babel-plugin-jest-hoist: the SELF sheet pulls
// in the router for its deck link.
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
}));

/** Axis values that bucket to (mid, low, high) — the longest cell label in the
 *  27-cell library, 'Agnostic-Pessimistic-Transcendent'. */
const LONGEST_ALIGNMENT = { epistemology: 0, outlook: -100, scope: 100 };

function seededStore(): AppStore {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    store.setState({ philosophicalAlignment: LONGEST_ALIGNMENT });
    return store;
}

describe('GRACE break tic carries a key (S3-sheet-C12)', () => {
    it('words the tic as the arrears threshold', () => {
        expect(graceBreakLegend(2)).toContain('arrears');
        expect(graceBreakLegend(2)).toContain('2');
    });

    it('labels the tic on the exploration HUD grace track', () => {
        const { tree } = withAllProviders(<StatusCard />);
        const r = render(tree);

        expect(r.getByTestId('status-grace-break-legend').props.children).toBe(
            graceBreakLegend(2),
        );
    });

    it('labels the tic on the SELF sheet grace track', () => {
        const { tree } = withAllProviders(<CharacterScreen />);
        const r = render(tree);

        expect(r.getByTestId('self-grace-break-legend').props.children).toBe(
            graceBreakLegend(2),
        );
    });
});

describe('SELF sheet alignment line (S3-sheet-C17)', () => {
    it('renders the whole alignment cell name, unclamped', () => {
        const { tree } = withAllProviders(<CharacterScreen />, { store: seededStore() });
        const r = render(tree);

        const line = r.getByTestId('self-identity-alignment');
        expect(line.props.children).toBe('Agnostic-Pessimistic-Transcendent');
        // No one-line clamp: the column wraps the name on its own hyphens
        // rather than ellipsing the last two thirds of it away.
        expect(line.props.numberOfLines).toBeUndefined();
    });
});
