/**
 * Hermetic component tests — GatheringIntroOverlay.
 *
 * Pins the gathering-minigame site-reveal modal's render + interaction
 * contract: the `title` / `intro` props render, the fixed eyebrow line
 * is present, the `gathering-intro` root and `gathering-intro-continue`
 * CTA testIDs render, the CTA carries the button accessibility role, and
 * pressing it fires `onContinue` exactly once.
 *
 * The component is presentation-only — props drive every text branch,
 * no store reads or engine calls.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { GatheringIntroOverlay } from '@/components/gathering/GatheringIntroOverlay';

const mockOnContinue = jest.fn();

function renderOverlay(
    overrides: Partial<React.ComponentProps<typeof GatheringIntroOverlay>> = {},
) {
    return render(
        <GatheringIntroOverlay
            title="The Whispering Grove"
            intro="The roots remember every hand that ever took from here."
            onContinue={mockOnContinue}
            {...overrides}
        />,
    );
}

describe('GatheringIntroOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the title and intro from props', () => {
        const { getByText } = renderOverlay();

        expect(getByText('The Whispering Grove')).toBeDefined();
        expect(
            getByText('The roots remember every hand that ever took from here.'),
        ).toBeDefined();
    });

    it('renders the fixed eyebrow line', () => {
        const { getByText } = renderOverlay();

        expect(getByText('❧ A PLACE THAT GIVES — AND COUNTS')).toBeDefined();
    });

    it('exposes the root and continue testIDs', () => {
        const { getByTestId } = renderOverlay();

        expect(getByTestId('gathering-intro')).toBeDefined();
        expect(getByTestId('gathering-intro-continue')).toBeDefined();
    });

    it('labels the continue control as a button', () => {
        const { getByRole } = renderOverlay();

        expect(getByRole('button')).toBeDefined();
    });

    it('fires onContinue when the CTA is pressed', () => {
        const { getByTestId } = renderOverlay();

        fireEvent.press(getByTestId('gathering-intro-continue'));
        expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('reflects updated title and intro props', () => {
        const { getByText } = renderOverlay({
            title: 'The Sunken Hollow',
            intro: 'Cold water keeps a ledger too.',
        });

        expect(getByText('The Sunken Hollow')).toBeDefined();
        expect(getByText('Cold water keeps a ledger too.')).toBeDefined();
    });
});
