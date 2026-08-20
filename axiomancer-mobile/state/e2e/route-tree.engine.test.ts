/**
 * Hermetic E2E Tests — route registration
 *
 * Pre-phase-47b this guarded Expo Router's `require.context` file
 * discovery (a stray `.ts` helper under `app/` could silently become a
 * misdiscovered route or `_layout` conflict). Phase 47b replaced that
 * discovery mechanism with explicit registration: every screen is now
 * an imported component passed as a `<Stack.Screen component={...}>` /
 * `<Tabs.Screen component={...}>` prop in `app/_layout.tsx` /
 * `app/(tabs)/_layout.tsx` (`lib/platform/router.ts`'s brief has the
 * full swap rationale). The failure class this test now guards against
 * is the modern equivalent: a route file under `app/` that nothing
 * registers (orphaned — unreachable in the built app), or a
 * registration whose `name` points at a file that doesn't exist
 * (stale — points at nothing).
 *
 * Source-grep rather than router-mount: the layout files render a real
 * `NavigationContainer` which needs native modules mount tests don't
 * have; reading the source as text + cross-checking the file tree
 * gives the same catch-rate for this bug class without that overhead.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { describe, it, expect } from '@jest/globals';
import { promises as fs } from 'fs';
import * as path from 'path';

const APP_ROOT = path.resolve(__dirname, '..', '..', 'app');
const ROOT_LAYOUT = path.join(APP_ROOT, '_layout.tsx');
const TABS_LAYOUT = path.join(APP_ROOT, '(tabs)', '_layout.tsx');
const TABS_DIR = path.join(APP_ROOT, '(tabs)');

/** Every `.tsx` route file's expected registration `name`, relative to `root`. */
async function discoverRouteNames(root: string): Promise<string[]> {
    const out: string[] = [];
    async function recurse(dir: string, prefix: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === '__tests__') continue;
            const next = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await recurse(next, prefix ? `${prefix}/${entry.name}` : entry.name);
                continue;
            }
            if (!entry.name.endsWith('.tsx')) continue;
            const basename = entry.name.replace(/\.tsx$/, '');
            if (basename === '_layout') continue;
            out.push(prefix ? `${prefix}/${basename}` : basename);
        }
    }
    await recurse(root, '');
    return out.sort();
}

/** Extract every `<Tag.Screen name="...">` value from a JSX source string. */
function extractScreenNames(source: string, tag: 'Stack' | 'Tabs'): string[] {
    const re = new RegExp(`<${tag}\\.Screen\\b[^>]*?\\bname=(["'])([^"']+)\\1`, 'g');
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) out.push(m[2]);
    return out;
}

describe('route registration: every app/*.tsx route file is wired to a Stack.Screen', () => {
    it('root-level route files match a registered <Stack.Screen name>, and vice versa', async () => {
        const [source, tabsSource, discovered] = await Promise.all([
            fs.readFile(ROOT_LAYOUT, 'utf8'),
            fs.readFile(TABS_LAYOUT, 'utf8'),
            discoverRouteNames(APP_ROOT),
        ]);
        // `(tabs)/**` files are registered as Tabs.Screen in the nested
        // layout, not as root Stack.Screen entries — excluded here and
        // checked against tabsSource in the next `it`.
        const rootFiles = discovered.filter((f) => !f.startsWith('(tabs)/'));
        const registered = extractScreenNames(source, 'Stack');

        expect(registered).toContain('(tabs)'); // the nested tab layout itself
        const missing = rootFiles.filter((f) => !registered.includes(f));
        const stale = registered.filter((n) => n !== '(tabs)' && !rootFiles.includes(n));
        expect({ missing, stale }).toEqual({ missing: [], stale: [] });

        // Every registered Stack.Screen (bar the nested layout) declares
        // a `component` prop — without one, react-navigation renders
        // nothing for that route (no more file-tree fallback to resolve
        // it from).
        for (const name of rootFiles) {
            const screenBlockRe = new RegExp(
                `<Stack\\.Screen\\b[^>]*?\\bname=(["'])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1[^>]*?\\bcomponent=`,
            );
            expect(screenBlockRe.test(source)).toBe(true);
        }
        void tabsSource; // read for the Promise.all above; asserted in the next `it`
    });

    it('(tabs)/**.tsx route files match a registered <Tabs.Screen name>, and vice versa', async () => {
        const [tabsSource, discovered] = await Promise.all([
            fs.readFile(TABS_LAYOUT, 'utf8'),
            discoverRouteNames(TABS_DIR),
        ]);
        const registered = extractScreenNames(tabsSource, 'Tabs');
        const missing = discovered.filter((f) => !registered.includes(f));
        const stale = registered.filter((n) => !discovered.includes(n));
        expect({ missing, stale }).toEqual({ missing: [], stale: [] });

        for (const name of discovered) {
            const screenBlockRe = new RegExp(
                `<Tabs\\.Screen\\b[^>]*?\\bname=(["'])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1[^>]*?\\bcomponent=`,
            );
            expect(screenBlockRe.test(tabsSource)).toBe(true);
        }
    });
});

describe('route registration: layout files', () => {
    it('only `_layout.tsx` files exist under app/ (no `_layout.<anything>.ts` decoys)', async () => {
        async function walk(dir: string, out: string[] = []): Promise<string[]> {
            for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
                if (entry.name === '__tests__') continue;
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) await walk(full, out);
                else out.push(path.relative(APP_ROOT, full).replace(/\\/g, '/'));
            }
            return out;
        }
        const files = await walk(APP_ROOT);
        const offending = files.filter((f) => /(^|\/)_layout\.[^/]+\.[jt]sx?$/.test(f));
        expect(offending).toEqual([]);
    });
});
