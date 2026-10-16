/**
 * Crash reporting — the WEB seam. Same surface as `./monitoring.ts`, no Sentry.
 *
 * WHY A SEPARATE FILE. `monitoring.ts` already returns early on web
 * (`Platform.OS === 'web'`), but the early return happens at RUNTIME —
 * Metro still resolves `@sentry/react-native` for the web platform, and on
 * web that package re-exports the whole browser SDK: core, replay, feedback,
 * browser-utils, ~760 KB raw / ~200 KB gzipped of JavaScript that never runs.
 * A `.web.ts` sibling is how Metro drops a module per platform: this file
 * wins the resolution on web, so the import never happens and the static
 * export carries none of it. Native builds keep resolving `monitoring.ts`
 * unchanged.
 *
 * CONTRACT. Every export here mirrors `monitoring.ts` name-for-name and
 * type-for-type, so `app/_layout.tsx` imports `@/lib/monitoring` once and
 * neither platform needs a branch. Keep the two files in step: an export
 * added to one must be added to the other, or the web typecheck breaks.
 */

import type { ComponentType } from 'react';

/** Web never starts a crash client — see the header. No-op. */
export function initCrashReporting(): void {
    /* web: covered crash-strict by the e2e harness, not by Sentry */
}

/** Always false on web: nothing was ever started. */
export function isCrashReportingActive(): boolean {
    return false;
}

/** No client, so no breadcrumb sink to attach. No-op. */
export function attachCrashBreadcrumbs(): void {
    /* web: no sink */
}

/** Identity: the root tree is untouched on web. */
export function withCrashReporting(Root: ComponentType): ComponentType {
    return Root;
}

/** Same rate table as native, so a caller reading it sees one truth; web
 *  never starts a client to apply it. */
export const PREVIEW_TRACES_SAMPLE_RATE = 1.0;

/** Same table as native. Web never applies it. */
export function tracesSampleRateFor(profile: string | null): number {
    return profile === 'preview' ? PREVIEW_TRACES_SAMPLE_RATE : 0;
}

/** Always false on web: no client samples anything. */
export function isPerformanceTracingActive(): boolean {
    return false;
}

/** No client, so no navigation tracing. No-op. */
export function registerNavigationTracing(_containerRef: unknown): void {
    /* web: no client */
}

export type DragSpanKind = 'hand-to-play' | 'die-to-card' | 'play-to-hand';
export type DragSpanOutcome = 'dropped' | 'cancelled' | 'interrupted';
export type DragSpanEnd = (outcome: DragSpanOutcome) => void;

/** No client, so no span: the returned end is a no-op. */
export function startDragSpan(_kind: DragSpanKind): DragSpanEnd {
    return () => undefined;
}

/** The two crashes the dev screen can force (see `monitoring.ts`). */
export type TestCrashKind = 'js' | 'native';

/** Web never starts a client, so there is nothing to prove. Always false. */
export function triggerTestCrash(_kind: TestCrashKind): boolean {
    return false;
}
