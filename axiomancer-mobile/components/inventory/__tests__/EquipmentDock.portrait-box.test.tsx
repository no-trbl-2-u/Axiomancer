/**
 * Hermetic component test — the equipment dock's portrait box at both viewports
 * (fresh-eyes repair of cluster S3-sheet-C11).
 *
 * S3-sheet-C11 bought the gear list its width by pinning the portrait column to
 * `width: 96` while the bust kept `height={260}` and `fit="contain"`. The
 * portrait sources are square, so `contain` drew the pilgrim at 96x96 inside a
 * 96x260 box: a column that is ~70% dead black on a phone, and at 1280pt a ~70pt
 * thumbnail floating in an empty gutter — desktop paid the whole cost of a
 * phone-width wrap bug it never had.
 *
 * Contract asserted here: the box is always SQUARE (no letterbox), it stays a
 * narrow gutter at phone widths (so the slot column keeps the room that stopped
 * "GRANTS READ THE ENTRA…"), and it grows into a real bust at desktop widths.
 */

import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { EquipmentDock, equipmentDockPortraitBox } from '../EquipmentDock';
import type { EquipmentDockViewModel } from '@/state/presenters/inventory.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

const PHONE = { width: 375, height: 812, scale: 3, fontScale: 1 };
const DESKTOP = { width: 1280, height: 800, scale: 1, fontScale: 1 };

// The bust is the thing under test, so stand in for it with a host view that
// records the width/height/fit it was handed.
jest.mock('@/components/art/PlayerPortraitImage', () => ({
    PlayerPortraitImage: (props: { width?: unknown; height?: unknown; fit?: string }) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const R = require('react');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { View } = require('react-native');
        return R.createElement(View, { testID: 'dock-portrait-image', portraitProps: props });
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RN = require('react-native') as Record<string, unknown>;
const realUseWindowDimensions = RN.useWindowDimensions;
let viewport = PHONE;
beforeAll(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: () => viewport });
});
afterAll(() => {
    Object.defineProperty(RN, 'useWindowDimensions', { configurable: true, value: realUseWindowDimensions });
});

function makeVm(): EquipmentDockViewModel {
    return {
        slots: [
            { key: 'weapon', label: 'WEAPON', item: { id: 'w', name: 'Gorgon Brand', sub: 'Weapon', grantsSignature: 'The Stilling' } },
            { key: 'armor', label: 'ARMOR', item: { id: 'a', name: 'Coldglass Aegis', sub: 'Armor', grantsSignature: 'Read the Entrails' } },
            { key: 'accessory', accessoryIndex: 0, label: 'TRINKET I', item: null },
            { key: 'accessory', accessoryIndex: 1, label: 'TRINKET II', item: null },
            { key: 'accessory', accessoryIndex: 2, label: 'TRINKET III', item: null },
        ],
        headerLabel: '✠ WORN UPON THE BODY',
        hintLabel: 'TAP A SLOT TO SEE WHAT ELSE FITS',
        bareLabel: '— bare —',
        selectedSlot: null,
        bannerEyebrow: 'FITTING SLOT',
        bannerSlotLabel: '',
        bannerClearLabel: 'CLEAR ✕',
    };
}

/** Mounts the dock at `size` and reports the portrait column's laid-out box:
 *  the style width the column claims and the height the bust is drawn at. */
function mountPortrait(size: typeof PHONE): { columnWidth: unknown; imageHeight: unknown; slotsFlex: unknown } {
    viewport = size;
    const { tree } = withAllProviders(
        <EquipmentDock vm={makeVm()} selectedSlot={null} onSelectSlot={() => {}} />,
    );
    const screen = render(tree);
    const column = StyleSheet.flatten(screen.getByTestId('equipment-dock-portrait').props.style);
    const slots = StyleSheet.flatten(screen.getByTestId('equipment-dock-slots').props.style);
    const image = screen.getByTestId('dock-portrait-image').props.portraitProps;
    return { columnWidth: column.width, imageHeight: image.height, slotsFlex: slots.flex };
}

describe('equipmentDockPortraitBox: the bust is never letterboxed', () => {
    it('returns a square box at every viewport width', () => {
        for (const width of [320, 375, 414, 768, 900, 1024, 1280, 1920]) {
            const box = equipmentDockPortraitBox(width);
            expect(box.height).toBe(box.width);
        }
    });

    it('stays a narrow gutter on a phone so the gear rows keep their width', () => {
        expect(equipmentDockPortraitBox(375).width).toBeLessThanOrEqual(120);
    });

    it('grows into a real bust once the dock has room to spare', () => {
        expect(equipmentDockPortraitBox(1280).width).toBeGreaterThanOrEqual(240);
        expect(equipmentDockPortraitBox(1280).width).toBeGreaterThan(equipmentDockPortraitBox(375).width);
    });

    it('does not widen the gutter at tablet-portrait width', () => {
        expect(equipmentDockPortraitBox(768).width).toBe(equipmentDockPortraitBox(375).width);
    });
});

describe('EquipmentDock: the portrait column is art, not dead space', () => {
    it('draws the bust at its column width on a phone (no empty 260pt column)', () => {
        const { columnWidth, imageHeight, slotsFlex } = mountPortrait(PHONE);

        expect(imageHeight).toBe(columnWidth);
        expect(columnWidth as number).toBeLessThanOrEqual(120);
        // The S3-sheet-C11 win stands: the slot column still takes the rest.
        expect(slotsFlex).toBe(1);
    });

    it('restores a large bust at desktop width', () => {
        const { columnWidth, imageHeight, slotsFlex } = mountPortrait(DESKTOP);

        expect(columnWidth as number).toBeGreaterThanOrEqual(240);
        expect(imageHeight).toBe(columnWidth);
        expect(slotsFlex).toBe(1);
    });
});
