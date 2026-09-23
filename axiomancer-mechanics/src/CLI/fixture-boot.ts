/**
 * CLI fixture boot — resolves the `--fixture <ref>` flag to a `GameState`.
 *
 * `ref` is either a registry id (`sage-fv-boss-gate`) or a path to a JSON
 * fixture document (anything containing `/`, `\`, or ending in `.json`).
 * Files are validated with the same rules as the registry, so a typo in a
 * node id fails at boot with the field path, not mid-run.
 *
 * Node-only (reads the filesystem); the engine barrel stays platform-free.
 *
 * Functions (lowest → highest abstraction):
 *   looksLikePath(ref)                 id vs path discriminator
 *   resolveStateFixture(ref, readFile) registry lookup or file parse
 *   bootStateFromFixture(ref)          the compiled `GameState`
 *   describeFixtures()                 `--fixture list` text
 */

import fs from 'fs';

import {
    buildStateFromFixture, getStateFixtureById, listStateFixtureIds,
    parseStateFixture, STATE_FIXTURES,
} from '../Game/fixtures';
import type { StateFixture } from '../Game/fixtures';
import type { GameState } from '../Game/types';

/** The `--fixture list` sentinel. */
export const FIXTURE_LIST_REF = 'list';

/** A ref with a path separator or `.json` suffix is a file, else an id. */
export const looksLikePath = (ref: string): boolean =>
    ref.includes('/') || ref.includes('\\') || ref.endsWith('.json');

/**
 * Registry id → fixture, or JSON file → validated fixture. `readFile` is
 * injectable so the hermetic suite never touches disk.
 */
export function resolveStateFixture(
    ref: string,
    readFile: (path: string) => string = p => fs.readFileSync(p, 'utf-8'),
): StateFixture {
    if (looksLikePath(ref)) return parseStateFixture(readFile(ref));
    const fixture = getStateFixtureById(ref);
    if (!fixture) {
        throw new Error(
            `Unknown state fixture '${ref}'. Known ids: ${listStateFixtureIds().join(', ')} ` +
            '(or pass a path to a .json fixture document).',
        );
    }
    return fixture;
}

/** Resolve + compile in one step — the `axiomancer-mechanics/node` barrel
 *  export (`runGameCli` itself calls `resolveStateFixture` +
 *  `buildStateFromFixture` separately so it can read `fixture.arrive`). */
export const bootStateFromFixture = (
    ref: string,
    readFile?: (path: string) => string,
): GameState => buildStateFromFixture(resolveStateFixture(ref, readFile));

/** One line per registry fixture, for `--fixture list`. */
export const describeFixtures = (): string =>
    STATE_FIXTURES.map(f => `  ${f.id.padEnd(28)} ${f.description ?? ''}`).join('\n');
