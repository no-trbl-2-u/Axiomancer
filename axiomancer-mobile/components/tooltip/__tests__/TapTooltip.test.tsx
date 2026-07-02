/**
 * Phase 74 Tick A — TapTooltip visual primitive pins.
 *
 * Pure presentational; no provider needed.
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { TapTooltip } from '@/components/tooltip/TapTooltip';

describe('<TapTooltip>', () => {
    it('renders title + body + footnote at the given coords', () => {
        const tree = render(
            <TapTooltip
                title="HEART"
                body="the will to stay with what's difficult."
                footnote="+1 morale per defend at heart stance"
                left={48}
                top={120}
            />,
        );
        expect(tree.queryByTestId('tap-tooltip-title')?.children?.[0]).toBe('HEART');
        expect(tree.queryByTestId('tap-tooltip-body')?.children?.[0]).toContain(
            "will to stay",
        );
        expect(tree.queryByTestId('tap-tooltip-footnote')?.children?.[0]).toContain(
            'morale',
        );
    });

    it('omits the footnote element when not provided', () => {
        const tree = render(
            <TapTooltip title="HEART" body="…" left={0} top={0} />,
        );
        expect(tree.queryByTestId('tap-tooltip-footnote')).toBeNull();
    });

    it('honors the testID override', () => {
        const tree = render(
            <TapTooltip title="X" body="y" left={0} top={0} testID="custom-id" />,
        );
        expect(tree.queryByTestId('custom-id')).not.toBeNull();
        expect(tree.queryByTestId('tap-tooltip')).toBeNull();
    });
});
