/**
 * Hermetic render test — MEMOIR's MEASURE row stays inside the viewport.
 *
 * Regression guard for 09-memoir-fresh: the UNTESTED chip carries the
 * presenter's 75-character hint ('heart, body and mind stand level. …').
 * The chips hang off a TooltipTarget (a Pressable), so the chip's own
 * `flex: 1` never reached the row — the pressable kept RN's default
 * `flexShrink: 0`, sized to max-content, and ran the sentence past the
 * 375pt screen edge with its right border off-screen.
 *
 * The row must therefore wrap, and each chip target must be allowed to
 * shrink, so the long chip fits at 375x812 while both still sit side by
 * side at content width on 1280x800.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { createCharacter } from '@mechanics';

import MemoirScreen from '@/app/(tabs)/memoir';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { withAllProviders } from '@/test-utils/withAllProviders';

/**
 * Collapse a React Native `style` prop (object, array, or nested array)
 * into one plain object.
 *
 * Input: the raw `style` prop of a rendered element.
 * Output: a flat record of resolved style declarations (later entries
 * win, matching RN's own resolution order).
 * Resolves: 09-memoir-fresh — lets the assertions read layout rules off
 * the rendered tree without a layout engine.
 */
function flattenStyle(style: unknown): Record<string, unknown> {
    if (Array.isArray(style)) {
        return Object.assign({}, ...style.flat(Infinity).filter(Boolean).map(flattenStyle));
    }
    return (style ?? {}) as Record<string, unknown>;
}

/**
 * Build a deterministic store whose pilgrim has heart/body/mind level —
 * the three-way tie that makes the philosophical chip read UNTESTED and
 * print its long hint.
 *
 * Input: none. Output: a fresh `AppStore` on a memory adapter.
 * Resolves: 09-memoir-fresh — pins the exact state that overflowed.
 */
function makeUntestedStore(): AppStore {
    const base = createCharacter({
        name: 'Pilgrim',
        level: 1,
        baseStats: { heart: 4, body: 4, mind: 4 },
    });
    return createAppStore({ adapter: createMemoryAdapter(), overrides: { player: base } });
}

describe('memoir MEASURE row: the UNTESTED chip fits the viewport', () => {
    it('renders the full UNTESTED hint', () => {
        const { tree } = withAllProviders(<MemoirScreen />, { store: makeUntestedStore() });
        const rendered = render(tree);

        expect(rendered.getByTestId('memoir-philosophical-empty').props.children).toContain(
            'names your bent.',
        );
    });

    it('wraps the measure row so an over-long chip drops to its own line', () => {
        const { tree } = withAllProviders(<MemoirScreen />, { store: makeUntestedStore() });
        const rendered = render(tree);

        const row = flattenStyle(rendered.getByTestId('memoir-measure-row').props.style);

        expect(row.flexDirection).toBe('row');
        expect(row.flexWrap).toBe('wrap');
    });

    it('lets both chip targets shrink instead of sizing to max-content', () => {
        const { tree } = withAllProviders(<MemoirScreen />, { store: makeUntestedStore() });
        const rendered = render(tree);

        for (const testID of ['memoir-moral-chip-tooltip', 'memoir-philosophical-chip-tooltip']) {
            const target = flattenStyle(rendered.getByTestId(testID).props.style);

            expect(target.flexShrink).toBe(1);
            expect(target.minWidth).toBe(0);
        }
    });
});
