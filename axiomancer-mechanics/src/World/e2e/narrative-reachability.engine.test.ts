/**
 * Narrative reachability — registry-wide invariant (Phase 53a).
 *
 * `resolveInteraction` falls back silently when an authored `npcName`
 * doesn't resolve in the host map's roster, so a mismatch or a lost NPC
 * never fails anything at runtime — it just quietly ships a dialogue no
 * player can ever reach. Eleven of fourteen authored trees sat unreachable
 * this way before this phase. `auditNarrativeReachability` is the
 * structural guard; this file is the hermetic invariant test over the
 * whole registry, mirroring `e2e/map-traversal.engine.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { MAP_REGISTRY } from '../map.registry';
import { auditNarrativeReachability } from '../narrative-reachability';
import { getNodeEventPool, getNodePrimaryEventKind } from '../MapEvents/resolve-map-event';
import { northernForest } from '../Continents/Coastal-Village/maps';
import type { MapDefinition } from '../types';
// Import for side effect — registers the authored pools when the test loads.
import '../MapEvents/content';

const ALL_MAPS: MapDefinition[] = Object.values(MAP_REGISTRY)
    .flatMap(maps => Object.values(maps))
    .filter((def): def is MapDefinition => def !== undefined);

// Phase 53a — the one accepted exception, carrying a TODO(53c) reason in
// `MapEvents/content.ts` next to `fvShoreInteraction`. Phase 53c reclaims
// the node for a rostered NPC and removes this exception.
const ACCEPTED_UNRESOLVED_NODES = new Set(['fv-19']);

describe('narrative reachability — registry-wide invariant', () => {
    it('registers at least the two coastal maps', () => {
        expect(ALL_MAPS.map(d => d.name)).toEqual(expect.arrayContaining(['fishing-village', 'northern-forest']));
    });

    for (const def of ALL_MAPS) {
        describe(def.name, () => {
            const audit = auditNarrativeReachability(def);

            it('names only rostered NPCs from interaction nodes (apart from the declared fv-19 exception)', () => {
                const unexpected = audit.unresolvedInteractions.filter(
                    u => !ACCEPTED_UNRESOLVED_NODES.has(u.nodeId),
                );
                expect(unexpected, JSON.stringify(unexpected)).toEqual([]);
            });

            it('homes or declares every tree-carrying NPC', () => {
                expect(audit.unreachableNpcs, audit.unreachableNpcs.join(', ')).toEqual([]);
            });
        });
    }
});

describe('northern-forest — Phase 53a mismatch repairs', () => {
    it('nf-7 resolves to Hermit Sage with a dialogue tree attached', () => {
        const pool = getNodeEventPool('coastal-continent', 'northern-forest', 'nf-7');
        const entry = pool?.entries.find(e => e.payload.kind === 'interaction');
        expect(entry).toBeDefined();
        expect(entry?.payload.kind === 'interaction' && entry.payload.npcName).toBe('Hermit Sage');

        const npc = northernForest.npcs?.find(n => n.name === 'Hermit Sage');
        expect(npc?.dialogueTree, 'Hermit Sage must carry the dialogue tree, not just resolve the name').toBeDefined();
    });

    it('nf-14 and nf-23 resolve as cutscene, not interaction — scenery, not people', () => {
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-14')).toBe('cutscene');
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-23')).toBe('cutscene');
    });

    it('reaches 4 of 6 NPCs (up from 3 of 6) — Forest Ranger and Lost Trader stay declared-unstaged', () => {
        const npcNames = new Set((northernForest.npcs ?? []).map(n => n.name));
        const reached = new Set<string>();
        for (const node of northernForest.nodes) {
            const pool = getNodeEventPool('coastal-continent', 'northern-forest', node.id);
            for (const entry of pool?.entries ?? []) {
                if (entry.payload.kind === 'interaction' && npcNames.has(entry.payload.npcName)) {
                    reached.add(entry.payload.npcName);
                }
            }
        }
        expect([...reached].sort()).toEqual(
            ['Hermit Sage', 'Shrine Keeper', 'The Chronicler', 'The Wandering Philosopher'].sort(),
        );

        const unstagedNames = (northernForest.unstagedNpcs ?? []).map(u => u.name).sort();
        expect(unstagedNames).toEqual(['Forest Ranger', 'Lost Trader']);
    });
});
