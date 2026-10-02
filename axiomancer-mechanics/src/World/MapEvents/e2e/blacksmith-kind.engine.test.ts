/**
 * MapEvents 'blacksmith' kind — hermetic dispatcher
 * coverage. The kind hands the host the authored budget + variant-gear offers;
 * the handler is a validated pass-through (the anvil session is fully
 * sandboxed) that touches no state and rejects illegal (cap-violating) variant
 * gear at resolution time.
 *
 * Also pins where the kind lives in play: one Anvil per Act 1 region, near
 * its exit — `ACT1_ANVIL_NODES` (bw-16, cw-18, bc-12, ld-14).
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { applyPayload, resolveBlacksmith } from '../handlers';
import { resolveMapEvent, getNodePrimaryEventKind } from '../resolve-map-event';
import { ACT1_ANVIL_NODES } from '../content';
import { MAP_REGISTRY, createMapState } from '../../map.registry';
import { BLACKSMITH_WITNESS_VARIANTS, HEART_RICH_PAYLOAD_VARIANT } from '../../Blacksmith/blacksmith.content';
import type { BlacksmithPayload } from '../types';
import type { MapDefinition } from '../../types';
import type { GameState } from '../../../Game/types';

const PAYLOAD: BlacksmithPayload = {
    kind: 'blacksmith',
    budget: 12,
    variants: [HEART_RICH_PAYLOAD_VARIANT],
};

describe("MapEvents 'blacksmith' kind", () => {
    it('resolves to the authored budget + variants without touching state', () => {
        const state = createNewGameState();
        const result = resolveBlacksmith(state, PAYLOAD);
        expect(result.state).toBe(state);
        expect(result.event).toEqual({
            kind: 'blacksmith',
            budget: 12,
            variants: [HEART_RICH_PAYLOAD_VARIANT],
        });
    });

    it('defaults an omitted budget to 0 and variants to empty', () => {
        const state = createNewGameState();
        const result = resolveBlacksmith(state, { kind: 'blacksmith' });
        expect(result.event).toEqual({ kind: 'blacksmith', budget: 0, variants: [] });
    });

    it('dispatches through applyPayload', () => {
        const state = createNewGameState();
        const result = applyPayload(state, PAYLOAD, () => 0.5);
        expect(result.event.kind).toBe('blacksmith');
    });

    it('rejects a cap-violating variant at resolution time', () => {
        const state = createNewGameState();
        const bad: BlacksmithPayload = {
            kind: 'blacksmith',
            variants: [{
                id: 'bad-variant',
                name: 'Overforged',
                gear: { dieColor: 'heart', specialFaces: 3, manaFaces: 2, specialConviction: 2 },
            }],
        };
        expect(() => resolveBlacksmith(state, bad)).toThrow(/illegal blacksmith variant/);
    });
});

// ── The four regional Anvils ────────────────────────────────────────────────

const ACT1_MAPS = ['breakwater', 'charcoal-wood', 'beacon-crags', 'lantern-deep'] as const;

/** The registered definition of an Act 1 map, whichever continent holds it. */
function act1Map(name: string): MapDefinition {
    const def = Object.values(MAP_REGISTRY)
        .flatMap(maps => Object.values(maps))
        .find((d): d is MapDefinition => d !== undefined && d.name === name);
    if (!def) throw new Error(`${name} is not registered`);
    return def;
}

/** A fresh game standing, unconsumed, on `nodeId` of `def`. */
function standingOn(def: MapDefinition, nodeId: string): GameState {
    const base = createNewGameState();
    return {
        ...base,
        world: { ...base.world, currentMap: { ...createMapState(def), currentNode: nodeId } },
    };
}

describe('the regional Anvils — one per Act 1 map (D61, R3b)', () => {
    it('names exactly one Anvil node for each Act 1 map', () => {
        expect(ACT1_ANVIL_NODES).toEqual({
            'breakwater':    'bw-16',
            'charcoal-wood': 'cw-18',
            'beacon-crags':  'bc-12',
            'lantern-deep':  'ld-14',
        });
    });

    it.each(ACT1_MAPS.map(m => [m, ACT1_ANVIL_NODES[m]!]))(
        '%s: %s resolves to a blacksmith offering the witness variants at budget 12',
        (mapName, nodeId) => {
            const def = act1Map(mapName);
            const result = resolveMapEvent(standingOn(def, nodeId), () => 0.5);
            expect(result.event.kind).toBe('blacksmith');
            if (result.event.kind !== 'blacksmith') return;
            expect(result.event.budget).toBe(12);
            expect(result.event.variants).toEqual(BLACKSMITH_WITNESS_VARIANTS);
            expect(result.event.variants.map(v => v.id)).toContain(HEART_RICH_PAYLOAD_VARIANT.id);
        },
    );

    it.each(ACT1_MAPS.map(m => [m]))('%s carries exactly one Anvil, and it is the named node', mapName => {
        const def = act1Map(mapName);
        const anvils = def.nodes
            .filter(n => getNodePrimaryEventKind(def.continent, def.name, n.id) === 'blacksmith')
            .map(n => n.id);
        expect(anvils).toEqual([ACT1_ANVIL_NODES[mapName]]);
    });
});
