/**
 * Hermetic tests — `<PrevSessionCrashPrompt>` (Phase 77 next-launch
 * crash banner).
 *
 * `@/state/logging`'s crash-marker plumbing is pinned separately in
 * `state/__tests__/logging.test.ts`; this suite stubs its two reader
 * functions so the component's own contract is isolated: no marker ->
 * nothing renders, a marker -> a dismissible banner that opens the
 * shared `CrashReportPanel` report and can be closed either way.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { PrevSessionCrashPrompt } from '@/components/PrevSessionCrashPrompt';

const mockGetPrevSessionCrash = jest.fn();
const mockGetPrevSessionLogTail = jest.fn();

jest.mock('@/state/logging', () => ({
    getPrevSessionCrash: () => mockGetPrevSessionCrash(),
    getPrevSessionLogTail: () => mockGetPrevSessionLogTail(),
}));

afterEach(() => {
    mockGetPrevSessionCrash.mockReset();
    mockGetPrevSessionLogTail.mockReset();
});

describe('PrevSessionCrashPrompt: no crash', () => {
    it('renders nothing when the previous session did not crash', async () => {
        mockGetPrevSessionCrash.mockReturnValue(null);
        mockGetPrevSessionLogTail.mockReturnValue(null);
        const rendered = render(<PrevSessionCrashPrompt />);
        await waitFor(() => expect(mockGetPrevSessionCrash).toHaveBeenCalled());
        expect(rendered.queryByTestId('prev-crash-banner')).toBeNull();
    });
});

describe('PrevSessionCrashPrompt: previous session crashed', () => {
    it('shows the dismissible banner', async () => {
        mockGetPrevSessionCrash.mockReturnValue({ kind: 'global-error', message: 'boom' });
        mockGetPrevSessionLogTail.mockReturnValue([]);
        const rendered = render(<PrevSessionCrashPrompt />);
        await waitFor(() => expect(rendered.queryByTestId('prev-crash-banner')).not.toBeNull());
        expect(
            rendered.queryByText('⚠ previous session crashed — view / copy report'),
        ).not.toBeNull();
    });

    it('opening the report reuses CrashReportPanel (technical + log-tail + copy testIDs)', async () => {
        mockGetPrevSessionCrash.mockReturnValue({
            kind: 'unhandled-rejection',
            message: 'dangling promise',
        });
        mockGetPrevSessionLogTail.mockReturnValue([
            {
                seq: 1,
                t: 1,
                level: 'error',
                domain: 'error',
                kind: 'unhandled-rejection',
                data: { message: 'dangling promise' },
            },
        ]);
        const rendered = render(<PrevSessionCrashPrompt />);
        await waitFor(() => expect(rendered.queryByTestId('prev-crash-banner')).not.toBeNull());

        fireEvent.press(rendered.getByTestId('prev-crash-view'));

        expect(rendered.queryByTestId('prev-crash-kind')?.props.children).toBe(
            'unhandled-rejection',
        );
        expect(rendered.queryByTestId('prev-crash-technical')).not.toBeNull();
        expect(String(rendered.queryByTestId('prev-crash-technical')?.props.children)).toContain(
            'dangling promise',
        );
        const tail = rendered.queryByTestId('prev-crash-log-tail');
        expect(tail).not.toBeNull();
        expect(String(tail?.props.children)).toContain('error/unhandled-rejection');
        expect(rendered.queryByTestId('prev-crash-copy')).not.toBeNull();
    });

    it('the banner dismiss control hides it without opening the report', async () => {
        mockGetPrevSessionCrash.mockReturnValue({ kind: 'global-error', message: 'boom' });
        mockGetPrevSessionLogTail.mockReturnValue([]);
        const rendered = render(<PrevSessionCrashPrompt />);
        await waitFor(() => expect(rendered.queryByTestId('prev-crash-banner')).not.toBeNull());

        fireEvent.press(rendered.getByTestId('prev-crash-dismiss'));

        expect(rendered.queryByTestId('prev-crash-banner')).toBeNull();
    });

    it('closing the expanded report also dismisses the banner', async () => {
        mockGetPrevSessionCrash.mockReturnValue({ kind: 'global-error', message: 'boom' });
        mockGetPrevSessionLogTail.mockReturnValue([]);
        const rendered = render(<PrevSessionCrashPrompt />);
        await waitFor(() => expect(rendered.queryByTestId('prev-crash-banner')).not.toBeNull());

        fireEvent.press(rendered.getByTestId('prev-crash-view'));
        expect(rendered.queryByTestId('prev-crash-technical')).not.toBeNull();

        fireEvent.press(rendered.getByTestId('prev-crash-close'));

        expect(rendered.queryByTestId('prev-crash-banner')).toBeNull();
    });
});
