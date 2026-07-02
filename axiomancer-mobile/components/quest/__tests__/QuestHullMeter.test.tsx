/**
 * QuestHullMeter (U3) — surfaces boatProgress + tier preview as a bar.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { QuestHullMeter } from '@/components/quest/QuestHullMeter';

function fillWidth(): string | number | undefined {
    const flat = Object.assign({}, ...[].concat(screen.getByTestId('quest-hull-fill').props.style));
    return flat.width;
}

describe('QuestHullMeter', () => {
    it('draws the fill to the progress percentage and labels the tier', () => {
        render(<QuestHullMeter progress={0.5} tierLabel="SEAWORTHY" />);
        expect(screen.getByTestId('quest-hull-meter')).toBeTruthy();
        expect(fillWidth()).toBe('50%');
        expect(screen.getByTestId('quest-hull-tier').props.children).toContain('SEAWORTHY');
    });

    it('clamps progress into 0..100%', () => {
        const { rerender } = render(<QuestHullMeter progress={1.8} tierLabel="MASTERWORK" />);
        expect(fillWidth()).toBe('100%');
        rerender(<QuestHullMeter progress={-0.4} tierLabel="DRIFTWOOD" />);
        expect(fillWidth()).toBe('0%');
    });

    it('rounds to a whole percent', () => {
        render(<QuestHullMeter progress={1 / 3} tierLabel="SEAWORTHY" />);
        expect(fillWidth()).toBe('33%');
    });
});
