/**
 * Engine ↔ layout parity guard.
 *
 * The engine's `MapDefinition` is the single source of truth for the node
 * GRAPH; the mobile `*.layout.ts` fixtures supply only the visual position +
 * copy for each engine node (see `../types.ts`). The presenter looks the layout
 * up *by id* and silently falls back to the canvas centre (180, 200) + the raw
 * node id when an engine node has no layout entry — so a drift between the two
 * sets degrades the map render without failing any other test.
 *
 * This guard fails CI the moment an engine map gains or loses a node without a
 * matching change to the layout fixture, in either direction:
 *   - an engine node with no layout entry → renders at the canvas centre;
 *   - a layout entry with no engine node → dead visual data that never renders.
 */

import { describe, it, expect } from '@jest/globals';
import { getMapDefinition } from 'axiomancer-mechanics';
import { getMapLayout } from '../index';

// Each shipped map, with the engine registry keys the presenter resolves it by
// (`world.currentMap.continent` / `world.currentMap.name`).
const MAPS = [
    { mapId: 'fishing-village', continent: 'coastal-continent' },
    { mapId: 'northern-forest', continent: 'coastal-continent' },
] as const;

describe('exploration map: engine ↔ layout node-id parity', () => {
    for (const { mapId, continent } of MAPS) {
        describe(mapId, () => {
            const def = getMapDefinition(continent, mapId);
            const layout = getMapLayout(mapId);

            const engineIds = new Set(def.nodes.map(n => n.id));
            const layoutIds = new Set((layout?.nodes ?? []).map(n => n.id));

            it('has a layout fixture registered', () => {
                expect(layout).not.toBeNull();
            });

            it('gives every engine node a layout position (none fall back to canvas centre)', () => {
                const missing = [...engineIds].filter(id => !layoutIds.has(id)).sort();
                expect(missing).toEqual([]);
            });

            it('has no orphan layout entries (every layout node exists in the engine)', () => {
                const orphans = [...layoutIds].filter(id => !engineIds.has(id)).sort();
                expect(orphans).toEqual([]);
            });

            it('node-id sets match exactly', () => {
                expect([...layoutIds].sort()).toEqual([...engineIds].sort());
            });
        });
    }
});
