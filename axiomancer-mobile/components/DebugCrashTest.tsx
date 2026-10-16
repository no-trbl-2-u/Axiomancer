/**
 * Dev-only CRASH TEST — force a real crash so a report can be checked in
 * Sentry end to end (symbolicated frames, breadcrumbs, release, alert).
 *
 *   JS CRASH     — an uncaught error thrown off the render path; the global
 *                  handler reports it as fatal and the app closes.
 *   NATIVE CRASH — the SDK aborts the process (`Sentry.nativeCrash`); the
 *                  report is sent on the next launch, so reopen the app.
 *
 * Each button arms on the first tap and fires on the second, so a stray tap
 * never kills a run. Says so, and does nothing, when no crash client is
 * running (web, a DSN-less build). Renders null outside dev builds.
 */

import React, { useState } from 'react';

import { DevButton, DevButtons, DevRow } from '@/components/dev/DevControls';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { isCrashReportingActive, triggerTestCrash, type TestCrashKind } from '@/lib/monitoring';

export function DebugCrashTest() {
    const [armed, setArmed] = useState<TestCrashKind | null>(null);

    if (!isDevToolsEnabled()) return null;
    const active = isCrashReportingActive();

    const onPress = (kind: TestCrashKind) => {
        if (armed !== kind) {
            setArmed(kind);
            return;
        }
        setArmed(null);
        triggerTestCrash(kind);
    };

    const sub = !active
        ? 'no crash client in this build'
        : armed
            ? `tap ${armed.toUpperCase()} CRASH again to crash the app`
            : 'prove a report reaches Sentry · native reports on relaunch';

    return (
        <DevRow label="DEBUG · CRASH TEST" sub={sub} testID="debug-crash">
            {active ? (
                <DevButtons>
                    <DevButton label={armed === 'js' ? 'CONFIRM JS' : 'JS CRASH'} danger onPress={() => onPress('js')} a11y="Crash the app with an uncaught JavaScript error" testID="debug-crash-js" />
                    <DevButton label={armed === 'native' ? 'CONFIRM NATIVE' : 'NATIVE CRASH'} danger onPress={() => onPress('native')} a11y="Crash the app natively" testID="debug-crash-native" />
                </DevButtons>
            ) : null}
        </DevRow>
    );
}
