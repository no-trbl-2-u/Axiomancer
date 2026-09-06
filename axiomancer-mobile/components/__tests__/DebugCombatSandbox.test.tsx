/**
 * Hermetic component tests — DebugCombatSandbox.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - ASSEMBLE pushes /combat-encounter (historic testID kept for the
 *     upgradeable-dice e2e); TEACH pushes it with ?tutorial=1
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugCombatSandbox } from '@/components/DebugCombatSandbox';

const mockPush = jest.fn();
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

afterEach(() => {
    mockPush.mockClear();
    jest.restoreAllMocks();
});

describe('DebugCombatSandbox', () => {
    it('renders both launchers in dev', () => {
        const tree = render(<DebugCombatSandbox />);
        expect(tree.queryByTestId('debug-combat-encounter-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-combat-tutorial-button')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as unknown as { __DEV__: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            expect(render(<DebugCombatSandbox />).queryByTestId('debug-combat-encounter-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });

    it('ASSEMBLE and TEACH push the sandbox route', () => {
        const tree = render(<DebugCombatSandbox />);
        fireEvent.press(tree.getByTestId('debug-combat-encounter-button'));
        expect(mockPush).toHaveBeenCalledWith('/combat-encounter');
        fireEvent.press(tree.getByTestId('debug-combat-tutorial-button'));
        expect(mockPush).toHaveBeenCalledWith('/combat-encounter?tutorial=1');
    });
});
