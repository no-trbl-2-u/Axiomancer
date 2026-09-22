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
import { RARITY_LABEL, RARITY_PIPS, rarityFor } from '@/state/presenters/card-rarity.engine';
import { RARITY_TRACK_SLOTS } from '@/components/combat/encounter/CombatBoard';
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
            // D4 (2026-09-21) — the label now names the band in the player's
            // own words ('Uncommon'), where it used to splice the raw VM field
            // ('uncommon'). Compared case-insensitively so this pins the FACT
            // (the label says which band) and not the casing, which is the
            // renderer's call.
            expect(label.toLowerCase()).toContain(offer.rarity ?? 'common');
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

/**
 * D4 (2026-09-21, owner finding 8) — the draft is the screen where a
 * colour-only rarity signal cost the most: three cards side by side, one kept
 * for the rest of the run, and the only thing telling them apart was a border
 * hue. All three of D4's legs must be on the tile, and the two that survive
 * greyscale must be legible with the colour channel ignored.
 */
describe('CombatRewardsOverlay — D4 rarity, never colour alone', () => {
    it('prints the band by NAME under every offer', () => {
        const { offers } = renderOverlay();
        for (const offer of offers) {
            const tag = screen.getByTestId(`combat-reward-rarity-${offer.cardId}`);
            expect(String(tag.props.children)).toBe(RARITY_LABEL[rarityFor(offer)].toUpperCase());
        }
    });

    it('the printed word agrees with the face’s pip count on the same tile', () => {
        // Two legs, one truth: if the caption and the pips could disagree, the
        // screen would be teaching the player a hue that means nothing.
        const { offers } = renderOverlay();
        for (const offer of offers) {
            const band = rarityFor(offer);
            expect(String(screen.getByTestId(`combat-reward-rarity-${offer.cardId}`).props.children))
                .toBe(RARITY_LABEL[band].toUpperCase());
            expect(RARITY_PIPS[band]).toBeGreaterThan(0);
            expect(RARITY_PIPS[band]).toBeLessThanOrEqual(RARITY_TRACK_SLOTS);
        }
    });

    it('names the band in the tile’s accessibility label, in the player’s words', () => {
        const { offers } = renderOverlay();
        for (const offer of offers) {
            const label = screen.getByTestId(`combat-reward-${offer.cardId}`).props.accessibilityLabel as string;
            expect(label).toContain(RARITY_LABEL[rarityFor(offer)]);
        }
    });

    it('carries the rarity into the inspect preview, where the large face prints it', () => {
        // The preview is the last surface before the commit. It renders the
        // `large` face, which is the size that has room for the named tag.
        const { offers } = renderOverlay();
        const first = offers[0]!;
        fireEvent.press(screen.getByTestId(`combat-reward-${first.cardId}`));
        expect(screen.getByTestId('combat-reward-preview')).toBeTruthy();
        const tags = screen.getAllByTestId('combat-card-face-rarity');
        expect(tags.some((t) => String(t.props.children) === RARITY_LABEL[rarityFor(first)].toUpperCase())).toBe(true);
    });
});
