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
