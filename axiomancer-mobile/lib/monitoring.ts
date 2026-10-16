/**
 * Crash reporting (Sentry) — the native seam.
 *
 * WHY THIS EXISTS. The owner reported the same crash three times ("the app
 * closes when I end my turn") and no harness could ever see it: it is a
 * NATIVE process death on the EAS preview APK, so the JS VM is gone before
 * `ErrorBoundary` — or any `console.error` a Playwright run listens to — can
 * fire. `combat-round-e2e.mjs` played the same path clean on 5 seeds x 20
 * rounds. A crash that kills the process can only be reported by something
 * with a native handler, on the next launch. That is this.
 *
 * WHAT IT COVERS, AND WHAT IT DOES NOT.
 *   · native crashes (SIGSEGV/SIGABRT — the reported symptom) and uncaught
 *     JS errors, with the breadcrumb trail that led to them;
 *   · NOT web. `Platform.OS === 'web'` returns early: the web build is
 *     already covered crash-strict by the e2e harness, and keeping the
 *     static export out of Sentry means CI runs never spend the quota or
 *     pollute the issue list with harness noise.
 *
 * BREADCRUMBS COME FROM THE LOGGER WE ALREADY HAVE. `attachCrashBreadcrumbs`
 * registers a third sink on `state/logging.ts`'s existing fan-out (console
 * mirror, crash tail, Sentry), so every structured log line the engine
 * and the app already emit rides along with the crash automatically. No
 * parallel breadcrumb API, no new call sites — the trail is whatever the
 * session logged.
 *
 * PERFORMANCE, PREVIEW ONLY. On an EAS `preview` build the client also
 * samples traces: native slow/frozen frames, app start, one transaction per
 * screen (React Navigation), and one span per combat drag (`startDragSpan`).
 * Production keeps its quota for crashes; web never starts a client at all.
 * `docs/logging.md` → "Performance (Sentry)" says where to read it.
 *
 * RELEASE PER BUILD. `release` is `com.axiomancer.mobile@<version>+<sha7>`
 * (`lib/sentryRelease.js`), baked on the EAS builder, so each APK is its own
 * release and a crash names the commit it shipped from. JS stacks resolve by
 * the Hermes sourcemap's debug ID, which the build uploads, so symbolication
 * does not depend on the release name.
 *
 * The DSN is public by design (it is embedded in every shipped client and
 * only permits event ingest); it lives in `app.config.ts` extra. The AUTH
 * TOKEN is a different thing entirely — a secret, used only at build time to
 * upload sourcemaps, supplied as the `SENTRY_AUTH_TOKEN` EAS secret and
 * never committed.
 */

import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';
import { Platform } from 'react-native';

import { getLogger, type AxmLogEntry } from '@mechanics';

import { getSentryDsn, getBuildProfile, getSentryRelease } from './buildProfile';

let started = false;
let tracing = false;

/** Trace sample rate on a `preview` build. Only T and testers run preview
 *  APKs, so every drag is worth keeping; lower this if the span quota bites. */
export const PREVIEW_TRACES_SAMPLE_RATE = 1.0;

/** The rate for a build profile: non-zero on `preview` only. */
export function tracesSampleRateFor(profile: string | null): number {
    return profile === 'preview' ? PREVIEW_TRACES_SAMPLE_RATE : 0;
}

/** Per-screen transactions. Registered on the root container by
 *  `registerNavigationTracing` once it is ready. */
const navigationTracing = Sentry.reactNavigationIntegration();

/** Log levels worth carrying as breadcrumbs, mapped to Sentry's own
 *  vocabulary (`warn` is `warning` there). `debug`/`trace` are deliberately
 *  absent: they are far too chatty for a 100-crumb window and would push the
 *  interesting lines out before the crash lands. */
const BREADCRUMB_LEVEL: Record<string, Sentry.SeverityLevel> = {
    info: 'info', warn: 'warning', error: 'error',
};

/**
 * Start Sentry. Idempotent, native-only, and silent when no DSN is
 * configured (a fork or a local checkout without one runs untouched).
 * Called before `initAppLogging` so an early boot crash still reports.
 */
export function initCrashReporting(): void {
    if (started) return;
    if (Platform.OS === 'web') return;
    const dsn = getSentryDsn();
    if (!dsn) return;
    try {
        const profile = getBuildProfile();
        const tracesSampleRate = tracesSampleRateFor(profile);
        const traced = tracesSampleRate > 0;
        const release = getSentryRelease();
        Sentry.init({
            dsn,
            environment: profile ?? 'unknown',
            // One release per build commit; absent off the builder, where
            // the SDK's own default stands.
            ...(release ? { release } : {}),
            // Crashes only, except on preview: tracing elsewhere would eat
            // the free tier's budget for the one signal production needs.
            tracesSampleRate,
            // Frames and app start ride on tracing, so they are switched on
            // with it and off without it, never left to the SDK's defaults.
            enableNativeFramesTracking: traced,
            enableAppStartTracking: traced,
            integrations: traced ? [navigationTracing] : [],
            // The reported crash is native; this is the whole point.
            enableNative: true,
            attachStacktrace: true,
            // Our own sink feeds breadcrumbs (below). Console breadcrumbs
            // would duplicate every line, since sink 1 mirrors to console.
            enableCaptureFailedRequests: false,
        });
        tracing = traced;
        started = true;
    } catch {
        /* crash reporting must never be the thing that breaks play */
    }
}

/** True once `initCrashReporting` has actually started a client. */
export function isCrashReportingActive(): boolean {
    return started;
}

/** True when this client samples performance data (a preview build). */
export function isPerformanceTracingActive(): boolean {
    return tracing;
}

/**
 * Hand the root navigation container to Sentry so each screen gets its own
 * transaction, carrying that screen's slow/frozen frames. Call from the
 * container's `onReady`. A no-op when tracing is off.
 */
export function registerNavigationTracing(containerRef: unknown): void {
    if (!tracing) return;
    try {
        navigationTracing.registerNavigationContainer(containerRef);
    } catch { /* never break play */ }
}

/** The three combat drags, named by where the drag starts. */
export type DragSpanKind = 'hand-to-play' | 'die-to-card' | 'play-to-hand';
/** How a drag ended: released, cancelled by the gesture, or force-finalized
 *  by the interrupt recovery. */
export type DragSpanOutcome = 'dropped' | 'cancelled' | 'interrupted';
export type DragSpanEnd = (outcome: DragSpanOutcome) => void;

const NO_SPAN: DragSpanEnd = () => undefined;

/**
 * Open a `combat.drag.<kind>` span (op `ui.drag`) and return the function
 * that closes it with its outcome. Carries no game state, card ids or player
 * data. Returns a no-op when tracing is off; never throws.
 */
export function startDragSpan(kind: DragSpanKind): DragSpanEnd {
    if (!tracing) return NO_SPAN;
    try {
        const span = Sentry.startInactiveSpan({ name: `combat.drag.${kind}`, op: 'ui.drag', forceTransaction: true });
        let open = true;
        return (outcome) => {
            if (!open) return;
            open = false;
            try {
                span.setAttribute('outcome', outcome);
                span.end();
            } catch { /* never break play */ }
        };
    } catch {
        return NO_SPAN;
    }
}

/**
 * Feed the app's structured log into Sentry as breadcrumbs. Registered
 * AFTER `initAppLogging` (which calls `configureLogging`, replacing the
 * logger and its sinks). Fire-and-forget: a breadcrumb failure is swallowed,
 * exactly like the other two sinks.
 */
export function attachCrashBreadcrumbs(): void {
    if (!started) return;
    try {
        getLogger().addSink((entry: AxmLogEntry) => {
            try {
                const level = BREADCRUMB_LEVEL[entry.level];
                if (!level) return;
                Sentry.addBreadcrumb({
                    category: entry.domain,
                    message: entry.kind,
                    level,
                    data: entry.data as Record<string, unknown> | undefined,
                });
            } catch { /* never break play */ }
        });
    } catch { /* never break play */ }
}

/**
 * Wrap the root component so Sentry sees render errors and the native
 * lifecycle. A no-op passthrough when reporting never started, so the tree
 * is untouched on web and in DSN-less checkouts.
 */
export function withCrashReporting(Root: ComponentType): ComponentType {
    if (!started) return Root;
    try {
        // `Sentry.wrap` is typed against a props-bearing component; the root
        // takes none, so the cast is the narrowing, not a lie.
        return Sentry.wrap(Root as ComponentType<Record<string, unknown>>) as ComponentType;
    } catch {
        return Root;
    }
}

/** The two crashes the dev screen can force, to prove reporting end to end. */
export type TestCrashKind = 'js' | 'native';

/**
 * Deliberately crash the app so a real report can be checked in Sentry:
 * `js` throws an uncaught error off the render path (the global handler
 * reports it as fatal), `native` aborts the process through the SDK. Dev
 * screen only (`DebugCrashTest`). Returns false, and does nothing, when no
 * client is running, so a DSN-less build never kills itself for nothing.
 */
export function triggerTestCrash(kind: TestCrashKind): boolean {
    if (!started) return false;
    if (kind === 'native') {
        Sentry.nativeCrash();
        return true;
    }
    setTimeout(() => {
        throw new Error('AXM test crash (js) from the dev screen');
    }, 0);
    return true;
}
