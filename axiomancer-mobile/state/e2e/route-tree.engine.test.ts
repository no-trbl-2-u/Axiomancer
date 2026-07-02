/**
 * Hermetic E2E Tests — Expo Router route tree
 *
 * Guard against accidentally checking non-route files (engine helpers,
 * mocks, tests, test utilities) into `app/`. Expo Router's runtime
 * `require.context` accepts every `.ts`/`.tsx` under `app/` and turns
 * each one into a route entry — and a file whose basename-before-the-
 * first-dot is `_layout` (e.g. `_layout.engine.ts`) is detected as a
 * layout. In production builds the first layout-conflict winner stays
 * mounted, which means a stray `_layout.engine.ts` can replace the real
 * `_layout.tsx` and break every child route with the "Unmatched Route"
 * screen.
 *
 * This test reproduces Expo Router's discovery logic (regex from
 * `expo-router/_ctx.android.js` + `getFileMeta` from
 * `expo-router/build/getRoutesCore.js`) and pins the allowed route set.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { describe, it, expect } from '@jest/globals';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mirrors `_ctx.android.js` (and the ios/web variants ship the same
// regex). Keep in sync if Expo Router changes the pattern.
const EXPO_ROUTER_CTX_REGEX =
    /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)|(?:\+middleware)))\.[tj]sx?$).*(?:\.ios|\.web)?\.[tj]sx?$/;

const VALID_PLATFORMS = new Set(['android', 'ios', 'native', 'web']);

interface FileMeta {
    /** ./-prefixed contextKey, as Expo Router sees it. */
    contextKey: string;
    /** Route path with the file extension stripped. */
    route: string;
    /** True when basename-before-first-dot equals `_layout`. */
    isLayout: boolean;
    /** False when the file ends with an unrecognised platform suffix. */
    isPlatformIncluded: boolean;
}

async function walkAppDir(appRoot: string): Promise<string[]> {
    const out: string[] = [];
    async function recurse(dir: string, rel: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const next = path.join(dir, entry.name);
            const nextRel = rel + entry.name;
            if (entry.isDirectory()) {
                await recurse(next, nextRel + '/');
            } else {
                out.push(nextRel);
            }
        }
    }
    await recurse(appRoot, './');
    return out;
}

function stripExtensions(name: string): string {
    return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}

function getFileMeta(contextKey: string): FileMeta {
    const cleaned = contextKey.replace(/^(?:\.\.?\/)+/g, '');
    const route = stripExtensions(cleaned);
    const filename = cleaned.split('/').pop() ?? '';
    const [filenameWithoutExtensions, platformExtension] =
        stripExtensions(filename).split('.');
    const isLayout = filenameWithoutExtensions === '_layout';
    const isPlatformIncluded =
        platformExtension === undefined || VALID_PLATFORMS.has(platformExtension);
    return { contextKey, route, isLayout, isPlatformIncluded };
}

const APP_ROOT = path.resolve(__dirname, '..', '..', 'app');

/**
 * The exhaustive set of files that Expo Router is *expected* to see
 * under `app/`. Adding a new screen? Add it here and ship the screen
 * in the same PR. Adding a helper, test, or mock? Put it OUTSIDE
 * `app/` (see docs/testing.md).
 */
const EXPECTED_ROUTE_FILES: ReadonlySet<string> = new Set([
    './_layout.tsx',
    './index.tsx',
    './event/index.tsx',
    // Hazard minigame (design handoff 2026-06-10).
    './hazard/index.tsx',
    // Spec 25 — Hazard-Pattern Combat: card-and-dice status combat,
    // launched from the dev tools (DebugCombatEncounterButton) and the
    // forthcoming encounter wiring.
    './combat-encounter/index.tsx',
    // Phase 126 — persistent Hazard deck / library + remove-card grid,
    // reachable from the SELF tab outside an encounter.
    './hazard-deck/index.tsx',
    // Gathering minigame — "The Gleaning" (Forage archetype).
    './gathering/index.tsx',
    // Phase 137 — dedicated encounter screens: the Quest Board
    // ("The Boy's Almanac"), Rest ("The Night Watch"), Loot Cache
    // ("The Reliquary"), and the paced-event splits (village /
    // dialogue / cutscene).
    './quest/index.tsx',
    './rest/index.tsx',
    './cache/index.tsx',
    './village/index.tsx',
    './dialogue/index.tsx',
    './cutscene/index.tsx',
    // Dev-only enemy-art gallery (visual-audit 2026-06); gated by
    // isDevToolsEnabled() so production renders an empty view.
    './devart/index.tsx',
    // Dev-only aftermath-panel gallery (visual-audit 2026-06); same
    // isDevToolsEnabled() gate — renders the defeat / parley panels
    // that have no organic combat-capture path.
    './devaftermath/index.tsx',
    // Phase 132 — dedicated dev-tools route. The SELF tab's DEV MENU
    // dropdown was extracted here; gated by isDevToolsEnabled() so
    // production renders an inert placeholder.
    './dev/index.tsx',
    './(tabs)/_layout.tsx',
    './(tabs)/character/index.tsx',
    './(tabs)/exploration/index.tsx',
    './(tabs)/inventory/index.tsx',
    // Phase 33 (2026-05-16) added the fifth tab.
    './(tabs)/memoir/index.tsx',
]);

describe('Expo Router route tree: only route files live under app/', () => {
    it('matches the pinned set exactly — no rogue engine/mock/test files', async () => {
        const files = await walkAppDir(APP_ROOT);
        const discovered = files.filter((f) => EXPO_ROUTER_CTX_REGEX.test(f));
        const discoveredSet = new Set(discovered);

        const unexpected = [...discoveredSet].filter((f) => !EXPECTED_ROUTE_FILES.has(f));
        const missing = [...EXPECTED_ROUTE_FILES].filter((f) => !discoveredSet.has(f));

        expect({ unexpected, missing }).toEqual({ unexpected: [], missing: [] });
    });
});

describe('Expo Router route tree: layout files', () => {
    it('only `_layout.tsx` files are detected as layouts', async () => {
        const files = await walkAppDir(APP_ROOT);
        const matched = files.filter((f) => EXPO_ROUTER_CTX_REGEX.test(f));
        const layouts = matched.map(getFileMeta).filter((m) => m.isLayout);
        const layoutContextKeys = layouts.map((m) => m.contextKey).sort();

        // Crucially, this catches files like `_layout.engine.ts` —
        // they have `filenameWithoutExtensions === '_layout'` and Expo
        // Router treats them as layouts even though they export plain
        // helpers, not a React component.
        expect(layoutContextKeys).toEqual(['./(tabs)/_layout.tsx', './_layout.tsx']);
    });

    it('no `_layout.<anything>.ts` files outside of the canonical `_layout.tsx`', async () => {
        const files = await walkAppDir(APP_ROOT);
        const offending = files.filter((f) => /(^|\/)_layout\.[^/]+\.[jt]sx?$/.test(f));

        expect(offending).toEqual([]);
    });
});

describe('Expo Router route tree: production-style production conflict', () => {
    it('every discovered file ends in .tsx (route components) or is a proper _layout.tsx', async () => {
        // Engine/mock/helper files are .ts (not .tsx) and would slip
        // through the route registration with no default export. Pin
        // the convention: anything under `app/` must be a real React
        // component file.
        const files = await walkAppDir(APP_ROOT);
        const matched = files.filter((f) => EXPO_ROUTER_CTX_REGEX.test(f));
        const nonTsx = matched.filter((f) => !f.endsWith('.tsx'));

        expect(nonTsx).toEqual([]);
    });
});
