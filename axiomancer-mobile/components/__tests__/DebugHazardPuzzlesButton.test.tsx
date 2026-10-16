/**
 * Hermetic component tests — DebugHazardPuzzlesButton (A14): the dev gate,
 * and a tap pushes the HAZARD PUZZLES board route.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugHazardPuzzlesButton } from '@/components/DebugHazardPuzzlesButton';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
}));

const mockDevTools = jest.fn(() => true);
jest.mock('@/lib/buildProfile', () => ({
    ...(jest.requireActual('@/lib/buildProfile') as object),
    isDevToolsEnabled: () => mockDevTools(),
}));

afterEach(() => {
    mockPush.mockClear();
    mockDevTools.mockReturnValue(true);
});

function renderButton() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return render(
        <GameStoreProvider store={store}>
            <DebugHazardPuzzlesButton />
        </GameStoreProvider>,
    );
}

describe('DebugHazardPuzzlesButton', () => {
    it('renders in a dev build, named for the board', () => {
        const tree = renderButton();
        expect(tree.getByTestId('debug-hazard-puzzles-button')).toBeTruthy();
        expect(tree.getByText('DEBUG · HAZARD PUZZLES')).toBeTruthy();
    });

    it('a tap opens /devpuzzle', () => {
        const tree = renderButton();
        fireEvent.press(tree.getByTestId('debug-hazard-puzzles-button'));
        expect(mockPush).toHaveBeenCalledWith('/devpuzzle');
    });

    it('renders null when dev tools are disabled', () => {
        mockDevTools.mockReturnValue(false);
        expect(renderButton().queryByTestId('debug-hazard-puzzles-button')).toBeNull();
    });
});
