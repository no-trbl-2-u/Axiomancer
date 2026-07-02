/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { DebugAddItemById } from '../DebugAddItemById';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { isDevToolsEnabled } from '@/lib/buildProfile';

jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
}));

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

describe('DebugAddItemById', () => {
    let store: ReturnType<typeof createAppStore>;

    beforeEach(() => {
        store = createAppStore();
        mockIsDevToolsEnabled.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when dev tools are disabled', () => {
        mockIsDevToolsEnabled.mockReturnValue(false);
        const { toJSON } = render(
            <GameStoreProvider store={store}>
                <DebugAddItemById />
            </GameStoreProvider>,
        );
        expect(toJSON()).toBe(null);
    });

    it('adds a valid item id and shows success feedback', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugAddItemById />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.changeText(getByTestId('debug-add-item-input'), 'steel-blade');
        fireEvent.press(getByTestId('debug-add-item-button'));

        expect((store.getState().player.inventory?.length ?? 0)).toBe(before + 1);
        expect(getByTestId('debug-add-item-feedback').props.children).toContain('added');
    });

    it('shows graceful failure for an unknown id', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugAddItemById />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.changeText(getByTestId('debug-add-item-input'), 'not-a-real-item');
        fireEvent.press(getByTestId('debug-add-item-button'));

        expect((store.getState().player.inventory?.length ?? 0)).toBe(before);
        expect(getByTestId('debug-add-item-feedback').props.children).toContain('unknown');
    });
});
