/**
 * The Aporia — MapDefinition builders (W-01).
 *
 * The act content modules (`content/act*.content.ts`) are the single
 * source of truth for the room graphs; this file derives the engine
 * `MapDefinition`s from them so the labyrinth's doors can never diverge
 * from the authored rooms. Secret doors and act gates arrive as
 * `initialBlockedRoutes` (opened at runtime via `unblockMapRoute`).
 */

import type { BlockedRoute, MapDefinition, MapNode } from '../types';
import type { LabyrinthActDef } from './types';
import { ACT1 } from './content/act1.content';
import { ACT2 } from './content/act2.content';
import { ACT3 } from './content/act3.content';

/** All three acts, in descent order. */
export const APORIA_ACTS: readonly LabyrinthActDef[] = [ACT1, ACT2, ACT3];

export function getAporiaAct(id: LabyrinthActDef['id']): LabyrinthActDef {
    const act = APORIA_ACTS.find(a => a.id === id);
    if (!act) throw new Error(`Unknown labyrinth act '${id}'.`);
    return act;
}

/** The act a labyrinth map name belongs to, or undefined for other maps. */
export function getAporiaActByMap(mapName: string): LabyrinthActDef | undefined {
    return APORIA_ACTS.find(a => a.mapName === mapName);
}

export function buildLabyrinthMapDefinition(act: LabyrinthActDef): MapDefinition {
    const nodes: MapNode[] = act.rooms.map((room, i) => ({
        id: room.nodeId,
        // Engine-side positions are a deterministic grid; player-facing
        // layout is a UI concern (the labyrinth renders room scenes, and
        // its fog-of-war map lays out from walked doors, not these).
        location: [40 + (i % 4) * 90, 40 + Math.floor(i / 4) * 90],
        connectedNodes: room.doors.map(d => d.to),
    }));

    const initialBlockedRoutes: BlockedRoute[] = [];
    const blocked = new Set<string>();
    for (const room of act.rooms) {
        for (const door of room.doors) {
            const reason = door.secret ? 'secret door' : door.gate ? 'gate of assent' : undefined;
            if (!reason) continue;
            // Route blocks are bidirectional in the reducer; dedupe pairs.
            const key = [room.nodeId, door.to].sort().join('|');
            if (blocked.has(key)) continue;
            blocked.add(key);
            initialBlockedRoutes.push({ from: room.nodeId, to: door.to, reason });
        }
    }

    const startingNode = nodes.find(n => n.id === act.entry);
    if (!startingNode) throw new Error(`Act ${act.id}: entry '${act.entry}' is not an authored room.`);

    return {
        name: act.mapName,
        continent: 'labyrinth-continent',
        description: act.title,
        startingNode,
        nodes,
        traversal: 'labyrinth',
        initialBlockedRoutes,
    };
}

export const aporiaColonnade: MapDefinition = buildLabyrinthMapDefinition(ACT1);
export const aporiaArchive: MapDefinition = buildLabyrinthMapDefinition(ACT2);
export const aporiaProof: MapDefinition = buildLabyrinthMapDefinition(ACT3);
