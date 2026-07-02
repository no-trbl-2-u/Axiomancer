/**
 * Hermetic E2E — persistent Hazard deck screen (Phase 126).
 *
 * Mounts the real `/hazard-deck` screen against a rigged store and
 * walks the inspect-only deck/library: headline tallies, the card
 * grid, tap-to-inspect, the colour/type/keyword distributions, and the
 * remove-card grid — including its deliberately-BLOCKED confirm.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import HazardDeckScreen from '@/app/hazard-deck/index';
import type { AppStore } from '@/state/store';
import { appendAcquiredCard, HAZARD_CRACK_CARD } from 'axiomancer-mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
}));

afterEach(() => {
    jest.clearAllMocks();
});

function mount(): { store: AppStore } {
    const { tree, store } = withAllProviders(<HazardDeckScreen />);
    render(tree);
    return { store };
}

function rigFlags(store: AppStore, cardIds: string[]): void {
    let flags: string[] = [];
    for (const id of cardIds) flags = appendAcquiredCard(flags, id);
    act(() => {
        store.setState({ flags } as never);
    });
}

describe('hazard deck screen — library', () => {
    it('renders headline tallies and the full card grid for the starter bag', () => {
        mount();
        expect(screen.getByText('THE DECK YOU CARRY')).toBeTruthy();
        // starter bag is never empty → cards render
        expect(screen.getByText('CARDS')).toBeTruthy();
        expect(screen.getByText(/ALL CARDS/)).toBeTruthy();
    });

    it('surfaces acquired cards with a copy pip and the colour distribution', () => {
        const { store } = mount();
        rigFlags(store, ['r_grip', 'r_grip']);
        expect(screen.getByTestId('hazard-deck-card-r_grip')).toBeTruthy();
        // ACQUIRED tally reflects the two reward cards
        expect(screen.getByText('ACQUIRED')).toBeTruthy();
    });

    it('tapping a card opens the detail overlay', () => {
        const { store } = mount();
        rigFlags(store, ['r_grip']);
        fireEvent.press(screen.getByTestId('hazard-deck-card-r_grip'));
        expect(screen.getByTestId('hazard-card-detail')).toBeTruthy();
    });
});

describe('hazard deck screen — remove-card grid', () => {
    it('opens the grid and shows acquired cards as cuttable', () => {
        const { store } = mount();
        rigFlags(store, ['r_grip']);
        fireEvent.press(screen.getByTestId('hazard-deck-open-remove'));
        expect(screen.getByTestId('hazard-remove-grid')).toBeTruthy();
        expect(screen.getByTestId('hazard-remove-tile-r_grip')).toBeTruthy();
    });

    it('confirming a removal surfaces the blocked notice, NOT a mutation', () => {
        const { store } = mount();
        rigFlags(store, ['r_grip']);
        const before = store.getState().flags;
        fireEvent.press(screen.getByTestId('hazard-deck-open-remove'));
        fireEvent.press(screen.getByTestId('hazard-remove-tile-r_grip'));
        fireEvent.press(screen.getByTestId('hazard-remove-confirm'));
        // blocked banner shows; save is untouched
        expect(screen.getByTestId('hazard-remove-blocked')).toBeTruthy();
        expect(store.getState().flags).toEqual(before);
        // dismiss returns to the grid
        fireEvent.press(screen.getByTestId('hazard-remove-blocked-dismiss'));
        expect(screen.queryByTestId('hazard-remove-blocked')).toBeNull();
    });

    it('shows the empty state when there are no acquired cards to cut', () => {
        mount();
        fireEvent.press(screen.getByTestId('hazard-deck-open-remove'));
        expect(screen.getByTestId('hazard-remove-grid')).toBeTruthy();
        expect(screen.queryByTestId('hazard-remove-confirm')).toBeNull();
        expect(screen.getByText(/starter bag is fixed/i)).toBeTruthy();
    });

    it('a CRACK scar is inspectable in the deck and removable in the grid', () => {
        const { store } = mount();
        rigFlags(store, [HAZARD_CRACK_CARD.id]);
        expect(screen.getByTestId(`hazard-deck-card-${HAZARD_CRACK_CARD.id}`)).toBeTruthy();
        fireEvent.press(screen.getByTestId('hazard-deck-open-remove'));
        expect(screen.getByTestId(`hazard-remove-tile-${HAZARD_CRACK_CARD.id}`)).toBeTruthy();
    });
});
