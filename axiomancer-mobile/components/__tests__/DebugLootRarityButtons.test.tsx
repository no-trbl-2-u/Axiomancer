/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { DebugLootRarityButtons } from '../DebugLootRarityButtons';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { isDevToolsEnabled } from '@/lib/buildProfile';

jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
}));

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

describe('DebugLootRarityButtons', () => {
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
                <DebugLootRarityButtons />
            </GameStoreProvider>,
        );
        expect(toJSON()).toBe(null);
    });

    it('loots a real common drop and surfaces its modifier count', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugLootRarityButtons />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.press(getByTestId('debug-loot-common-button'));

        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
        const text = getByTestId('debug-loot-rarity-feedback').props.children as string;
        expect(text).toContain('looted common');
        expect(text).toMatch(/\d+ mods?/);
    });

    it('loots a real uncommon drop and surfaces its modifier count', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugLootRarityButtons />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.press(getByTestId('debug-loot-uncommon-button'));

        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
        const text = getByTestId('debug-loot-rarity-feedback').props.children as string;
        expect(text).toContain('looted uncommon');
        expect(text).toMatch(/\d+ mods?/);
    });

    it('loots a real rare drop and surfaces its modifier count', () => {
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugLootRarityButtons />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.press(getByTestId('debug-loot-rare-button'));

        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
        const text = getByTestId('debug-loot-rarity-feedback').props.children as string;
        expect(text).toContain('looted rare');
        expect(text).toMatch(/\d+ mods?/);
    });

    it('loots a unique relic and surfaces its modifier count', () => {
        store.setState({ player: { ...store.getState().player, level: 30 } });
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugLootRarityButtons />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.press(getByTestId('debug-loot-unique-button'));

        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
        const text = getByTestId('debug-loot-rarity-feedback').props.children as string;
        expect(text).toContain('looted unique');
        expect(text).toMatch(/3 mods/);
    });

    it('renders a graceful failure reason when no drop can be generated', () => {
        store.setState({ player: { ...store.getState().player, level: 0 } });
        const { getByTestId } = render(
            <GameStoreProvider store={store}>
                <DebugLootRarityButtons />
            </GameStoreProvider>,
        );

        const before = store.getState().player.inventory?.length ?? 0;
        fireEvent.press(getByTestId('debug-loot-uncommon-button'));

        expect(store.getState().player.inventory?.length ?? 0).toBe(before);
        const text = getByTestId('debug-loot-rarity-feedback').props.children as string;
        expect(text).toContain('level 0');
    });
});
