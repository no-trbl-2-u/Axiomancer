/**
 * Hermetic component tests — DevToolsSections (the `/dev` body).
 *
 * Pins the collapse contract, not the leaves:
 *   - DEV gate (production renders nothing)
 *   - Every section starts closed, and a closed section mounts no leaf
 *   - A header tap opens its own section and leaves the others closed
 *   - Leaving and re-entering `/dev` starts closed again
 *
 * The last case is the regression guard. `open` used to live in a
 * module-scope Set so it outlived the route for the life of the app: one
 * session of poking left every header open on every later visit. It is
 * route-local state now, and this suite fails if it is hoisted back.
 *
 * The leaves are `React.lazy`, and its dynamic `import()` throws under
 * Jest's VM without `--experimental-vm-modules` (the constraint the
 * dev-route suite works around by mocking this whole component). Here the
 * component IS the unit, so `React.lazy` is stubbed to a marker instead:
 * each leaf renders as `dev-leaf`, which makes "the body mounted" and "the
 * body did not" directly assertable. Leaf behaviour lives in each leaf's
 * own suite.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
    getBuildProfile: jest.fn(() => null),
}));

// Stub `React.lazy` so the leaves never reach a dynamic `import()`; every
// leaf becomes one `dev-leaf` marker, so an open body is countable.
jest.mock('react', () => {
    const actual = jest.requireActual('react') as typeof import('react');
    const RN = require('react-native');
    const DevLeaf = () => actual.createElement(RN.View, { testID: 'dev-leaf' });
    return { ...actual, lazy: () => DevLeaf, default: { ...actual, lazy: () => DevLeaf } };
});

import { DevToolsSections } from '@/components/dev/DevToolsSections';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { withAllProviders } from '@/test-utils/withAllProviders';

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

/** Every section key the body renders, in top-down order. */
const SECTION_KEYS = [
    'state',
    'player',
    'decks',
    'cards',
    'world',
    'encounters',
    'rewards',
    'story',
    'run',
] as const;

/** `aria-expanded` reaches the host view as `accessibilityState.expanded`. */
function expanded(node: { props: { accessibilityState?: { expanded?: boolean } } }) {
    return node.props.accessibilityState?.expanded;
}

function mount() {
    const { tree } = withAllProviders(<DevToolsSections />);
    return render(tree);
}

describe('DevToolsSections: DEV gate', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders nothing outside dev builds', () => {
        mockIsDevToolsEnabled.mockReturnValue(false);
        const r = mount();
        expect(r.queryByTestId('dev-tools-sections')).toBeNull();
    });
});

describe('DevToolsSections: collapse', () => {
    beforeEach(() => {
        mockIsDevToolsEnabled.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders every section, all closed, with no leaf mounted', () => {
        const r = mount();
        expect(r.queryByTestId('dev-tools-sections')).not.toBeNull();
        for (const key of SECTION_KEYS) {
            expect(expanded(r.getByTestId(`dev-section-${key}-toggle`))).toBe(false);
        }
        expect(r.queryAllByTestId('dev-leaf')).toHaveLength(0);
    });

    it('opens only the tapped section', () => {
        const r = mount();
        fireEvent.press(r.getByTestId('dev-section-state-toggle'));

        expect(expanded(r.getByTestId('dev-section-state-toggle'))).toBe(true);
        for (const key of SECTION_KEYS.filter((k) => k !== 'state')) {
            expect(expanded(r.getByTestId(`dev-section-${key}-toggle`))).toBe(false);
        }
        // STATE holds exactly one leaf, and only it mounted.
        expect(r.queryAllByTestId('dev-leaf')).toHaveLength(1);
    });

    it('closes the section again on a second tap', () => {
        const r = mount();
        fireEvent.press(r.getByTestId('dev-section-state-toggle'));
        fireEvent.press(r.getByTestId('dev-section-state-toggle'));

        expect(expanded(r.getByTestId('dev-section-state-toggle'))).toBe(false);
        expect(r.queryAllByTestId('dev-leaf')).toHaveLength(0);
    });

    it('starts closed again after leaving and re-entering the route', () => {
        const first = mount();
        fireEvent.press(first.getByTestId('dev-section-state-toggle'));
        fireEvent.press(first.getByTestId('dev-section-world-toggle'));
        expect(expanded(first.getByTestId('dev-section-state-toggle'))).toBe(true);
        expect(expanded(first.getByTestId('dev-section-world-toggle'))).toBe(true);
        first.unmount();

        const second = mount();
        for (const key of SECTION_KEYS) {
            expect(expanded(second.getByTestId(`dev-section-${key}-toggle`))).toBe(false);
        }
        expect(second.queryAllByTestId('dev-leaf')).toHaveLength(0);
    });
});
