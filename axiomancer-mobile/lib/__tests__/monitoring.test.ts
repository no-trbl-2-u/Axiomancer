/**
 * lib/monitoring — Sentry performance on preview builds only, and the
 * combat drag span seam (phase PF3).
 *
 * `@sentry/react-native` and `@/lib/buildProfile` are mocked per test so the
 * real `initCrashReporting` runs against a chosen build profile; each test
 * re-imports the module because `initCrashReporting` is idempotent.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Monitoring = typeof import('@/lib/monitoring');

const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
const mockSentry = {
    init: jest.fn(),
    wrap: (root: unknown) => root,
    addBreadcrumb: jest.fn(),
    startInactiveSpan: jest.fn((_opts: Record<string, unknown>): unknown => mockSpan),
    reactNavigationIntegration: jest.fn(() => ({ name: 'ReactNavigation', registerNavigationContainer: jest.fn() })),
};
let mockProfile: string | null = null;
let mockDsn: string | null = 'https://public@example.ingest.mockSentry.io/1';

jest.mock('@sentry/react-native', () => mockSentry);
jest.mock('@/lib/buildProfile', () => ({
    getBuildProfile: () => mockProfile,
    getSentryDsn: () => mockDsn,
    isDevToolsEnabled: () => true,
}));

function load(p: string | null): Monitoring {
    mockProfile = p;
    let m!: Monitoring;
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        m = require('@/lib/monitoring') as Monitoring;
    });
    return m;
}

type InitOptions = { tracesSampleRate: number; enableNativeFramesTracking: boolean; enableAppStartTracking: boolean; integrations: unknown[] };
const lastInit = (): InitOptions => mockSentry.init.mock.calls.at(-1)![0] as InitOptions;

beforeEach(() => {
    jest.clearAllMocks();
    mockSentry.startInactiveSpan.mockImplementation(() => mockSpan);
    mockDsn = 'https://public@example.ingest.mockSentry.io/1';
});

describe('initCrashReporting — trace rate per build profile (A1, A2)', () => {
    it('samples traces on preview, with frames, app start and navigation on', () => {
        const m = load('preview');
        m.initCrashReporting();
        const opts = lastInit();
        expect(opts.tracesSampleRate).toBe(m.PREVIEW_TRACES_SAMPLE_RATE);
        expect(m.PREVIEW_TRACES_SAMPLE_RATE).toBeGreaterThan(0);
        expect(opts.enableNativeFramesTracking).toBe(true);
        expect(opts.enableAppStartTracking).toBe(true);
        expect(opts.integrations).toHaveLength(1);
        expect(m.isPerformanceTracingActive()).toBe(true);
    });

    it.each(['production', 'development', 'e2e', null])('stays at 0 with frames and app start off on %p', (p) => {
        const m = load(p);
        m.initCrashReporting();
        const opts = lastInit();
        expect(opts.tracesSampleRate).toBe(0);
        expect(opts.enableNativeFramesTracking).toBe(false);
        expect(opts.enableAppStartTracking).toBe(false);
        expect(opts.integrations).toEqual([]);
        expect(m.isPerformanceTracingActive()).toBe(false);
    });

    it('starts nothing without a DSN, even on preview', () => {
        mockDsn = null;
        const m = load('preview');
        m.initCrashReporting();
        expect(mockSentry.init).not.toHaveBeenCalled();
        expect(m.isPerformanceTracingActive()).toBe(false);
    });

    it('the rate table is preview-only', () => {
        const m = load(null);
        expect(m.tracesSampleRateFor('preview')).toBe(m.PREVIEW_TRACES_SAMPLE_RATE);
        expect(m.tracesSampleRateFor('production')).toBe(0);
        expect(m.tracesSampleRateFor(null)).toBe(0);
    });
});

describe('startDragSpan (A3, A5)', () => {
    it('is a no-op when tracing is off', () => {
        const m = load('production');
        m.initCrashReporting();
        const end = m.startDragSpan('hand-to-play');
        expect(() => end('dropped')).not.toThrow();
        expect(mockSentry.startInactiveSpan).not.toHaveBeenCalled();
    });

    it('opens combat.drag.<kind> with op ui.drag and ends it once with its outcome', () => {
        const m = load('preview');
        m.initCrashReporting();
        const end = m.startDragSpan('die-to-card');
        expect(mockSentry.startInactiveSpan).toHaveBeenCalledWith(expect.objectContaining({ name: 'combat.drag.die-to-card', op: 'ui.drag' }));
        end('cancelled');
        end('dropped');
        expect(mockSpan.setAttribute).toHaveBeenCalledTimes(1);
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('outcome', 'cancelled');
        expect(mockSpan.end).toHaveBeenCalledTimes(1);
    });

    it('carries no attribute but the outcome', () => {
        const m = load('preview');
        m.initCrashReporting();
        m.startDragSpan('play-to-hand')('interrupted');
        const opts = mockSentry.startInactiveSpan.mock.calls[0]![0];
        expect(opts.attributes).toBeUndefined();
        expect(mockSpan.setAttribute.mock.calls.map((c) => c[0])).toEqual(['outcome']);
    });

    it('never throws when the SDK does', () => {
        const m = load('preview');
        m.initCrashReporting();
        mockSentry.startInactiveSpan.mockImplementation(() => { throw new Error('sdk down'); });
        expect(() => m.startDragSpan('hand-to-play')('dropped')).not.toThrow();
        mockSentry.startInactiveSpan.mockImplementation(() => ({ setAttribute: () => { throw new Error('x'); }, end: jest.fn() }));
        expect(() => m.startDragSpan('hand-to-play')('dropped')).not.toThrow();
    });
});

describe('monitoring.web (A3)', () => {
    it('mirrors the drag span surface as a no-op', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const web = require('@/lib/monitoring.web') as Monitoring;
        expect(web.isPerformanceTracingActive()).toBe(false);
        expect(() => web.startDragSpan('hand-to-play')('dropped')).not.toThrow();
        expect(() => web.registerNavigationTracing({})).not.toThrow();
    });
});
