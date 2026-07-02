/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorFallbackModal from '../ErrorFallbackModal';

const mockErrorProps = {
    visible: true,
    errorCode: 'E_BOUND_LOOSE',
    technical: 'TypeError: Cannot read property "health" of undefined at combat.js:142',
    hint: 'this error often occurs when a creature state becomes corrupted.',
    onCopy: jest.fn(),
    onRetry: jest.fn(),
    onReturnHome: jest.fn(),
};

// Test doesn't need to mock Alert - just test the button interaction

describe('ErrorFallbackModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders error content when visible', () => {
        const { getByText } = render(<ErrorFallbackModal {...mockErrorProps} />);

        expect(getByText('THE BINDING TORE')).toBeTruthy();
        expect(getByText('E_BOUND_LOOSE')).toBeTruthy();
        expect(getByText('TypeError: Cannot read property "health" of undefined at combat.js:142')).toBeTruthy();
        expect(getByText('this error often occurs when a creature state becomes corrupted.')).toBeTruthy();
        expect(getByText('✎ COPY')).toBeTruthy();
        expect(getByText('✠ TRY AGAIN')).toBeTruthy();
        expect(getByText('return to the hearth')).toBeTruthy();
        expect(getByText('the chronicle is incomplete — but not lost.')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<ErrorFallbackModal {...mockErrorProps} visible={false} />);
        expect(queryByText('THE BINDING TORE')).toBeFalsy();
    });

    it('hides hint when not provided', () => {
        const propsWithoutHint = {
            ...mockErrorProps,
            hint: undefined,
        };

        const { queryByText } = render(<ErrorFallbackModal {...propsWithoutHint} />);
        expect(queryByText('this error often occurs when a creature state becomes corrupted.')).toBeFalsy();
    });

    it('calls onRetry when retry button is pressed', () => {
        const { getByText } = render(<ErrorFallbackModal {...mockErrorProps} />);
        
        fireEvent.press(getByText('✠ TRY AGAIN'));
        expect(mockErrorProps.onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onReturnHome when home button is pressed', () => {
        const { getByText } = render(<ErrorFallbackModal {...mockErrorProps} />);
        
        fireEvent.press(getByText('return to the hearth'));
        expect(mockErrorProps.onReturnHome).toHaveBeenCalledTimes(1);
    });

    it('handles copy button press', async () => {
        const { getByText } = render(<ErrorFallbackModal {...mockErrorProps} />);
        
        fireEvent.press(getByText('✎ COPY'));
        
        // Should call onCopy callback
        expect(mockErrorProps.onCopy).toHaveBeenCalledTimes(1);
    });

    it('renders different error codes', () => {
        const propsWithDifferentError = {
            ...mockErrorProps,
            errorCode: 'E_VOID_BREACH',
        };

        const { getByText } = render(<ErrorFallbackModal {...propsWithDifferentError} />);
        
        expect(getByText('E_VOID_BREACH')).toBeTruthy();
    });

    it('handles long technical error messages', () => {
        const propsWithLongError = {
            ...mockErrorProps,
            technical: 'ReferenceError: This is a very long error message that should wrap properly within the technical panel and demonstrate how the modal handles extensive error details without breaking the layout or becoming unreadable.',
        };

        const { getByText } = render(<ErrorFallbackModal {...propsWithLongError} />);
        
        expect(getByText(/ReferenceError: This is a very long error message/)).toBeTruthy();
    });
});