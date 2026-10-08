/**
 * The map names each node's kind for what it is: a region's exit door
 * reads as the way onward, not a quest, and the Anvil carries the name its
 * own screen and tooltip use. Walks every Act 1 map's real event pools.
 */

import { describe, it, expect } from '@jest/globals';
import { createStartingWorld, getNodePrimaryEventKind } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppStore } from '@/state/store';
import { NODE_KIND_LABEL, selectExplorationViewModel } from '@/state/presenters/exploration.engine';
import { selectTooltipContentFor } from '@/state/presenters/tooltip.engine';

const NO_STATE = {} as Parameters<typeof selectTooltipContentFor>[2];
const ACT_1_MAPS = ['breakwater', 'charcoal-wood', 'beacon-crags', 'lantern-deep'] as const;

function nodesOf(map: (typeof ACT_1_MAPS)[number]) {
    const store = createAppStore({ adapter: createMemoryAdapter(), overrides: { world: createStartingWorld(map) } });
    const vm = selectExplorationViewModel(store.getState());
    return vm.nodes.map((n) => ({ ...n, kind: getNodePrimaryEventKind(vm.continent, map, n.id) }));
}

describe('map node kind labels', () => {
    it.each(ACT_1_MAPS)('%s: every travel door reads PATH ONWARD, never QUEST', (map) => {
        const doors = nodesOf(map).filter((n) => n.kind === 'travel');
        for (const door of doors) {
            expect(door.type).toBe('door');
            expect(NODE_KIND_LABEL[door.type]).toBe('PATH ONWARD');
        }
    });

    it('the region doors the RC walk named are doors', () => {
        const doorIds = ACT_1_MAPS.flatMap((m) => nodesOf(m).filter((n) => n.type === 'door').map((n) => n.id));
        expect(doorIds).toEqual(expect.arrayContaining(['bw-18', 'cw-20', 'bc-17']));
    });

    it('the Anvil node uses the name its tooltip uses', () => {
        const anvils = ACT_1_MAPS.flatMap((m) => nodesOf(m)).filter((n) => n.type === 'blacksmith');
        expect(anvils.length).toBeGreaterThan(0);
        const tip = selectTooltipContentFor('map-node', 'blacksmith', NO_STATE);
        expect(NODE_KIND_LABEL.blacksmith).toBe('THE ANVIL');
        expect(tip?.title).toBe(NODE_KIND_LABEL.blacksmith);
    });

    it('a door has its own tooltip', () => {
        const tip = selectTooltipContentFor('map-node', 'door', NO_STATE);
        expect(tip?.title).toBe('PATH ONWARD');
    });
});
