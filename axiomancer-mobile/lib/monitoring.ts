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
 * mirror, crash tail, now Sentry), so every structured log line the engine
 * and the app already emit rides along with the crash automatically. No
 * parallel breadcrumb API, no new call sites — the trail is whatever the
 * session logged.
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

import { getSentryDsn, getBuildProfile } from './buildProfile';

let started = false;

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
        Sentry.init({
            dsn,
            environment: getBuildProfile() ?? 'unknown',
            // Crashes only. Tracing/replay would eat the free tier's budget
            // for the one signal we actually need.
            tracesSampleRate: 0,
            // The reported crash is native; this is the whole point.
            enableNative: true,
            attachStacktrace: true,
            // Our own sink feeds breadcrumbs (below). Console breadcrumbs
            // would duplicate every line, since sink 1 mirrors to console.
            enableCaptureFailedRequests: false,
        });
        started = true;
    } catch {
        /* crash reporting must never be the thing that breaks play */
    }
}

/** True once `initCrashReporting` has actually started a client. */
export function isCrashReportingActive(): boolean {
    return started;
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
