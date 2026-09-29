/**
 * Hermetic e2e — Phase 161 content-parity guard.
 *
 * `src/World/MapEvents/content.ts` is the engine's single source of truth for
 * map-event content. Node-pool overrides are last-write-wins, so two content
 * blocks that both author the same `continent:map:node` silently diverge — the
 * later registration clobbers the earlier one, and the authored pool can never
 * fire. Phase 161 collapsed the (since purged, R3b) fishing-village content to
 * one block and added `getShadowedNodeOverrideKeys()` so that condition is a
 * test failure.
 *
 * The guard clears the registry, replays `registerMapEventContent()`, then
 * asserts no node was authored more than once.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    _clearMapEventPoolRegistry,
    getShadowedNodeOverrideKeys,
    getNodePrimaryEventKind,
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

    it('northern-forest remains the live source for the kinds Act 1 does not author', () => {
        // northern-forest is unshadowed and carries village/cutscene/interaction
        // so the all-MapEventKind invariant still holds: no Act 1 map authors
        // a village or an interaction.
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-8')).toBe('village');
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-1')).toBe('cutscene');
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-7')).toBe('interaction');
    });
});
