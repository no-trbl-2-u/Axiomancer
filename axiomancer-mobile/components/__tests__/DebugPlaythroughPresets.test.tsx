/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { DebugPlaythroughPresets } from '../DebugPlaythroughPresets';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { isDevToolsEnabled } from '@/lib/buildProfile';

// Mock the dev tools check
jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
}));

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

describe('DebugPlaythroughPresets', () => {
    let mockStore: ReturnType<typeof createAppStore>;

    beforeEach(() => {
        mockStore = createAppStore();
        mockIsDevToolsEnabled.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when dev tools are disabled', () => {
        mockIsDevToolsEnabled.mockReturnValue(false);
        
        const { toJSON } = render(
            <GameStoreProvider store={mockStore}>
                <DebugPlaythroughPresets />
            </GameStoreProvider>
        );

        expect(toJSON()).toBe(null);
    });

    it('renders preset buttons when dev tools are enabled', () => {
        const { getByTestId, getByText } = render(
            <GameStoreProvider store={mockStore}>
                <DebugPlaythroughPresets />
            </GameStoreProvider>
        );

        expect(getByText('DEBUG · PLAYTHROUGHS')).toBeTruthy();
        expect(getByText('state seeding for test coverage')).toBeTruthy();
        expect(getByTestId('debug-preset-fresh')).toBeTruthy();
        expect(getByTestId('debug-preset-endgame')).toBeTruthy();
        expect(getByText('FRESH START')).toBeTruthy();
        expect(getByText('ENDGAME')).toBeTruthy();
    });

    it('applies fresh start preset correctly', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={mockStore}>
                <DebugPlaythroughPresets />
            </GameStoreProvider>
        );

        const freshButton = getByTestId('debug-preset-fresh');
        fireEvent.press(freshButton);

        const state = mockStore.getState();
        expect(state.player.level).toBe(1);
        expect(state.player.experience).toBe(0);
        expect(state.player.baseStats).toEqual({ heart: 3, body: 3, mind: 3 });
        expect(state.player.knownSkills).toEqual([]);
        expect(state.player.currency).toBe(0);
        expect(state.player.inventory).toEqual([]);
    });

    it('applies endgame preset correctly', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={mockStore}>
                <DebugPlaythroughPresets />
            </GameStoreProvider>
        );

        const endgameButton = getByTestId('debug-preset-endgame');
        fireEvent.press(endgameButton);

        const state = mockStore.getState();
        expect(state.player.level).toBe(20);
        expect(state.player.experience).toBe(20000);
        expect(state.player.baseStats).toEqual({ heart: 15, body: 15, mind: 15 });
        expect(state.player.knownSkills).toContain('sorites-cascade');
        expect(state.player.knownSkills).toContain('bootstrap-paradox');
        expect(state.player.currency).toBe(500);
        expect(state.player.inventory.length).toBeGreaterThan(0);
    });

    it('updates active state when presets are applied', () => {
        const { getByTestId, getByText } = render(
            <GameStoreProvider store={mockStore}>
                <DebugPlaythroughPresets />
            </GameStoreProvider>
        );

        const freshButton = getByTestId('debug-preset-fresh');
        fireEvent.press(freshButton);

        expect(getByText('applied · fresh start')).toBeTruthy();

        const endgameButton = getByTestId('debug-preset-endgame');
        fireEvent.press(endgameButton);

        expect(getByText('applied · endgame start')).toBeTruthy();
    });

    it('has correct accessibility properties', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={mockStore}>
                <DebugPlaythroughPresets />
            </GameStoreProvider>
        );

        const freshButton = getByTestId('debug-preset-fresh');
        const endgameButton = getByTestId('debug-preset-endgame');

        expect(freshButton.props.accessibilityRole).toBe('button');
        expect(freshButton.props.accessibilityLabel).toBe('Apply fresh start preset (level 1, minimal gear)');
        
        expect(endgameButton.props.accessibilityRole).toBe('button');
        expect(endgameButton.props.accessibilityLabel).toBe('Apply endgame preset (max level, all skills/items)');
    });
});