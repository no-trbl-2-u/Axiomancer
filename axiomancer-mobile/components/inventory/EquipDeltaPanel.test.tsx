/**
 * Hermetic component tests — EquipDeltaPanel (Phase 133; slimmed Phase 23).
 *
 * After the equipment-signature epic the panel renders only the stat deltas and
 * the signet-relic signature gained / lost. Pins: `isEmpty` whole-panel
 * suppression, the mode eyebrow, signed stat-chip labels + sign treatment, and
 * the signature row.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';
import React from 'react';

import { EquipDeltaPanel } from '@/components/inventory/EquipDeltaPanel';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { AXM } from '@/theme/axm';
import type { EquipDelta } from '@mechanics';

function textColor(node: { props?: { style?: unknown } }): string | undefined {
    return (StyleSheet.flatten(node.props?.style as TextStyle) as TextStyle)?.color as
        | string
        | undefined;
}

function makeDelta(overrides: Partial<EquipDelta> = {}): EquipDelta {
    return {
        mode: 'equip',
        against: null,
        stats: [],
        signatures: { gained: [], lost: [] },
        isEmpty: false,
        ...overrides,
    };
}

const ITEM_ID = 'iron-sword';

function renderPanel(delta: EquipDelta) {
    const { tree } = withAllProviders(<EquipDeltaPanel itemId={ITEM_ID} delta={delta} />);
    return render(tree);
}

describe('EquipDeltaPanel', () => {
    it('renders nothing when the delta is empty', () => {
        const { queryByTestId } = renderPanel(makeDelta({ isEmpty: true }));
        expect(queryByTestId(`equip-delta-${ITEM_ID}`)).toBeNull();
    });

    it('renders the mode eyebrow', () => {
        const { getByText } = renderPanel(makeDelta({ mode: 'swap', stats: [{ stat: 'attack', delta: 1 }] }));
        expect(getByText('CHARACTER UPDATES — ON SWAP')).toBeTruthy();
    });

    it('renders signed stat chips with green for gains and red for losses', () => {
        const { getByText } = renderPanel(
            makeDelta({ stats: [{ stat: 'attack', delta: 2 }, { stat: 'stamina', delta: -1 }] }),
        );
        expect(textColor(getByText('+2 attack'))).toBe(AXM.heal);
        expect(textColor(getByText('-1 stamina'))).toBe(AXM.blood);
    });

    // Phase 19/23 — signet relic signature swap.
    it('renders the gained and lost signatures of a relic swap', () => {
        const { getByText, getByTestId } = renderPanel(
            makeDelta({
                mode: 'swap',
                signatures: {
                    gained: [{ id: 'sig-second-wind', name: 'Second Wind' }],
                    lost: [{ id: 'sig-read-opponent', name: 'Read the Entrails' }],
                },
            }),
        );
        expect(getByTestId(`equip-delta-signatures-${ITEM_ID}`)).toBeTruthy();
        expect(getByText('grants Second Wind')).toBeTruthy();
        expect(getByText('loses Read the Entrails')).toBeTruthy();
    });

    it('omits the signature row when nothing changes', () => {
        const { queryByTestId } = renderPanel(makeDelta({ stats: [{ stat: 'attack', delta: 1 }] }));
        expect(queryByTestId(`equip-delta-signatures-${ITEM_ID}`)).toBeNull();
    });
});
