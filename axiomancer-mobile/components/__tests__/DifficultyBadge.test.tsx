/**
 * Hermetic component tests — DifficultyBadge.
 *
 * Pins the tier → (label, color) mapping contract:
 *   simple  → SIMPLE / AXM.bone
 *   normal  → NORMAL / AXM.parchment
 *   elite   → ELITE  / AXM.sulfur
 *   boss    → BOSS   / AXM.blood
 *   unique  → UNIQUE / AXM.rust
 *
 * Plus the fallback rule: an unknown tier (or no tier prop at
 * all) collapses to NORMAL. Encounter modals + codex strips
 * read this badge to surface difficulty at a glance; the
 * contract is small but load-bearing.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { DifficultyBadge } from '@/components/DifficultyBadge';
import { AXM } from '@/theme/axm';

const TIER_CASES: readonly { tier: string; label: string; color: string }[] = [
    { tier: 'simple', label: 'SIMPLE', color: AXM.bone },
    { tier: 'normal', label: 'NORMAL', color: AXM.parchment },
    { tier: 'elite', label: 'ELITE', color: AXM.sulfur },
    { tier: 'boss', label: 'BOSS', color: AXM.blood },
    { tier: 'unique', label: 'UNIQUE', color: AXM.rust },
];

describe('DifficultyBadge: tier → label mapping', () => {
    it.each(TIER_CASES)(
        'tier="$tier" renders label "$label"',
        ({ tier, label }) => {
            const tree = render(<DifficultyBadge tier={tier} />);
            expect(tree.queryByText(label)).not.toBeNull();
        },
    );
});

describe('DifficultyBadge: fallback', () => {
    it('no tier prop falls back to NORMAL', () => {
        const tree = render(<DifficultyBadge />);
        expect(tree.queryByText('NORMAL')).not.toBeNull();
    });

    it('unknown tier value falls back to NORMAL', () => {
        const tree = render(<DifficultyBadge tier="not-a-tier" />);
        expect(tree.queryByText('NORMAL')).not.toBeNull();
        // Confirm none of the other tier labels leaked through.
        for (const { label } of TIER_CASES) {
            if (label !== 'NORMAL') {
                expect(tree.queryByText(label)).toBeNull();
            }
        }
    });

    it('empty-string tier falls back to NORMAL', () => {
        const tree = render(<DifficultyBadge tier="" />);
        expect(tree.queryByText('NORMAL')).not.toBeNull();
    });
});

describe('DifficultyBadge: visual contract', () => {
    it('label text adopts the tier color', () => {
        // Spot-check boss (the most consequential tier visually).
        const tree = render(<DifficultyBadge tier="boss" />);
        const text = tree.getByText('BOSS');
        // RN's StyleSheet flattens; the color appears in the
        // resolved style array. Check the prop directly.
        const style = Array.isArray(text.props.style) ? text.props.style : [text.props.style];
        const hasBloodColor = style.some(
            (s: { color?: string } | null | undefined) => s?.color === AXM.blood,
        );
        expect(hasBloodColor).toBe(true);
    });
});
