/**
 * Hermetic e2e — content-parity guard.
 *
 * `src/World/MapEvents/content.ts` is the engine's single source of truth for
 * map-event content. Node-pool overrides are last-write-wins, so two content
 * blocks that both author the same `continent:map:node` silently diverge — the
 * later registration clobbers the earlier one, and the authored pool can never
 * fire. `getShadowedNodeOverrideKeys()` makes that condition a test failure.
 *
 * The guard clears the registry, replays `registerMapEventContent()`, then
 * asserts no node was authored more than once.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    _clearMapEventPoolRegistry,
    getShadowedNodeOverrideKeys,
} from '../resolve-map-event';
import { registerMapEventContent } from '../content';

beforeEach(() => {
    _clearMapEventPoolRegistry();
    registerMapEventContent();
});

describe('Phase 161 — map-event content has one source of truth', () => {
    it('registers no node-override more than once (no silent shadowing)', () => {
        const shadowed = getShadowedNodeOverrideKeys();
        expect(
            shadowed,
            `these node overrides were authored more than once and silently ` +
            `clobbered each other (last-write-wins): ${shadowed.join(', ')}`,
        ).toEqual([]);
    });
});
