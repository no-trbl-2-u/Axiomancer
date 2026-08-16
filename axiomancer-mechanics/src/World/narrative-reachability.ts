/**
 * Narrative reachability audit (Phase 53a).
 *
 * `resolveInteraction` (`MapEvents/handlers.ts`) looks an NPC up by display
 * name against the host map's roster and falls back silently when the name
 * is absent — a missing tree reads as a deliberately minimal encounter, not
 * a missing conversation. Eleven of fourteen authored dialogue trees sat
 * unreachable this way before this phase; nothing failed when it was true.
 *
 * `auditNarrativeReachability` is the structural guard, mirroring
 * `auditMapTraversal`'s shape: a pure function over a static `MapDefinition`
 * plus the registered MapEvent pools, with a hermetic invariant test on top
 * (`e2e/narrative-reachability.engine.test.ts`). It does not run at import
 * time — `MapEvents/content.ts` deliberately does not import map
 * definitions, so coupling the two at module load would couple two
 * currently-independent modules and make correctness depend on import
 * order.
 */

import type { MapDefinition, NodeId } from './types';
import { getNodeEventPool } from './MapEvents/resolve-map-event';

export interface NarrativeReachabilityAudit {
    mapName: string;
    /** Interaction-node `npcName`s absent from this map's `npcs` roster. */
    unresolvedInteractions: ReadonlyArray<{ nodeId: NodeId; npcName: string }>;
    /**
     * Rostered NPCs carrying a `dialogueTree` that no node's interaction
     * payload names, and that aren't declared in `unstagedNpcs`.
     */
    unreachableNpcs: readonly string[];
    /**
     * The subset of `unresolvedInteractions` whose `npcName` doesn't match
     * an `unstagedNpcs` entry either — i.e. not even accounted for as a
     * deliberately-deferred placement. The roster will never carry this
     * exact name; it's scenery or a typo, not a lost NPC awaiting a node.
     */
    sceneryAsPeople: ReadonlyArray<{ nodeId: NodeId; npcName: string }>;
}

/**
 * Walks every node on `def`, reads its registered MapEvent pool (if any),
 * and cross-checks every `interaction` payload's `npcName` against the
 * map's roster (`def.npcs`) and its declared-unstaged list
 * (`def.unstagedNpcs`). Reads the live pool registry populated by
 * `MapEvents/content.ts`'s import-time registration — call this only after
 * that module has loaded (true for every consumer that goes through the
 * `World` barrel).
 */
export function auditNarrativeReachability(def: MapDefinition): NarrativeReachabilityAudit {
    const rosterNames = new Set((def.npcs ?? []).map(npc => npc.name));
    const unstagedNames = new Set((def.unstagedNpcs ?? []).map(u => u.name));

    const unresolvedInteractions: Array<{ nodeId: NodeId; npcName: string }> = [];
    const namedByNodes = new Set<string>();

    for (const node of def.nodes) {
        const pool = getNodeEventPool(def.continent, def.name, node.id);
        if (!pool) continue;
        for (const entry of pool.entries) {
            if (entry.payload.kind !== 'interaction') continue;
            const { npcName } = entry.payload;
            namedByNodes.add(npcName);
            if (!rosterNames.has(npcName)) {
                unresolvedInteractions.push({ nodeId: node.id, npcName });
            }
        }
    }

    const sceneryAsPeople = unresolvedInteractions.filter(u => !unstagedNames.has(u.npcName));

    const unreachableNpcs = (def.npcs ?? [])
        .filter(npc => npc.dialogueTree && !namedByNodes.has(npc.name) && !unstagedNames.has(npc.name))
        .map(npc => npc.name);

    return { mapName: def.name, unresolvedInteractions, unreachableNpcs, sceneryAsPeople };
}
