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

describe('narrative reachability — registry-wide invariant', () => {
    it('registers at least the two coastal maps', () => {
        expect(ALL_MAPS.map(d => d.name)).toEqual(expect.arrayContaining(['fishing-village', 'northern-forest']));
    });

    for (const def of ALL_MAPS) {
        describe(def.name, () => {
            const audit = auditNarrativeReachability(def);

            it('names only rostered NPCs from interaction nodes', () => {
                // Phase 53a's one accepted exception (fv-19's 'Weathered
                // Fisher', naming nobody in the roster) is resolved as of
                // Phase 53c — fv-19 now names the rostered Fisherman's
                // Daughter, so there are no exceptions left to declare.
                expect(audit.unresolvedInteractions, JSON.stringify(audit.unresolvedInteractions)).toEqual([]);
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

    it('nf-23 resolves as cutscene, not interaction — scenery, not people', () => {
        // nf-14 was the same class of scenery-cutscene until adjust-npcs pass
        // 1 (2026-09-05) restaged it as the Lost Trader's interaction node
        // (see the dedicated nf-14 test below); nf-23 is untouched.
        expect(getNodePrimaryEventKind('coastal-continent', 'northern-forest', 'nf-23')).toBe('cutscene');
    });

    it('reaches all 6 of 6 NPCs (adjust-npcs pass 1, 2026-09-05) — Forest Ranger and Lost Trader are now homed', () => {
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
            ['Forest Ranger', 'Hermit Sage', 'Lost Trader', 'Shrine Keeper', 'The Chronicler', 'The Wandering Philosopher'].sort(),
        );

        expect(northernForest.unstagedNpcs ?? []).toEqual([]);
    });

    it('the Forest Ranger is reachable at nf-21, so get-to-cave (Phase 8) can actually be started', () => {
        const pool = getNodeEventPool('coastal-continent', 'northern-forest', 'nf-21');
        const entry = pool?.entries.find(e => e.payload.kind === 'interaction');
        expect(entry).toBeDefined();
        expect(entry?.payload.kind === 'interaction' && entry.payload.npcName).toBe('Forest Ranger');

        const npc = northernForest.npcs?.find(n => n.name === 'Forest Ranger');
        expect(npc?.dialogueTree?.nodes['greet'].choices?.some(c => c.effect?.startQuest === 'get-to-cave')).toBe(true);
    });

    it('the Lost Trader is reachable at nf-14', () => {
        const pool = getNodeEventPool('coastal-continent', 'northern-forest', 'nf-14');
        const entry = pool?.entries.find(e => e.payload.kind === 'interaction');
        expect(entry).toBeDefined();
        expect(entry?.payload.kind === 'interaction' && entry.payload.npcName).toBe('Lost Trader');

        const npc = northernForest.npcs?.find(n => n.name === 'Lost Trader');
        expect(npc?.dialogueTree, 'Lost Trader must carry the dialogue tree, not just resolve the name').toBeDefined();
    });
});
