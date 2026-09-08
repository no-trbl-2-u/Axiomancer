/**
 * Shared utilities for hermetic tests. See `docs/testing.md` for the
 * full hermetic-e2e standard.
 *
 * This folder is excluded from the published build (`tsconfig.json` /
 * `*.test.ts` rules) and must not be imported from production code.
 */

export { mockAlternatingRng, mockFixedRng, mockSequentialRng } from './rng';
export { createFixtureGameStore, resolveFixture } from './fixture-store';
export type { FixtureRef, FixtureGameStoreOptions } from './fixture-store';
