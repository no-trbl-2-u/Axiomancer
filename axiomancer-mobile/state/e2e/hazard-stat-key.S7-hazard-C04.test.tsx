/**
 * S7-hazard-C04 — the deck screen must key the marks its cards print.
 *
 * Every hazard card carries two unnamed glyph-and-number pairs. The
 * board keys them with its labelled FORCE / ESCAPE meters; the deck
 * screen had no such legend, so the numbers there were unreadable. A
 * `HazardStatKey` now sits above the card grid and under the card in
 * the tap-to-read overlay.
 *
 * The suite pins what the finding is about — the key renders with both
 * names on the deck screen, and follows the player into the card detail
 * overlay that covers it.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
}));

import HazardDeckScreen from '@/app/hazard-deck/index';
import { HAZARD_STAT_KEY } from '@/state/presenters/hazard.engine';
import type { AppStore } from '@/state/store';
import { appendAcquiredCard } from '@mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

afterEach(() => {
    jest.clearAllMocks();
});

function mount(): { store: AppStore } {
    const { tree, store } = withAllProviders(<HazardDeckScreen />);
    render(tree);
    return { store };
}

describe('S7-hazard-C04 — hazard deck stat key', () => {
    it('keys FORCE and ESCAPE above the card grid', () => {
        mount();
        const keys = screen.getAllByTestId('hazard-stat-key');
        expect(keys).toHaveLength(1);
        expect(within(keys[0]).getByText('FORCE')).toBeTruthy();
        expect(within(keys[0]).getByText('ESCAPE')).toBeTruthy();
        expect(within(keys[0]).getByText(HAZARD_STAT_KEY.caption)).toBeTruthy();
    });

    it('carries the key into the card detail overlay', () => {
        const { store } = mount();
        act(() => {
            store.setState({ flags: appendAcquiredCard([], 'r_grip') } as never);
        });
        fireEvent.press(screen.getByTestId('hazard-deck-card-r_grip'));
        const detail = screen.getByTestId('hazard-card-detail');
        const key = within(detail).getByTestId('hazard-stat-key');
        expect(within(key).getByText('FORCE')).toBeTruthy();
        expect(within(key).getByText('ESCAPE')).toBeTruthy();
    });
});
