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
    it('no-ops for unknown continent', () => {
        const w = world();
        expect(changeContinent(w, 'northern-continent')).toBe(w);
    });
});

describe('completeUniqueEvent', () => {
    it('returns unchanged when event id is unknown', () => {
        const w = world();
        const next = completeUniqueEvent(w, 'unknown-id');
        expect(next.currentMap.uniqueEvents).toEqual(w.currentMap.uniqueEvents);
    });
});
