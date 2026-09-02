/**
 * Hermetic tests — `<CrashReportPanel>`, the shared technical-panel +
 * COPY + RECENT LOG rendering `ErrorBoundary` and `PrevSessionCrashPrompt`
 * both mount (Phase 77 extraction). `ErrorBoundary.test.tsx` already
 * exercises this through its default `testIDPrefix`; this suite pins
 * the component directly, including the custom-prefix contract the
 * next-launch prompt relies on to avoid testID collisions.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { CrashReportPanel } from '@/components/CrashReportPanel';

describe('CrashReportPanel: default testID prefix', () => {
    it('renders the technical text and an empty-state log tail', () => {
        const rendered = render(
            <CrashReportPanel technical="boom: something broke" logTail={[]} />,
        );
        expect(String(rendered.queryByTestId('error-boundary-technical')?.props.children)).toBe(
            'boom: something broke',
        );
        expect(String(rendered.queryByTestId('error-boundary-log-tail')?.props.children)).toBe(
            '(no recent log entries)',
        );
    });

    it('formats log entries as "seq level domain/kind data"', () => {
        const rendered = render(
            <CrashReportPanel
                technical="boom"
                logTail={[
                    { seq: 3, t: 1, level: 'warn', domain: 'persistence', kind: 'save-slow', data: { ms: 40 } },
                ]}
            />,
        );
        expect(String(rendered.queryByTestId('error-boundary-log-tail')?.props.children)).toContain(
            '3 warn persistence/save-slow',
        );
    });

    it('COPY toggles to COPIED on press', () => {
        const rendered = render(<CrashReportPanel technical="boom" logTail={[]} />);
        expect(rendered.queryByText('✎ COPY')).not.toBeNull();
        fireEvent.press(rendered.getByTestId('error-boundary-copy'));
        expect(rendered.queryByText('✎ COPIED')).not.toBeNull();
    });
});

describe('CrashReportPanel: custom testID prefix', () => {
    it('namespaces every testID under the given prefix', () => {
        const rendered = render(
            <CrashReportPanel technical="boom" logTail={[]} testIDPrefix="prev-crash" />,
        );
        expect(rendered.queryByTestId('prev-crash-technical')).not.toBeNull();
        expect(rendered.queryByTestId('prev-crash-log-tail')).not.toBeNull();
        expect(rendered.queryByTestId('prev-crash-copy')).not.toBeNull();
        expect(rendered.queryByTestId('error-boundary-technical')).toBeNull();
    });
});
