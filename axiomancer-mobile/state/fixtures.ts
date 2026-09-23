/**
 * Mobile state-fixture boot — the UI twin of the CLI's `--fixture` flag.
 *
 * A browser harness (Playwright) or a hand-typed URL can ask the app to
 * boot from a declarative `StateFixture` (engine `src/Game/fixtures`)
 * instead of the persisted save. Same registry ids as the CLI, so one
 * fixture proves a feature on both surfaces.
 *
 * Request channels, in precedence order (mirrors `state/minigame-seeds.ts`):
 *   1. `globalThis.__AXM_FIXTURE__` — a registry id OR an inline fixture
 *      object, set by `page.addInitScript` before boot
 *      (`scripts/fixture-injector.mjs`).
 *   2. `?fixture=<id>` on the web URL — hand-typable deep link.
 *
 * Gate: honoured only when `isDevToolsEnabled()` is true (dev builds, or an
 * export with `__AXM_FORCE_DEV_TOOLS__`). Production ignores both channels
 * and logs why, so a stray query string can never seed a player's game.
 *
 * The booted run is EPHEMERAL: `createFixtureBootAdapter` never touches
 * AsyncStorage, so a tester's real save slot survives a fixture session.
 *
 * Functions (lowest → highest abstraction):
 *   readLocationSearch()            the web `?query` (empty off-web)
 *   readFixtureRequest(search)      which channel asked, and for what
 *   resolveFixtureRequest(request)  id → registry fixture / object → validated
 *   resolveBootFixture(options)     gate + resolve + build; memoised for the boot
 *   getBootFixture()                the memo (FixtureBoot and the index route read it)
 */

import {
    buildStateFromFixture,
    getLogger,
    getStateFixtureById,
    listStateFixtureIds,
    validateStateFixture,
    type GameState,
    type StateFixture,
} from '@mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';

declare global {
    var __AXM_FIXTURE__: string | StateFixture | undefined;
}

/** The URL query key: `/exploration?fixture=sage-fv-boss-gate`. */
export const FIXTURE_QUERY_PARAM = 'fixture';

export type FixtureRequestSource = 'global' | 'url';

/** What asked for a fixture and what it asked for. */
export interface FixtureRequest {
    readonly source: FixtureRequestSource;
    readonly ref: string | StateFixture;
}

/** A resolved boot: the fixture that asked and the state it compiled to. */
export interface BootFixture {
    readonly source: FixtureRequestSource;
    readonly fixture: StateFixture;
    readonly state: GameState;
}

/** The web `location.search`; empty string on native (no `location`). */
export function readLocationSearch(): string {
    const loc = (globalThis as { location?: { search?: string } }).location;
    return typeof loc?.search === 'string' ? loc.search : '';
}

/** Global first, then the URL; `null` when neither asked. */
export function readFixtureRequest(search: string = readLocationSearch()): FixtureRequest | null {
    const fromGlobal = globalThis.__AXM_FIXTURE__;
    if (typeof fromGlobal === 'string' && fromGlobal.length > 0) return { source: 'global', ref: fromGlobal };
    if (fromGlobal && typeof fromGlobal === 'object') return { source: 'global', ref: fromGlobal };
    const fromUrl = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(FIXTURE_QUERY_PARAM);
    return fromUrl ? { source: 'url', ref: fromUrl } : null;
}

/** A registry id → its fixture (throws with the known ids); an object → validated. */
export function resolveFixtureRequest(request: FixtureRequest): StateFixture {
    if (typeof request.ref !== 'string') return validateStateFixture(request.ref);
    const fixture = getStateFixtureById(request.ref);
    if (!fixture) {
        throw new Error(`Unknown state fixture '${request.ref}'. Known ids: ${listStateFixtureIds().join(', ')}.`);
    }
    return fixture;
}

let bootFixture: BootFixture | null = null;

export interface ResolveBootFixtureOptions {
    /** Override the channel read (tests). Defaults to `readFixtureRequest()`. */
    request?: FixtureRequest | null;
    /** Override the gate (tests). Defaults to `isDevToolsEnabled()`. */
    devToolsEnabled?: boolean;
}

/**
 * Decide the boot state for this app launch. Returns `null` (normal boot)
 * when nothing asked, when dev tools are off, or when the request is
 * invalid — every non-null path is logged under the `persistence` channel so
 * a harness can read the outcome from `__AXM_LOG__`.
 */
export function resolveBootFixture(options: ResolveBootFixtureOptions = {}): BootFixture | null {
    const request = options.request === undefined ? readFixtureRequest() : options.request;
    if (request === null) return null;
    const enabled = options.devToolsEnabled ?? isDevToolsEnabled();
    const refLabel = typeof request.ref === 'string' ? request.ref : request.ref.id;
    if (!enabled) {
        getLogger().warn('persistence', 'fixture-boot-ignored', { ref: refLabel, source: request.source, reason: 'dev-tools-disabled' });
        return null;
    }
    try {
        const fixture = resolveFixtureRequest(request);
        const state = buildStateFromFixture(fixture);
        bootFixture = { source: request.source, fixture, state };
        getLogger().info('persistence', 'fixture-boot', {
            id: fixture.id, source: request.source, arrive: fixture.arrive === true,
            map: state.world.currentMap.name, node: state.world.currentMap.currentNode, level: state.player.level,
        });
        return bootFixture;
    } catch (err) {
        getLogger().error('persistence', 'fixture-boot-failed', {
            ref: refLabel, source: request.source, message: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

/** The fixture this launch booted from, or `null` on a normal boot. */
export const getBootFixture = (): BootFixture | null => bootFixture;

/** Test hook: forget the memo between cases. */
export function resetBootFixtureForTests(): void {
    bootFixture = null;
}
