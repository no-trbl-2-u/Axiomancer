/**
 * Hermetic component tests — EquipDeltaPanel (Phase 133).
 *
 * Pins the equip-change delta surface's render contract: the
 * `isEmpty` whole-panel suppression, the mode eyebrow mapping
 * (equip/unequip/swap), signed stat-chip labels and sign treatment,
 * the per-side `hasAny` gate (an all-empty side renders nothing),
 * and the gained/lost rendering of every entry kind — keywords,
 * modifiers (rolled-value vs. bare), passive / on-hit / on-defend
 * effects (named tooltip vs. anonymous fallback, with prefix
 * formatting), and resource interactions (signed `resourceLabel`).
 *
 * The component is pure presentation — props drive every branch, no
 * store reads or engine calls.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';
import React from 'react';

import { EquipDeltaPanel } from '@/components/inventory/EquipDeltaPanel';
import { withAllProviders } from '@/test-utils/withAllProviders';
import { AXM } from '@/theme/axm';
import type { EquipDelta, EquipDeltaSide } from 'axiomancer-mechanics';

function textColor(node: { props?: { style?: unknown } }): string | undefined {
    return (StyleSheet.flatten(node.props?.style as TextStyle) as TextStyle)?.color as
        | string
        | undefined;
}

function emptySide(): EquipDeltaSide {
    return {
        modifiers: [],
        passiveEffects: [],
        onHitEffects: [],
        onDefendEffects: [],
        resources: [],
        keywords: [],
    };
}

function makeDelta(overrides: Partial<EquipDelta> = {}): EquipDelta {
    return {
        mode: 'equip',
        against: null,
        stats: [],
        gained: emptySide(),
        lost: emptySide(),
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

    it('maps mode to the character-update eyebrow label', () => {
        const cases: [EquipDelta['mode'], string][] = [
            ['equip', 'CHARACTER UPDATES \u2014 ON EQUIP'],
            ['unequip', 'CHARACTER UPDATES \u2014 ON UNEQUIP'],
            ['swap', 'CHARACTER UPDATES \u2014 ON SWAP'],
        ];
        for (const [mode, label] of cases) {
            const { getByText, unmount } = renderPanel(makeDelta({ mode }));
            expect(getByText(label)).toBeTruthy();
            unmount();
        }
    });

    it('renders signed stat chips and drops the leading + on negatives', () => {
        const { getByTestId, getByText } = renderPanel(
            makeDelta({
                stats: [
                    { stat: 'attack', delta: 2 },
                    { stat: 'speed', delta: -1 },
                ],
            }),
        );
        expect(getByTestId(`equip-delta-stats-${ITEM_ID}`)).toBeTruthy();
        expect(getByText('+2 attack')).toBeTruthy();
        expect(getByText('-1 speed')).toBeTruthy();
    });

    it('suppresses the stat row when there are no stat deltas', () => {
        const { queryByTestId } = renderPanel(
            makeDelta({ gained: { ...emptySide(), keywords: [{ key: 'k', label: 'Sharp' }] } }),
        );
        expect(queryByTestId(`equip-delta-stats-${ITEM_ID}`)).toBeNull();
    });

    it('renders only the side that has content (hasAny gate)', () => {
        const { getByTestId, queryByTestId } = renderPanel(
            makeDelta({ gained: { ...emptySide(), keywords: [{ key: 'k', label: 'Keen' }] } }),
        );
        expect(getByTestId(`equip-delta-gained-${ITEM_ID}`)).toBeTruthy();
        expect(queryByTestId(`equip-delta-lost-${ITEM_ID}`)).toBeNull();
    });

    it('renders both gained and lost sides on a swap', () => {
        const { getByTestId, getByText } = renderPanel(
            makeDelta({
                mode: 'swap',
                gained: { ...emptySide(), keywords: [{ key: 'g', label: 'Gained Kw' }] },
                lost: { ...emptySide(), keywords: [{ key: 'l', label: 'Lost Kw' }] },
            }),
        );
        expect(getByTestId(`equip-delta-gained-${ITEM_ID}`)).toBeTruthy();
        expect(getByTestId(`equip-delta-lost-${ITEM_ID}`)).toBeTruthy();
        expect(getByText('Gained Kw')).toBeTruthy();
        expect(getByText('Lost Kw')).toBeTruthy();
    });

    it('formats modifiers with a rolled value and falls back to id when unnamed', () => {
        const { getByText } = renderPanel(
            makeDelta({
                gained: {
                    ...emptySide(),
                    modifiers: [
                        { id: 'mod-named', name: 'Flat Bonus', value: 5 },
                        { id: 'mod-bare', name: null, value: null },
                    ],
                },
            }),
        );
        expect(getByText('Flat Bonus (5)')).toBeTruthy();
        expect(getByText('mod-bare')).toBeTruthy();
    });

    it('renders a named effect via tooltip target and an anonymous one as a plain tag', () => {
        const { getByText, getByTestId } = renderPanel(
            makeDelta({
                gained: {
                    ...emptySide(),
                    passiveEffects: [
                        { id: 'eff-named', name: 'Regeneration' },
                        { id: 'eff-anon', name: null },
                    ],
                },
            }),
        );
        expect(getByText('Regeneration')).toBeTruthy();
        expect(getByText('eff-anon')).toBeTruthy();
        expect(getByTestId(`equip-delta-gained-passive-${ITEM_ID}-eff-named-tip`)).toBeTruthy();
    });

    it('prefixes on-hit and on-defend effects', () => {
        const { getByText } = renderPanel(
            makeDelta({
                gained: {
                    ...emptySide(),
                    onHitEffects: [{ id: 'burn', name: 'Burn' }],
                    onDefendEffects: [{ id: 'thorns', name: null }],
                },
            }),
        );
        expect(getByText('on-hit: Burn')).toBeTruthy();
        expect(getByText('on-defend: thorns')).toBeTruthy();
    });

    it('formats resource interactions with signed amount and verb', () => {
        const { getByText } = renderPanel(
            makeDelta({
                gained: {
                    ...emptySide(),
                    resources: [
                        { key: 'r-start', resource: 'mind', amount: 2, kind: 'start' },
                        { key: 'r-loss', resource: 'body', amount: -1, kind: 'start' },
                    ],
                },
            }),
        );
        expect(getByText('+2 mind (start)')).toBeTruthy();
        expect(getByText('-1 body (start)')).toBeTruthy();
    });

    it('colours a positive stat increase green (heal) and a decrease red (blood)', () => {
        const { getByText } = renderPanel(
            makeDelta({
                stats: [
                    { stat: 'attack', delta: 2 },
                    { stat: 'speed', delta: -1 },
                ],
            }),
        );
        expect(textColor(getByText('+2 attack'))).toBe(AXM.heal);
        expect(textColor(getByText('-1 speed'))).toBe(AXM.blood);
    });

    it('colours new-item (gained) passive effects green and old-item (lost) passives red on a swap', () => {
        const { getByText } = renderPanel(
            makeDelta({
                mode: 'swap',
                gained: { ...emptySide(), passiveEffects: [{ id: 'eff-new', name: null }] },
                lost: { ...emptySide(), passiveEffects: [{ id: 'eff-old', name: null }] },
            }),
        );
        expect(textColor(getByText('eff-new'))).toBe(AXM.heal);
        expect(textColor(getByText('eff-old'))).toBe(AXM.blood);
    });

    it('uses green (heal), never sulfur/gold, for the gained side label', () => {
        const { getByText } = renderPanel(
            makeDelta({ gained: { ...emptySide(), keywords: [{ key: 'k', label: 'Keen' }] } }),
        );
        const label = getByText('GAINED');
        expect(textColor(label)).toBe(AXM.heal);
        expect(textColor(label)).not.toBe(AXM.sulfur);
    });
});
