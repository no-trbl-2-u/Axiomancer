import { describe, it, expect } from 'vitest';
import {
    completeMap, unlockMap, completeNode, unlockNode, completeUniqueEvent,
    changeContinent,
} from './world.reducer';
import { createStartingWorld } from './index';

const world = () => createStartingWorld();

describe('createStartingWorld', () => {
    it('does not list a map in both available and locked', () => {
        const { currentContinent } = world();
        for (const name of currentContinent.availableMaps) {
            expect(currentContinent.lockedMaps).not.toContain(name);
        }
    });

    it('catalogues the two campaign continents, coastal current (2026-08-28 travel)', () => {
        const w = world();
        expect(w.world.map(c => c.name)).toEqual(['coastal-continent', 'northern-continent']);
        expect(w.currentContinent.name).toBe('coastal-continent');
        // The labyrinth-continent (W-01) is deliberately uncatalogued —
        // dev-menu + CLI only.
        expect(w.world.map(c => c.name)).not.toContain('labyrinth-continent');
        const northern = w.world.find(c => c.name === 'northern-continent')!;
        expect(northern.lockedMaps).toContain('caverns');
        expect(northern.availableMaps).toEqual([]);
    });
});

describe('completeMap', () => {
    it('adds to completedMaps', () => {
        const w = completeMap(world(), 'fishing-village');
        expect(w.currentContinent.completedMaps).toContain('fishing-village');
    });
    it('idempotent', () => {
        const w1 = completeMap(world(), 'fishing-village');
        const w2 = completeMap(w1, 'fishing-village');
        expect(w2.currentContinent.completedMaps.filter(m => m === 'fishing-village')).toHaveLength(1);
    });
});

describe('unlockMap', () => {
    it('moves from locked to available', () => {
        const w = unlockMap(world(), 'northern-forest');
        expect(w.currentContinent.lockedMaps).not.toContain('northern-forest');
        expect(w.currentContinent.availableMaps).toContain('northern-forest');
    });
    it('idempotent if already available', () => {
        const w1 = unlockMap(world(), 'northern-forest');
        const w2 = unlockMap(w1, 'northern-forest');
        expect(w2).toBe(w1);
    });
});

describe('completeNode', () => {
    it('adds to completedNodes', () => {
        const w = completeNode(world(), 'fv-2');
        expect(w.currentMap.completedNodes).toContain('fv-2');
    });
});

describe('unlockNode', () => {
    it('moves from locked to available', () => {
        const w = unlockNode(world(), 'fv-3');
        expect(w.currentMap.lockedNodes).not.toContain('fv-3');
        expect(w.currentMap.availableNodes).toContain('fv-3');
    });
});

describe('changeContinent', () => {
    // Pre-travel (2026-08-28) the catalogue was `[]`, so this function could
    // ONLY no-op and the test pinned that. The catalogue is real now.
    it('switches to a catalogued continent', () => {
        const w = changeContinent(world(), 'northern-continent');
        expect(w.currentContinent.name).toBe('northern-continent');
        expect(w.currentContinent.lockedMaps).toContain('caverns');
    });

    it('writes the outgoing continent back into the catalogue before switching', () => {
        const w1 = completeMap(world(), 'fishing-village');
        const w2 = changeContinent(w1, 'northern-continent');
        const coastal = w2.world.find(c => c.name === 'coastal-continent')!;
        expect(coastal.completedMaps).toContain('fishing-village');
    });

    it('still no-ops for an uncatalogued continent (the labyrinth stays dev-only)', () => {
        const w = world();
        expect(changeContinent(w, 'labyrinth-continent')).toBe(w);
    });
});

describe('completeUniqueEvent', () => {
    it('returns unchanged when event id is unknown', () => {
        const w = world();
        const next = completeUniqueEvent(w, 'unknown-id');
        expect(next.currentMap.uniqueEvents).toEqual(w.currentMap.uniqueEvents);
    });
});
