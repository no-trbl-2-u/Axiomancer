/**
 * The post-combat card draft overlay — the surface that had ZERO tests before
 * the 2026-08-08 rebuild (audit finding 4c).
 *
 * What this pins:
 *   · the tiles render REAL card faces (the card's own name off `CombatCardVM`,
 *     not a bespoke mini-tile's re-derivation of it);
 *   · tapping a tile opens the full inspect preview, and choosing from the
 *     preview selects the card;
 *   · TAKE CARD is inert until something is selected, then reports that id;
 *   · SKIP always works and reports `null` — a lean deck is a real play;
 *   · nothing the overlay prints invents a number the presenter did not give it
 *     (P0-truth at the reward screen).
 *
 * Offers come from the real presenter (`rewardCardVMs`) over real library card
 * ids, so a face-shape regression fails here rather than at runtime.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { getCardById } from '@mechanics';
import { CombatRewardsOverlay } from '@/components/combat/encounter/CombatRewardsOverlay';
import { rewardCardVMs } from '@/state/presenters/combat-encounter.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Three real library cards spanning stances and rarities.
const OFFER_IDS = ['spoiled-poultice', 'frostbitten-palisade', 'thin-hymn'];

function renderOverlay(onPick: (cardId: string | null) => void = () => undefined) {
    const offers = rewardCardVMs(OFFER_IDS);
    return { offers, ...render(withAllProviders(<CombatRewardsOverlay offers={offers} onPick={onPick} />).tree) };
}

describe('CombatRewardsOverlay', () => {
    it('renders one real card face per offer', () => {
        const { offers } = renderOverlay();
        expect(screen.getByTestId('combat-rewards')).toBeTruthy();
        expect(offers.length).toBe(3);
        for (const id of OFFER_IDS) {
            expect(screen.getByTestId(`combat-reward-${id}`)).toBeTruthy();
            // The face prints the card's OWN name, uppercased on the side rail.
            const name = getCardById(id)?.name ?? '';
            expect(screen.getAllByText(name.toUpperCase()).length).toBeGreaterThan(0);
        }
    });

    it('every offer tile carries the card it actually offers in its label', () => {
        const { offers } = renderOverlay();
        for (const offer of offers) {
            const label = screen.getByTestId(`combat-reward-${offer.cardId}`).props.accessibilityLabel as string;
            expect(label).toContain(offer.name);
            expect(label).toContain(offer.rarity ?? 'common');
        }
    });

    it('TAKE CARD is disabled until an offer is selected', () => {
        const onPick = jest.fn();
        renderOverlay(onPick as (cardId: string | null) => void);
        const confirm = screen.getByTestId('combat-reward-confirm');
        expect(confirm.props.accessibilityState.disabled).toBe(true);
        fireEvent.press(confirm);
        expect(onPick).not.toHaveBeenCalled();
    });

    it('tapping a tile opens the inspect preview with the full face', () => {
        renderOverlay();
        expect(screen.queryByTestId('combat-reward-preview')).toBeNull();
        fireEvent.press(screen.getByTestId(`combat-reward-${OFFER_IDS[0]}`));
        expect(screen.getByTestId('combat-reward-preview')).toBeTruthy();
        // The preview must show the authored flavor — the reason to read it.
        expect(screen.getByTestId('combat-reward-preview-flavor')).toBeTruthy();
    });

    it('BACK closes the preview without selecting anything', () => {
        const onPick = jest.fn();
        renderOverlay(onPick as (cardId: string | null) => void);
        fireEvent.press(screen.getByTestId(`combat-reward-${OFFER_IDS[1]}`));
        fireEvent.press(screen.getByTestId('combat-reward-preview-close'));
        expect(screen.queryByTestId('combat-reward-preview')).toBeNull();
        expect(screen.getByTestId('combat-reward-confirm').props.accessibilityState.disabled).toBe(true);
        expect(onPick).not.toHaveBeenCalled();
    });

    it('choosing from the preview selects that card, and TAKE CARD reports it', () => {
        const onPick = jest.fn();
        renderOverlay(onPick as (cardId: string | null) => void);
        fireEvent.press(screen.getByTestId(`combat-reward-${OFFER_IDS[1]}`));
        fireEvent.press(screen.getByTestId('combat-reward-preview-select'));
        expect(screen.queryByTestId('combat-reward-preview')).toBeNull();
        const tile = screen.getByTestId(`combat-reward-${OFFER_IDS[1]}`);
        expect(tile.props.accessibilityState.selected).toBe(true);
        fireEvent.press(screen.getByTestId('combat-reward-confirm'));
        expect(onPick).toHaveBeenCalledWith(OFFER_IDS[1]);
    });

    it('selecting a second card replaces the first', () => {
        const onPick = jest.fn();
        renderOverlay(onPick as (cardId: string | null) => void);
        fireEvent.press(screen.getByTestId(`combat-reward-${OFFER_IDS[0]}`));
        fireEvent.press(screen.getByTestId('combat-reward-preview-select'));
        fireEvent.press(screen.getByTestId(`combat-reward-${OFFER_IDS[2]}`));
        fireEvent.press(screen.getByTestId('combat-reward-preview-select'));
        expect(screen.getByTestId(`combat-reward-${OFFER_IDS[0]}`).props.accessibilityState.selected).toBe(false);
        expect(screen.getByTestId(`combat-reward-${OFFER_IDS[2]}`).props.accessibilityState.selected).toBe(true);
        fireEvent.press(screen.getByTestId('combat-reward-confirm'));
        expect(onPick).toHaveBeenCalledWith(OFFER_IDS[2]);
    });

    it('SKIP reports null, and stays available after a card was selected', () => {
        const onPick = jest.fn();
        renderOverlay(onPick as (cardId: string | null) => void);
        fireEvent.press(screen.getByTestId(`combat-reward-${OFFER_IDS[0]}`));
        fireEvent.press(screen.getByTestId('combat-reward-preview-select'));
        const skip = screen.getByTestId('combat-reward-skip');
        expect(skip.props.accessibilityState?.disabled).toBeFalsy();
        fireEvent.press(skip);
        expect(onPick).toHaveBeenCalledWith(null);
    });

    it('SKIP reads as a real choice, not a greyed-out escape hatch', () => {
        renderOverlay();
        const label = screen.getByTestId('combat-reward-skip').props.accessibilityLabel as string;
        expect(label.toLowerCase()).toContain('lean');
        // Same visual weight as TAKE: both are bordered buttons in the same row.
        expect(screen.getByText('TAKE NOTHING')).toBeTruthy();
        expect(screen.getByText('TAKE CARD')).toBeTruthy();
    });

    it('renders nothing at all when the draft is empty', () => {
        render(withAllProviders(<CombatRewardsOverlay offers={[]} onPick={() => undefined} />).tree);
        expect(screen.getByTestId('combat-rewards')).toBeTruthy();
        for (const id of OFFER_IDS) expect(screen.queryByTestId(`combat-reward-${id}`)).toBeNull();
    });
});
