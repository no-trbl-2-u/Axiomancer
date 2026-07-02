/**
 * Hermetic e2e — Phase 161 content-parity guard.
 *
 * `src/World/MapEvents/content.ts` is the engine's single source of truth for
 * map-event content. Node-pool overrides are last-write-wins, so two content
 * blocks that both author the same `continent:map:node` silently diverge — the
 * later registration clobbers the earlier one, and the authored pool can never
 * fire. Phase 161 collapsed the fishing-village content to one block and added
 * `getShadowedNodeOverrideKeys()` so that condition is a test failure.
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

    it('fishing-village resolves to the new-player layout, not the legacy pools', () => {
        // The legacy fishing-village block authored fv-1 as a `cutscene` and
        // fv-3 as a `village` shop. The surviving new-player block makes fv-1
        // an encounter, fv-3 a rest node, and fv-6 the pinned boss encounter.
        expect(getNodePrimaryEventKind('coastal-continent', 'fishing-village', 'fv-1')).toBe('encounter');
        expect(getNodePrimaryEventKind('coastal-continent', 'fishing-village', 'fv-3')).toBe('rest');
        expect(getNodePrimaryEventKind('coastal-continent', 'fishing-village', 'fv-6')).toBe('encounter');
        expect(getNodePrimaryEventKind('coastal-continent', 'fishing-village', 'fv-15')).toBe('quest');
    });

    it('northern-forest remains the live source for the kinds fishing-village dropped', () => {
        // northern-forest is unshadowed and carries village/cutscene/interaction
        // so the all-8-MapEventKind invariant still holds after the legacy
        // fishing-village village/cutscene/interaction pools were removed.
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-8')).toBe('village');
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-1')).toBe('cutscene');
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-7')).toBe('interaction');
    });
});
