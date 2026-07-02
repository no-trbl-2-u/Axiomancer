/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { DebugPlayerTierPresets } from '../DebugPlayerTierPresets';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { isDevToolsEnabled } from '@/lib/buildProfile';

jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
}));

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

describe('DebugPlayerTierPresets', () => {
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
                <DebugPlayerTierPresets />
            </GameStoreProvider>,
        );
        expect(toJSON()).toBe(null);
    });

    it('renders the four tier buttons', () => {
        const { getByTestId, getByText } = render(
            <GameStoreProvider store={store}>
                <DebugPlayerTierPresets />
            </GameStoreProvider>,
        );
        expect(getByText('DEBUG · PLAYER TIER')).toBeTruthy();
        expect(getByTestId('debug-player-tier-kid-l1')).toBeTruthy();
        expect(getByTestId('debug-player-tier-kid-l15')).toBeTruthy();
        expect(getByTestId('debug-player-tier-kid-l30')).toBeTruthy();
        expect(getByTestId('debug-player-tier-kid-l50')).toBeTruthy();
    });

    it('applies a tier preset and rebuilds the player at that level', () => {
        const { getByTestId, getByText } = render(
            <GameStoreProvider store={store}>
                <DebugPlayerTierPresets />
            </GameStoreProvider>,
        );

        fireEvent.press(getByTestId('debug-player-tier-kid-l30'));

        expect(store.getState().player.level).toBe(30);
        expect(getByText('applied · L30 (lvl 30)')).toBeTruthy();
    });
});
