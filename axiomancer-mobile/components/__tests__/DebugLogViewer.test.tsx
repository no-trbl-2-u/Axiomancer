/**
 * Hermetic component tests — DebugLogViewer (AXM Log dev viewer).
 *
 * Pins the dev-only mount gate, entry rendering (newest first), and
 * level-filter routing. The logger behavior itself is pinned in
 * mechanics (src/Log/e2e) and state/__tests__/logging.test.ts.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { configureLogging, getLogger, resetLoggingForTests } from '@mechanics';

import { DebugLogViewer } from '@/components/DebugLogViewer';

afterEach(() => {
    resetLoggingForTests();
});

function seedEntries(): void {
    configureLogging({ enabled: true, level: 'debug' });
    getLogger().clear();
    getLogger().info('nav', 'route-changed', { pathname: '/dev' });
    getLogger().warn('persistence', 'save-slow');
    getLogger().error('error', 'witness-crash');
}

describe('DebugLogViewer: DEV gate', () => {
    it('renders in dev builds (jest default)', () => {
        seedEntries();
        const tree = render(<DebugLogViewer />);
        expect(tree.queryByTestId('debug-log-viewer')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        const g = global as Record<string, unknown>;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            seedEntries();
            const tree = render(<DebugLogViewer />);
            expect(tree.queryByTestId('debug-log-viewer')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugLogViewer: entries', () => {
    it('renders buffered entries newest-first', () => {
        seedEntries();
        const tree = render(<DebugLogViewer />);
        const rows = tree.getAllByTestId('debug-log-entry');
        expect(rows.length).toBe(3);
        const texts = rows.map((r) => String(r.props.children));
        expect(texts[0]).toContain('error/witness-crash');
        expect(texts[2]).toContain('nav/route-changed');
    });

    it('filters by minimum level via the chips', () => {
        seedEntries();
        const tree = render(<DebugLogViewer />);
        fireEvent.press(tree.getByTestId('debug-log-level-error'));
        const rows = tree.getAllByTestId('debug-log-entry');
        expect(rows.length).toBe(1);
        expect(String(rows[0].props.children)).toContain('witness-crash');
    });

    it('filters by domain via the chips', () => {
        seedEntries();
        const tree = render(<DebugLogViewer />);
        fireEvent.press(tree.getByTestId('debug-log-domain-nav'));
        const rows = tree.getAllByTestId('debug-log-entry');
        expect(rows.length).toBe(1);
        expect(String(rows[0].props.children)).toContain('route-changed');
    });

    it('CLEAR empties the visible list', () => {
        seedEntries();
        const tree = render(<DebugLogViewer />);
        fireEvent.press(tree.getByTestId('debug-log-clear'));
        expect(tree.queryAllByTestId('debug-log-entry')).toHaveLength(0);
        expect(tree.queryByText('(no entries)')).not.toBeNull();
    });
});
