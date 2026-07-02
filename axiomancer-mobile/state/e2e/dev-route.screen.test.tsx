/**
 * Hermetic E2E — dedicated dev-tools route (Phase 132).
 *
 * Pins the dev menu tab extraction at the route-shell level:
 *   - The `/dev` route renders its header + the grouped-sections
 *     container in dev builds (controls moved off the SELF dropdown).
 *   - Non-dev / production builds render an inert placeholder and mount
 *     no dev-tools surface.
 *
 * `DevToolsSections` is mocked to a synchronous marker. Its real
 * implementation wraps the Debug* leaves in `React.lazy`, whose dynamic
 * `import()` can't resolve under Jest's VM (same constraint the
 * DebugComponentsLazy suite works around) — so the route shell is the
 * unit under test here, and the section grouping is asserted via the
 * mock's presence/absence. Leaf behaviour lives in each leaf's own suite.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
}));

jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
    getBuildProfile: jest.fn(() => null),
}));

jest.mock('@/components/dev/DevToolsSections', () => {
    const RN = require('react-native');
    const ReactLocal = require('react');
    return {
        DevToolsSections: () =>
            ReactLocal.createElement(RN.View, { testID: 'dev-tools-sections-mock' }),
    };
});

import DevToolsScreen from '@/app/dev/index';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { withAllProviders } from '@/test-utils/withAllProviders';

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

function mount() {
    const { tree } = withAllProviders(<DevToolsScreen />);
    return render(tree);
}

describe('dev route — dev build', () => {
    beforeEach(() => {
        mockIsDevToolsEnabled.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the dev tools header', () => {
        const r = mount();
        expect(r.getByText('DEV TOOLS')).toBeTruthy();
        expect(r.queryByTestId('dev-route-disabled')).toBeNull();
    });

    it('mounts the grouped dev-tools sections surface', () => {
        const r = mount();
        expect(r.queryByTestId('dev-tools-sections-mock')).not.toBeNull();
    });
});

describe('dev route — production build', () => {
    beforeEach(() => {
        mockIsDevToolsEnabled.mockReturnValue(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders an inert placeholder with no dev-tools surface', () => {
        const r = mount();
        expect(r.queryByTestId('dev-route-disabled')).not.toBeNull();
        expect(r.queryByText('DEV TOOLS')).toBeNull();
        expect(r.queryByTestId('dev-tools-sections-mock')).toBeNull();
    });
});
