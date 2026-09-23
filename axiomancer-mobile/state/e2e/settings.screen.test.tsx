/**
 * Hermetic E2E — the `/settings` screen (owner call 2026-09-23) over its
 * own settings store and an in-memory slot store.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import SettingsScreen from '@/app/settings/index';
import { createMemorySlotStore } from '@/state/persistence/memorySlotStore';
import { DEFAULT_SETTINGS, createSettingsStore } from '@/state/settings';
import { createAppStore } from '@/state/store';
import { COMBAT_TUTORIAL_FLAG } from '@/state/tutorials';
import { withAllProviders } from '@/test-utils/withAllProviders';

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: mockBack, canGoBack: () => true }),
    useLocalSearchParams: () => ({}),
}));

afterEach(() => {
    jest.clearAllMocks();
});

const NO_STORAGE = { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined };

function mount(inRun: boolean) {
    const slots = createMemorySlotStore({ activeSlot: inRun ? 1 : null });
    const store = createAppStore({ adapter: slots });
    const settings = createSettingsStore({ storage: NO_STORAGE });
    const { tree } = withAllProviders(<SettingsScreen />, { store, slots, settings });
    render(tree);
    return { store, slots, settings };
}

describe('/settings', () => {
    it('renders every player row, with the theme picker expanded', () => {
        mount(false);
        expect(screen.getByTestId('theme-switcher')).toBeTruthy();
        expect(screen.getByTestId('theme-ashen-gold')).toBeTruthy();
        for (const id of ['settings-text-scale', 'settings-reduced-motion', 'settings-haptics', 'settings-tutorial-hints', 'settings-music', 'settings-sfx', 'settings-story-mode', 'settings-reset']) {
            expect(screen.getByTestId(id)).toBeTruthy();
        }
        // Story mode is listed but not yet a choice.
        expect(screen.getByTestId('settings-story-mode').props.accessibilityState?.disabled).toBe(true);
        // Run-only rows are absent outside a run.
        expect(screen.queryByTestId('settings-reset-tutorials')).toBeNull();
        expect(screen.queryByTestId('settings-return-to-title')).toBeNull();
    });

    it('segmented rows write the settings store', () => {
        const { settings } = mount(false);
        act(() => { fireEvent.press(screen.getByTestId('settings-text-scale-1.3')); });
        act(() => { fireEvent.press(screen.getByTestId('settings-reduced-motion-on')); });
        act(() => { fireEvent.press(screen.getByTestId('settings-haptics-false')); });
        act(() => { fireEvent.press(screen.getByTestId('settings-tutorial-hints-false')); });
        expect(settings.get()).toEqual({ ...DEFAULT_SETTINGS, textScale: 1.3, reducedMotion: 'on', haptics: false, tutorialHints: false });
    });

    it('volume steppers move by 10 and clamp', () => {
        const { settings } = mount(false);
        act(() => { fireEvent.press(screen.getByTestId('settings-music-up')); });
        expect(settings.get().musicVolume).toBe(DEFAULT_SETTINGS.musicVolume + 10);
        expect(screen.getByTestId('settings-music-value').props.children).toBe(`${DEFAULT_SETTINGS.musicVolume + 10}%`);
        for (let i = 0; i < 12; i++) act(() => { fireEvent.press(screen.getByTestId('settings-sfx-down')); });
        expect(settings.get().sfxVolume).toBe(0);
    });

    it('RESET SETTINGS asks, then restores the defaults', () => {
        const { settings } = mount(false);
        settings.set({ haptics: false, textScale: 0.9 });
        act(() => { fireEvent.press(screen.getByTestId('settings-reset')); });
        act(() => { fireEvent.press(screen.getByTestId('settings-reset-confirm-confirm')); });
        expect(settings.get()).toEqual(DEFAULT_SETTINGS);
    });

    it('inside a run: RESET TUTORIALS strips the coach flags; RETURN TO TITLE saves and lands on the menu', async () => {
        const { store, slots } = mount(true);
        store.setState({ flags: [COMBAT_TUTORIAL_FLAG, 'keepsake'] } as never);

        act(() => { fireEvent.press(screen.getByTestId('settings-reset-tutorials')); });
        expect(store.getState().flags).toEqual(['keepsake']);

        await act(async () => { fireEvent.press(screen.getByTestId('settings-return-to-title')); });
        expect(slots.readSlot(1)?.flags).toEqual(['keepsake']);
        expect(mockReplace).toHaveBeenCalledWith('/?menu=1');
    });

    it('the back control pops the screen', () => {
        mount(false);
        act(() => { fireEvent.press(screen.getByTestId('settings-back')); });
        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});
