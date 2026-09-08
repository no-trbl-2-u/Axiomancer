/**
 * Hermetic e2e — state fixtures (`src/Game/fixtures`).
 *
 * Drives the public surface end-to-end: registry → validate → build →
 * `createGameStore` boot, plus the migration contract (a built fixture is
 * always current-version) and the determinism contract (seeded fixtures
 * build byte-equal twice).
 *
 * Hermetic: no disk, no network; the RNG is seeded per fixture or reset in
 * `beforeEach`; every spy is restored in `afterEach`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { GAME_STATE_VERSION, createNewGameState } from '../game.reducer';
import { migrate } from '../game.migrate';
import { setSeed } from '../../Utils/rng';
import { getMapDefinition } from '../../World/map.registry';
import {
    STATE_FIXTURES, buildStateFromFixture, getStateFixtureById, listStateFixtureIds,
    parseStateFixture, problemsFor, validateStateFixture, StateFixtureError,
} from '../fixtures';
import type { StateFixture } from '../fixtures';

beforeEach(() => setSeed('state-fixture-suite'));
afterEach(() => vi.restoreAllMocks());

const KEBAB = /^[a-z][a-z0-9-]*$/;

describe('registry', () => {
    it('ids are kebab-case and unique', () => {
        const ids = listStateFixtureIds();
        expect(ids.every(id => KEBAB.test(id))).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it.each(STATE_FIXTURES.map(f => [f.id, f] as const))('"%s" validates and builds a current-version state', (_id, fixture) => {
        expect(problemsFor(fixture)).toEqual([]);
        const state = buildStateFromFixture(fixture);
        expect(state.version).toBe(GAME_STATE_VERSION);
        // Round-trip through the persistence front door: a built fixture
        // must satisfy `migrate`'s structural checks unchanged.
        expect(migrate(JSON.parse(JSON.stringify(state)), state.version)).toEqual(JSON.parse(JSON.stringify(state)));
        if (fixture.world) {
            expect(state.world.currentMap.name).toBe(fixture.world.map);
            expect(state.world.currentContinent.name).toBe(fixture.world.continent);
            const expectedNode = fixture.world.node ?? getMapDefinition(fixture.world.continent, fixture.world.map).startingNode.id;
            expect(state.world.currentMap.currentNode).toBe(expectedNode);
        }
    });

    it('getStateFixtureById returns undefined for unknown ids', () => {
        expect(getStateFixtureById('no-such-fixture')).toBeUndefined();
        expect(getStateFixtureById('fresh-start')?.id).toBe('fresh-start');
    });
});

describe('buildStateFromFixture', () => {
    it('an empty fixture is a new game', () => {
        setSeed('same');
        const fresh = createNewGameState();
        setSeed('same');
        const built = buildStateFromFixture({ id: 'empty' });
        expect(built).toEqual(fresh);
    });

    it('is deterministic when seeded (run id included)', () => {
        const fixture = getStateFixtureById('sage-fv-boss-gate')!;
        const a = buildStateFromFixture(fixture);
        const b = buildStateFromFixture(fixture);
        expect(a).toEqual(b);
        expect(a.runId).toBe(b.runId);
    });

    it('preset + player overrides rebuild the character consistently', () => {
        const state = buildStateFromFixture({
            id: 'override',
            seed: 1,
            preset: 'apprentice',
            player: { level: 7, baseStats: { body: 9 }, health: 5, currency: 33, knownCards: ['thin-hymn'], name: 'Tester' },
        });
        const p = state.player;
        expect(p.name).toBe('Tester');
        expect(p.level).toBe(7);
        expect(p.baseStats.body).toBe(9);
        expect(p.health).toBe(5);
        expect(p.maxHealth).toBeGreaterThan(5);
        expect(p.currency).toBe(33);
        expect(p.knownCards).toContain('thin-hymn');
        expect(new Set(p.knownCards).size).toBe(p.knownCards.length);
    });

    it('clamps health to maxHealth and alignment to ±100', () => {
        const state = buildStateFromFixture({
            id: 'clamp',
            seed: 2,
            player: { health: 99999 },
            alignment: { epistemology: 500, scope: -500 },
        });
        expect(state.player.health).toBe(state.player.maxHealth);
        expect(state.philosophicalAlignment.epistemology).toBe(100);
        expect(state.philosophicalAlignment.scope).toBe(-100);
        expect(state.philosophicalAlignment.outlook).toBe(0);
    });

    it('world placement unlocks the map, stamps completed maps, and marks the node live', () => {
        const state = buildStateFromFixture({
            id: 'world',
            seed: 3,
            world: { continent: 'coastal-continent', map: 'northern-forest', node: 'nf-8', completedMaps: ['fishing-village'] },
        });
        const { currentContinent, currentMap } = state.world;
        expect(currentContinent.name).toBe('coastal-continent');
        expect(currentContinent.availableMaps).toContain('northern-forest');
        expect(currentContinent.lockedMaps).not.toContain('northern-forest');
        expect(currentContinent.completedMaps).toEqual(['fishing-village']);
        expect(currentMap.currentNode).toBe('nf-8');
        expect(currentMap.availableNodes).toContain('nf-8');
        expect(currentMap.discoveredNodes).toContain('nf-8');
    });

    it('flags append without duplicates; moralMeter assigns', () => {
        const base = buildStateFromFixture({ id: 'base', seed: 4 });
        const withFlags = buildStateFromFixture({ id: 'flags', seed: 4, flags: [base.flags[0]!, 'x-flag', 'x-flag'], moralMeter: -30 });
        expect(withFlags.flags.filter(f => f === 'x-flag')).toHaveLength(1);
        expect(withFlags.flags.filter(f => f === base.flags[0])).toHaveLength(1);
        expect(withFlags.moralMeter).toBe(-30);
    });

    it('boots a store through createGameStore as full overrides', () => {
        const initial = buildStateFromFixture(getStateFixtureById('l30-caverns-hazard')!);
        const store = createGameStore(nullAdapter, initial);
        const s = store.getState();
        expect(s.player.level).toBe(30);
        expect(s.player.health).toBe(12);
        expect(s.world.currentMap.name).toBe('caverns');
        expect(s.world.currentMap.currentNode).toBe('nc-17');
        expect(s.version).toBe(GAME_STATE_VERSION);
    });
});

describe('validateStateFixture', () => {
    const bad = {
        id: 'Not Kebab',
        preset: 'no-such-preset',
        player: { level: 0, baseStats: { heart: 'x' } },
        world: { continent: 'coastal-continent', map: 'fishing-village', node: 'zz-99', completedMaps: ['nowhere'] },
        flags: 'oops',
        alignment: { outlook: 'high' },
        arrive: 'yes',
    };

    it('reports every problem at once with field paths', () => {
        const problems = problemsFor(bad);
        expect(problems).toEqual(expect.arrayContaining([
            expect.stringContaining('id:'),
            expect.stringContaining('preset:'),
            expect.stringContaining('player.level'),
            expect.stringContaining('player.baseStats.heart'),
            expect.stringContaining("world.node: 'zz-99'"),
            expect.stringContaining("world.completedMaps: unknown map"),
            expect.stringContaining('flags:'),
            expect.stringContaining('alignment.outlook'),
            expect.stringContaining('arrive:'),
        ]));
        expect(() => validateStateFixture(bad)).toThrow(StateFixtureError);
    });

    it('rejects unknown maps and non-objects', () => {
        expect(problemsFor({ id: 'x', world: { continent: 'coastal-continent', map: 'atlantis' } })).toEqual([
            expect.stringContaining("unknown map 'coastal-continent/atlantis'"),
        ]);
        expect(problemsFor(null)).toEqual(['fixture: expected an object']);
        expect(problemsFor([])).toEqual(['fixture: expected an object']);
    });

    it('parseStateFixture accepts a JSON document and rejects malformed JSON', () => {
        const doc: StateFixture = { id: 'from-json', seed: 'j', preset: 'wanderer' };
        expect(parseStateFixture(JSON.stringify(doc))).toEqual(doc);
        expect(() => parseStateFixture('{not json')).toThrow(StateFixtureError);
    });
});
