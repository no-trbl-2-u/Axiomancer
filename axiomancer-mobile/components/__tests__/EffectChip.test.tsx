/**
 * Hermetic component tests — EffectChip (Phase 41 combat-HUD
 * chrome). Pins the render contract: color-map resolution,
 * tint-map resolution, duration/intensity conditional rendering,
 * and the dim opacity branch.
 *
 * The component is pure presentation — no store reads, no engine
 * calls. Style snapshot kept structural (flatten + read keys we
 * actually drive) rather than deep snapshots that would lock in
 * incidental layout details.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import React from 'react';

import { EffectChip } from '@/components/EffectChip';
import { AXM } from '@/theme/axm';

function chipStyle(tree: { toJSON: () => unknown }): ViewStyle {
    // Render output is a JSON tree; the root node is the chip View.
    // Its style prop carries the merged styles[].
     
    const root = tree.toJSON() as any;
    const node = Array.isArray(root) ? root[0] : root;
    return StyleSheet.flatten(node.props.style as ViewStyle) as ViewStyle;
}

describe('EffectChip: color-map resolution', () => {
    it('uses the per-kind color for a known kind (bleed → AXM.blood)', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed' }} />,
        );
        const style = chipStyle(tree);
        expect(style.borderColor).toBe(AXM.blood);
    });

    it('falls back to AXM.parchment for an unknown kind', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'no-such-effect', name: 'Unknown' }} />,
        );
        const style = chipStyle(tree);
        expect(style.borderColor).toBe(AXM.parchment);
    });
});

describe('EffectChip: tint-map resolution', () => {
    it('uses AXM.buff background when tint is "buff"', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'regen', name: 'Regen', tint: 'buff' }} />,
        );
        const style = chipStyle(tree);
        expect(style.backgroundColor).toBe(AXM.buff);
    });

    it('uses AXM.debuff background when tint is "debuff"', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'poison', name: 'Poison', tint: 'debuff' }} />,
        );
        const style = chipStyle(tree);
        expect(style.backgroundColor).toBe(AXM.debuff);
    });

    it('uses neutral background (AXM.deepBg) when tint is missing', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed' }} />,
        );
        const style = chipStyle(tree);
        expect(style.backgroundColor).toBe(AXM.deepBg);
    });
});

describe('EffectChip: duration + intensity rendering', () => {
    it('renders the duration value when provided', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed', duration: 3 }} />,
        );
        expect(tree.queryByText('3')).not.toBeNull();
    });

    it('omits the duration row when undefined', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed' }} />,
        );
        expect(tree.queryByText(/^\d+$/)).toBeNull();
    });

    it('renders the intensity row only when intensity > 1', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed', intensity: 2 }} />,
        );
        expect(tree.queryByText('×2')).not.toBeNull();
    });

    it('omits the intensity row when intensity is 1 (single-stack case)', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed', intensity: 1 }} />,
        );
        expect(tree.queryByText(/^×/)).toBeNull();
    });
});

describe('EffectChip: dim branch', () => {
    it('reduces opacity to 0.55 when dim is true', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed' }} dim />,
        );
        const style = chipStyle(tree);
        expect(style.opacity).toBe(0.55);
    });

    it('uses full opacity (1) by default', () => {
        const tree = render(
            <EffectChip effect={{ kind: 'bleed', name: 'Bleed' }} />,
        );
        const style = chipStyle(tree);
        expect(style.opacity).toBe(1);
    });
});
