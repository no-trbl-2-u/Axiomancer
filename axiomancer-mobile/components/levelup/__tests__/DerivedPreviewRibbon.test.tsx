/**
 * Hermetic component tests — DerivedPreviewRibbon (Phase 88).
 *
 * Tests the derived stats preview grid functionality:
 *   - grid layout with ATK/SKL/DEF headers
 *   - current stats display when no allocations
 *   - delta format "current → new (+N)" with allocations
 *   - stance row rendering for heart/body/mind
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { DerivedPreviewRibbon } from '@/components/levelup/DerivedPreviewRibbon';

const BASE_CURRENT = {
    heart: { attack: 12, skill: 10, defense: 8 },
    body: { attack: 14, skill: 8, defense: 11 },
    mind: { attack: 9, skill: 13, defense: 7 },
};

const PREVIEW_WITH_DELTAS = {
    heart: { attack: 14, skill: 12, defense: 9 },
    body: { attack: 16, skill: 10, defense: 13 },
    mind: { attack: 11, skill: 15, defense: 8 },
};

describe('DerivedPreviewRibbon: layout and headers', () => {
    it('mounts the ribbon', () => {
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={BASE_CURRENT}
                hasAllocations={false}
            />
        );
        expect(tree.queryByTestId('derived-preview-ribbon')).not.toBeNull();
    });

    it('renders ATK/SKL/DEF column headers', () => {
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={BASE_CURRENT}
                hasAllocations={false}
            />
        );
        expect(tree.queryByText('ATK')).not.toBeNull();
        expect(tree.queryByText('SKL')).not.toBeNull();
        expect(tree.queryByText('DEF')).not.toBeNull();
    });

    it('renders HEART/BODY/MIND stance rows', () => {
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={BASE_CURRENT}
                hasAllocations={false}
            />
        );
        expect(tree.queryByTestId('preview-row-heart')).not.toBeNull();
        expect(tree.queryByTestId('preview-row-body')).not.toBeNull();
        expect(tree.queryByTestId('preview-row-mind')).not.toBeNull();
    });
});

describe('DerivedPreviewRibbon: no allocations mode', () => {
    it('shows current values without deltas when hasAllocations=false', () => {
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={PREVIEW_WITH_DELTAS}
                hasAllocations={false}
            />
        );
        
        // Should show current values only, no arrows or deltas
        expect(tree.queryByText('12')).not.toBeNull(); // heart attack
        expect(tree.queryByText('14')).not.toBeNull(); // body attack
        expect(tree.queryByText('9')).not.toBeNull();  // mind attack
        
        // Should not show preview values or arrows
        expect(tree.queryByText('→')).toBeNull();
        expect(tree.queryByText('(+2)')).toBeNull();
    });
});

describe('DerivedPreviewRibbon: allocations mode', () => {
    it('shows delta format when hasAllocations=true and values differ', () => {
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={PREVIEW_WITH_DELTAS}
                hasAllocations={true}
            />
        );
        
        // Check delta format for changed values - now as complete strings
        expect(tree.queryByText('12 → 14 (+2)')).not.toBeNull(); // heart attack +2
        expect(tree.queryByText('14 → 16 (+2)')).not.toBeNull(); // body attack +2
        expect(tree.queryByText('9 → 11 (+2)')).not.toBeNull();   // mind attack +2
    });

    it('shows current value when hasAllocations=true but no delta', () => {
        const noDeltaPreview = {
            ...BASE_CURRENT,
            heart: { ...BASE_CURRENT.heart, skill: 12 }, // only skill changed
        };
        
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={noDeltaPreview}
                hasAllocations={true}
            />
        );
        
        // Heart attack unchanged, should show just current value
        expect(tree.queryByTestId('preview-heart-attack')).not.toBeNull();
        const heartAttackCell = tree.getByTestId('preview-heart-attack');
        expect(heartAttackCell.props.children).toBe(12);
    });
});

describe('DerivedPreviewRibbon: stance-specific cells', () => {
    it('includes testIDs for stance-stat combinations', () => {
        const tree = render(
            <DerivedPreviewRibbon
                current={BASE_CURRENT}
                preview={BASE_CURRENT}
                hasAllocations={false}
            />
        );
        
        // Test a few representative cells
        expect(tree.queryByTestId('preview-heart-attack')).not.toBeNull();
        expect(tree.queryByTestId('preview-body-skill')).not.toBeNull();
        expect(tree.queryByTestId('preview-mind-defense')).not.toBeNull();
    });
});