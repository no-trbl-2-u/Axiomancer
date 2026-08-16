/**
 * Unit test for `auditNarrativeReachability` (Phase 53a) against a
 * hand-built fixture map, isolated from the real content registry so the
 * three report categories can each be exercised in a controlled scenario.
 */

import { describe, expect, it, beforeEach } from 'vitest';

import { auditNarrativeReachability } from './narrative-reachability';
import {
    _clearMapEventPoolRegistry,
    registerMapEventPool,
    setNodeEventPoolOverride,
} from './MapEvents/resolve-map-event';
import type { MapDefinition } from './types';
import type { NPC, DialogueTree } from '../NPCs/types';
import type { ContinentName, MapName } from './map.library';

const CONTINENT = 'test-continent' as ContinentName;
const MAP = 'test-map' as MapName;

function fixtureTree(id: string): DialogueTree {
    return { id, rootId: 'greet', nodes: { greet: { id: 'greet', text: 'Hello.' } } };
}

const npcMatch: NPC = { name: 'Match Npc', dialogueTree: fixtureTree('match') };
const npcGhost: NPC = { name: 'Ghost Npc', dialogueTree: fixtureTree('ghost') };
const npcDeferred: NPC = { name: 'Deferred Npc', dialogueTree: fixtureTree('deferred') };

const def: MapDefinition = {
    name: MAP,
    continent: CONTINENT,
    description: 'fixture map',
    startingNode: { id: 'tn-1', location: [0, 0], connectedNodes: ['tn-2'] },
    nodes: [
        { id: 'tn-1', location: [0, 0], connectedNodes: ['tn-2'] },
        { id: 'tn-2', location: [1, 0], connectedNodes: [] },
    ],
    npcs: [npcMatch, npcGhost, npcDeferred],
    unstagedNpcs: [{ name: 'Deferred Npc', reason: 'fixture: deliberately unplaced' }],
};

describe('auditNarrativeReachability', () => {
    beforeEach(() => {
        _clearMapEventPoolRegistry();
        registerMapEventPool({
            id: 'tn-1.interaction',
            entries: [{ kind: 'interaction', weight: 1, payload: { kind: 'interaction', npcName: 'Match Npc' } }],
        });
        setNodeEventPoolOverride(CONTINENT, MAP, 'tn-1', 'tn-1.interaction');
        registerMapEventPool({
            id: 'tn-2.interaction',
            entries: [{ kind: 'interaction', weight: 1, payload: { kind: 'interaction', npcName: 'Mismatched Name' } }],
        });
        setNodeEventPoolOverride(CONTINENT, MAP, 'tn-2', 'tn-2.interaction');
    });

    it('a matching name resolves — not reported as unresolved', () => {
        const audit = auditNarrativeReachability(def);
        expect(audit.unresolvedInteractions.some(u => u.nodeId === 'tn-1')).toBe(false);
    });

    it('a mismatched name is reported', () => {
        const audit = auditNarrativeReachability(def);
        expect(audit.unresolvedInteractions).toContainEqual({ nodeId: 'tn-2', npcName: 'Mismatched Name' });
        // Not accounted for in unstagedNpcs either — the roster will never
        // carry this exact name.
        expect(audit.sceneryAsPeople).toContainEqual({ nodeId: 'tn-2', npcName: 'Mismatched Name' });
    });

    it('a rostered NPC with no node is reported', () => {
        const audit = auditNarrativeReachability(def);
        expect(audit.unreachableNpcs).toContain('Ghost Npc');
    });

    it('an unstagedNpcs entry suppresses that report', () => {
        const audit = auditNarrativeReachability(def);
        expect(audit.unreachableNpcs).not.toContain('Deferred Npc');
    });

    it('a homed NPC is not reported even without an unstagedNpcs entry', () => {
        const audit = auditNarrativeReachability(def);
        expect(audit.unreachableNpcs).not.toContain('Match Npc');
    });
});
