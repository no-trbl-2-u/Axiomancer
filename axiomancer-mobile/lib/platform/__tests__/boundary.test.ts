/**
 * Boundary guard — phase 47a. Enforces the Expo-decouple seam
 * mechanically: application source must import Expo packages through
 * `lib/platform/*`, never directly. Mirrors
 * `state/e2e/hermeticity.audit.engine.test.ts`'s committed-source
 * file-scan pattern (a sanctioned exception to the no-disk-I/O rule —
 * the inputs are deterministic, versioned, and self-contained).
 *
 * Test files are exempt: they mock by resolved specifier
 * (`jest.mock('expo-image', ...)` etc.), and Jest's module registry
 * intercepts that specifier regardless of how many re-export hops sit
 * between the mock and the component under test — see phase 47a's
 * brief for the full reasoning. `router.ts` moved off this pattern in
 * phase 47b (it's `@react-navigation/*`-backed now, not an
 * `expo-router` re-export) — its own test files mock
 * `@/lib/platform/router` directly instead.
 */

import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const SCAN_DIRS = ['app', 'components', 'hooks', 'lib', 'state'];

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
    return out;
}

const ALL_FILES = SCAN_DIRS.flatMap((d) => walk(path.join(REPO_ROOT, d))).map((f) => ({
    rel: path.relative(REPO_ROOT, f).replace(/\\/g, '/'),
    text: readFileSync(f, 'utf8'),
}));

const GUARDED_PACKAGES = [
    'expo-router',
    'expo-image',
    'expo-haptics',
    'expo-font',
    'expo-splash-screen',
    'expo-navigation-bar',
    'expo-status-bar',
    'expo-constants',
];

const IMPORT_PATTERN = new RegExp(
    `from\\s+['"](${GUARDED_PACKAGES.join('|')})['"]`,
);

function stripComments(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('expo-decouple boundary guard (phase 47a)', () => {
    it('no application source outside lib/platform/ imports expo-* directly', () => {
        const offenders = ALL_FILES.filter(
            (f) =>
                !f.rel.startsWith('lib/platform/') &&
                !f.rel.includes('/__tests__/') &&
                !/\.test\.tsx?$/.test(f.rel) &&
                !f.rel.startsWith('state/e2e/') &&
                IMPORT_PATTERN.test(stripComments(f.text)),
        ).map((f) => f.rel);
        expect(offenders).toEqual([]);
    });

    it('every lib/platform/* module re-exports exactly one expo-* package', () => {
        // router.ts is exempt starting phase 47b: it's no longer a pure
        // re-export (it stopped importing `expo-router` entirely and is
        // now `@react-navigation/*`-backed) — the seam it provides is
        // still "one file owns the swap," just not via this narrower
        // one-package-re-export shape the other lib/platform/* files use.
        // haptics.ts and status-bar.ts are exempt starting phase 47d for
        // the same reason: haptics.ts is now `react-native-haptic-feedback`
        // backed, status-bar.ts now re-exports React Native core's own
        // `StatusBar` — neither imports an `expo-*` package anymore.
        const EXEMPT = new Set([
            'lib/platform/router.ts',
            'lib/platform/haptics.ts',
            'lib/platform/status-bar.ts',
        ]);
        const shims = ALL_FILES.filter(
            (f) =>
                f.rel.startsWith('lib/platform/') &&
                !f.rel.includes('/__tests__/') &&
                !EXEMPT.has(f.rel),
        );
        // -3: expo-router, expo-haptics, expo-status-bar no longer have a
        // pure-reexport shim (all three excluded above) — the other 5
        // guarded packages still do.
        expect(shims.length).toBeGreaterThanOrEqual(GUARDED_PACKAGES.length - 3);
        for (const shim of shims) {
            const matches = stripComments(shim.text).match(
                new RegExp(`from\\s+['"](${GUARDED_PACKAGES.join('|')})['"]`, 'g'),
            );
            expect(matches).not.toBeNull();
            expect(new Set(matches).size).toBe(1);
        }
    });
});
