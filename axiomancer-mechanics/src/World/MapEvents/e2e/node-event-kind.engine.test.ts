/**
 * Hermetic e2e — read-only node event-kind inspection API.
 *
 * Lets UI clients ask "what can this node resolve to?" (for icons/tags)
 * without rolling RNG or mutating state, so they don't keep a parallel
 * client-side node-type table. Exercised against the authored content
 * pools, which self-register on import of the World barrel.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import '../content'; // ensure authored pools are registered
import {
    getNodeEventPool,
    getNodeEventKinds,
    getNodePrimaryEventKind,
    registerMapEventPool,
    setNodeEventPoolOverride,
} from '../resolve-map-event';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('node event-kind read API', () => {
    it('reports the authored kind for a known node without rolling', () => {
        // nf-6 is authored as a forest-sprite encounter.
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-6')).toBe(
            'encounter',
        );
        expect(getNodeEventKinds('coastal-continent', 'northern-forest', 'nf-6')).toContain(
            'encounter',
        );
        const pool = getNodeEventPool('coastal-continent', 'northern-forest', 'nf-6');
        expect(pool?.entries.length).toBeGreaterThan(0);
    });

    it('returns empty / undefined for an unregistered node', () => {
        expect(getNodeEventKinds('coastal-continent', 'northern-forest', 'nf-does-not-exist')).toEqual(
            [],
        );
        expect(
            getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-does-not-exist'),
        ).toBeUndefined();
        expect(getNodeEventPool('coastal-continent', 'northern-forest', 'nf-does-not-exist')).toBeUndefined();
    });

    it('primary kind follows the highest-weight entry; distinct kinds preserve order', () => {
        // Hermetic fixture: a weighted multi-kind pool registered on an override.
        const POOL_ID = 'test:weighted-node';
        registerMapEventPool({
            id: POOL_ID,
            entries: [
                {
                    kind: 'gathering',
                    weight: 1,
                    payload: { kind: 'gathering', items: [] },
                },
                {
                    kind: 'encounter',
                    weight: 9,
                    payload: {
                        kind: 'encounter',
                        enemySlug: 'forest-sprite',
                        isBoss: false,
                    },
                },
            ],
        });
        setNodeEventPoolOverride('test-continent', 'test-map', 'tn-1', POOL_ID);

        expect(getNodePrimaryEventKind('test-continent', 'test-map', 'tn-1')).toBe('encounter');
        expect(getNodeEventKinds('test-continent', 'test-map', 'tn-1')).toEqual([
            'gathering',
            'encounter',
        ]);
    });
});
