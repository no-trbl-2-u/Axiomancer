/**
 * MapEvents 'travel' kind (2026-08-28 — inter-map travel) — hermetic e2e
 * at the highest public entry point.
 *
 * The doors under test are the two authored in `content.ts`:
 *   fv-10 (the coast road out of the village)  → coastal / northern-forest
 *   nf-10 (the cave mouth at the forest's edge) → northern / caverns
 *
 * The design call, decided: the world is a PLACE the player moves around
 * in. Departing a map preserves its runtime `MapState` under
 * `WorldState.mapStates` and marks it in `completedMaps` — never a reset.
 * Doors are one-way but repeatable: the dispatcher does not consume a
 * travel node, so re-resolving it travels again.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { resolveMapEvent, createStartingWorld, startQuest, getMapDefinition } from '../../index';
import { createNewGameState, GAME_STATE_VERSION } from '../../../Game/game.reducer';
import { migrate } from '../../../Game/game.migrate';
import { mockSequentialRng } from '../../../test-utils/rng';
import type { GameState } from '../../../Game/types';
import type { MapState } from '../../types';
// Import for side effect — registers the pools when the test loads.
import '../content';

afterEach(() => vi.restoreAllMocks());

/** Seat the player on `nodeId` of the CURRENT map, unconsumed. */
function seatAt(state: GameState, nodeId: string): GameState {
    return {
        ...state,
        world: {
            ...state.world,
            currentMap: { ...state.world.currentMap, currentNode: nodeId },
        },
    };
}

/** A fresh game standing on the fv-10 door. */
function atCoastRoad(): GameState {
    mockSequentialRng(0.5);
    return seatAt({ ...createNewGameState(), world: createStartingWorld('fishing-village') }, 'fv-10');
}

describe("the fv-10 door — village → northern-forest (same continent)", () => {
    it('crosses the world to northern-forest and reports where it led', () => {
        const result = resolveMapEvent(atCoastRoad());

        expect(result.event.kind).toBe('travel');
        if (result.event.kind === 'travel') {
            expect(result.event.destinationContinent).toBe('coastal-continent');
            expect(result.event.destinationMap).toBe('northern-forest');
            expect(result.event.description).toBeTruthy();
        }

        const world = result.state.world;
        expect(world.currentMap.name).toBe('northern-forest');
        expect(world.currentMap.currentNode).toBe('nf-1');
        expect(world.currentContinent.name).toBe('coastal-continent');
    });

    it('marks the departed village completed and unlocks the forest — catalogue in sync', () => {
        const { state } = resolveMapEvent(atCoastRoad());

        expect(state.world.currentContinent.completedMaps).toContain('fishing-village');
        expect(state.world.currentContinent.availableMaps).toContain('northern-forest');
        expect(state.world.currentContinent.lockedMaps).not.toContain('northern-forest');

        // The catalogue entry and currentContinent must agree.
        const catalogued = state.world.world.find(c => c.name === 'coastal-continent')!;
        expect(catalogued).toEqual(state.world.currentContinent);
    });

    it('preserves the departed MapState — the village is a place, not a checklist', () => {
        const before = atCoastRoad();
        const departed = before.world.currentMap;
        const { state } = resolveMapEvent(before);

        const preserved = state.world.mapStates?.['fishing-village'];
        expect(preserved).toBeDefined();
        expect(preserved).toEqual(departed);
        // The door itself was never consumed — repeatable by design.
        expect(preserved!.consumedNodes).not.toContain('fv-10');
    });

    it('is repeatable — standing on the preserved door and resolving travels again', () => {
        const first = resolveMapEvent(atCoastRoad());
        const preserved = first.state.world.mapStates!['fishing-village'] as MapState;

        // Put the player back on the preserved village (as a future
        // return-door would) and resolve the door node again.
        const back: GameState = {
            ...first.state,
            world: {
                ...first.state.world,
                currentMap: preserved,
                mapStates: { ...first.state.world.mapStates, 'fishing-village': undefined },
            },
        };
        const second = resolveMapEvent(back);
        expect(second.event.kind).toBe('travel');
        expect(second.state.world.currentMap.name).toBe('northern-forest');
    });

    it("completes get-to-forest: the door makes reach/nf-1 tick on arrival's own resolution", () => {
        const fresh = atCoastRoad();
        const quest = getMapDefinition('coastal-continent', 'fishing-village')
            .quests!.find(q => q.name === 'get-to-forest')!;
        const questing: GameState = { ...fresh, quests: startQuest(fresh.quests, quest) };

        const travelled = resolveMapEvent(questing).state;
        expect(travelled.quests.completed).not.toContain('get-to-forest');

        // Arriving on nf-1 (unconsumed on the fresh forest) resolves the
        // arrival cutscene; the reach objective ticks before the pool roll.
        const arrived = resolveMapEvent(travelled);
        expect(arrived.state.quests.completed).toContain('get-to-forest');
    });
});

describe('the nf-10 door — forest → caverns (cross-continent)', () => {
    function atCaveMouth(): GameState {
        // Walk the real arc: through the fv-10 door first, then seat on the
        // forest's cave mouth.
        const throughVillage = resolveMapEvent(atCoastRoad()).state;
        return seatAt(throughVillage, 'nf-10');
    }

    it('switches continent, unlocks the caverns, and lands on nc-1', () => {
        const { state, event } = resolveMapEvent(atCaveMouth());

        expect(event.kind).toBe('travel');
        expect(state.world.currentContinent.name).toBe('northern-continent');
        expect(state.world.currentMap.name).toBe('caverns');
        expect(state.world.currentMap.currentNode).toBe('nc-1');
        expect(state.world.currentContinent.availableMaps).toContain('caverns');
        expect(state.world.currentContinent.lockedMaps).not.toContain('caverns');
    });

    it('keeps both continents honest in the catalogue after the crossing', () => {
        const { state } = resolveMapEvent(atCaveMouth());

        const coastal = state.world.world.find(c => c.name === 'coastal-continent')!;
        expect(coastal.completedMaps).toEqual(
            expect.arrayContaining(['fishing-village', 'northern-forest']),
        );
        const northern = state.world.world.find(c => c.name === 'northern-continent')!;
        expect(northern).toEqual(state.world.currentContinent);

        // Both departed maps ride along, preserved.
        expect(state.world.mapStates?.['fishing-village']?.name).toBe('fishing-village');
        expect(state.world.mapStates?.['northern-forest']?.currentNode).toBe('nf-10');
    });

    it('the whole arc survives a save → migrate roundtrip at the current version', () => {
        const { state } = resolveMapEvent(atCaveMouth());

        const raw = JSON.parse(JSON.stringify(state));
        const loaded = migrate(raw, raw.version, GAME_STATE_VERSION);

        expect(loaded.version).toBe(GAME_STATE_VERSION);
        expect(loaded.world.currentContinent.name).toBe('northern-continent');
        expect(loaded.world.currentMap.name).toBe('caverns');
        expect(loaded.world.mapStates?.['fishing-village']).toBeDefined();
        expect(loaded.world.world.map(c => c.name)).toEqual(
            ['coastal-continent', 'northern-continent'],
        );
    });
});

describe('the nc-26 door — caverns → northern-city (Phase W3)', () => {
    /** Walk the real arc through both earlier doors, then seat on nc-26. */
    function atUnderGate(): GameState {
        const throughVillage = resolveMapEvent(atCoastRoad()).state;
        const throughForest = resolveMapEvent(seatAt(throughVillage, 'nf-10')).state;
        return seatAt(throughForest, 'nc-26');
    }

    it('stays on the northern continent, unlocks the city, and lands on ncy-1', () => {
        const { state, event } = resolveMapEvent(atUnderGate());

        expect(event.kind).toBe('travel');
        expect(state.world.currentContinent.name).toBe('northern-continent');
        expect(state.world.currentMap.name).toBe('northern-city');
        expect(state.world.currentMap.currentNode).toBe('ncy-1');
        expect(state.world.currentContinent.availableMaps).toContain('northern-city');
        expect(state.world.currentContinent.lockedMaps).not.toContain('northern-city');
        expect(state.world.currentContinent.completedMaps).toContain('caverns');
        // The departed caverns ride along, preserved on the door node.
        expect(state.world.mapStates?.['caverns']?.currentNode).toBe('nc-26');
    });

    it("completes get-to-northern-city: The Delver's grant ticks on the city arrival", () => {
        const under = atUnderGate();
        const quest = getMapDefinition('northern-continent', 'caverns')
            .quests!.find(q => q.name === 'get-to-northern-city')!;
        const questing: GameState = { ...under, quests: startQuest(under.quests, quest) };

        const travelled = resolveMapEvent(questing).state;
        expect(travelled.quests.completed).not.toContain('get-to-northern-city');

        // Arriving on ncy-1 (unconsumed on the fresh city) resolves the
        // arrival cutscene; the reach objective ticks before the pool roll.
        const arrived = resolveMapEvent(travelled);
        expect(arrived.state.quests.completed).toContain('get-to-northern-city');
    });

    it('a v21 save with the PRE-W3 two-map catalogue can still cross — no migration hop needed', () => {
        // Yesterday's save: version 21, northern catalogue listing ONLY the
        // caverns (northern-city did not exist when v20→v21 seeded it).
        // The design call, documented: the locked-map ledger is
        // informational — `unlockMap` (the travel handler's step 3) admits
        // any REGISTERED destination into `availableMaps` whether or not
        // the catalogue ever listed it as locked, so old v21 saves need no
        // v21→v22 hop to reach the new map.
        const under = atUnderGate();
        const raw = JSON.parse(JSON.stringify(under));
        for (const continent of [raw.world.currentContinent, ...raw.world.world]) {
            if (continent.name !== 'northern-continent') continue;
            continent.lockedMaps = continent.lockedMaps.filter((m: string) => m !== 'northern-city');
            continent.availableMaps = continent.availableMaps.filter((m: string) => m !== 'northern-city');
        }
        expect(raw.world.currentContinent.lockedMaps).not.toContain('northern-city');

        const loaded = migrate(raw, raw.version, GAME_STATE_VERSION);
        expect(loaded.version).toBe(GAME_STATE_VERSION);

        const { state } = resolveMapEvent(loaded);
        expect(state.world.currentMap.name).toBe('northern-city');
        expect(state.world.currentMap.currentNode).toBe('ncy-1');
        expect(state.world.currentContinent.availableMaps).toContain('northern-city');
    });
});

describe('the ncy-26 door — northern-city → connecting-river (Phase W4)', () => {
    /** Walk the real arc through every earlier door, then seat on ncy-26. */
    function atWaterGate(): GameState {
        const throughVillage = resolveMapEvent(atCoastRoad()).state;
        const throughForest = resolveMapEvent(seatAt(throughVillage, 'nf-10')).state;
        const throughCaverns = resolveMapEvent(seatAt(throughForest, 'nc-26')).state;
        return seatAt(throughCaverns, 'ncy-26');
    }

    it('stays on the northern continent, unlocks connecting-river, and lands on cr-1', () => {
        const { state, event } = resolveMapEvent(atWaterGate());

        expect(event.kind).toBe('travel');
        expect(state.world.currentContinent.name).toBe('northern-continent');
        expect(state.world.currentMap.name).toBe('connecting-river');
        expect(state.world.currentMap.currentNode).toBe('cr-1');
        expect(state.world.currentContinent.availableMaps).toContain('connecting-river');
        expect(state.world.currentContinent.lockedMaps).not.toContain('connecting-river');
        expect(state.world.currentContinent.completedMaps).toContain('northern-city');
        expect(state.world.mapStates?.['northern-city']?.currentNode).toBe('ncy-26');
    });

    it("completes get-to-connecting-river: the Gate-Clerk's grant ticks on the river arrival", () => {
        const gated = atWaterGate();
        const quest = getMapDefinition('northern-continent', 'northern-city')
            .quests!.find(q => q.name === 'get-to-connecting-river')!;
        const questing: GameState = { ...gated, quests: startQuest(gated.quests, quest) };

        const travelled = resolveMapEvent(questing).state;
        expect(travelled.quests.completed).not.toContain('get-to-connecting-river');

        const arrived = resolveMapEvent(travelled);
        expect(arrived.state.quests.completed).toContain('get-to-connecting-river');
    });
});

describe('the cr-13 door — connecting-river → town-across-river (Phase W4)', () => {
    function atFarBankGate(): GameState {
        const throughVillage = resolveMapEvent(atCoastRoad()).state;
        const throughForest = resolveMapEvent(seatAt(throughVillage, 'nf-10')).state;
        const throughCaverns = resolveMapEvent(seatAt(throughForest, 'nc-26')).state;
        const throughCity = resolveMapEvent(seatAt(throughCaverns, 'ncy-26')).state;
        return seatAt(throughCity, 'cr-13');
    }

    it('stays on the northern continent, unlocks town-across-river, and lands on tar-1', () => {
        const { state, event } = resolveMapEvent(atFarBankGate());

        expect(event.kind).toBe('travel');
        expect(state.world.currentContinent.name).toBe('northern-continent');
        expect(state.world.currentMap.name).toBe('town-across-river');
        expect(state.world.currentMap.currentNode).toBe('tar-1');
        expect(state.world.currentContinent.availableMaps).toContain('town-across-river');
        expect(state.world.currentContinent.lockedMaps).not.toContain('town-across-river');
        expect(state.world.currentContinent.completedMaps).toContain('connecting-river');
        expect(state.world.mapStates?.['connecting-river']?.currentNode).toBe('cr-13');
    });

    it('completes get-to-town-across-river: The Boatwoman\'s grant ticks on arrival', () => {
        const gated = atFarBankGate();
        const quest = getMapDefinition('northern-continent', 'connecting-river')
            .quests!.find(q => q.name === 'get-to-town-across-river')!;
        const questing: GameState = { ...gated, quests: startQuest(gated.quests, quest) };

        const travelled = resolveMapEvent(questing).state;
        expect(travelled.quests.completed).not.toContain('get-to-town-across-river');

        const arrived = resolveMapEvent(travelled);
        expect(arrived.state.quests.completed).toContain('get-to-town-across-river');
    });
});

describe('the tar-7 door — town-across-river → the-capital (Phase W5)', () => {
    function atRibbonRoad(): GameState {
        const throughVillage = resolveMapEvent(atCoastRoad()).state;
        const throughForest = resolveMapEvent(seatAt(throughVillage, 'nf-10')).state;
        const throughCaverns = resolveMapEvent(seatAt(throughForest, 'nc-26')).state;
        const throughCity = resolveMapEvent(seatAt(throughCaverns, 'ncy-26')).state;
        const throughRiver = resolveMapEvent(seatAt(throughCity, 'cr-13')).state;
        return seatAt(throughRiver, 'tar-7');
    }

    it('stays on the northern continent, unlocks the-capital, and lands on cap-1', () => {
        const { state, event } = resolveMapEvent(atRibbonRoad());

        expect(event.kind).toBe('travel');
        expect(state.world.currentContinent.name).toBe('northern-continent');
        expect(state.world.currentMap.name).toBe('the-capital');
        expect(state.world.currentMap.currentNode).toBe('cap-1');
        expect(state.world.currentContinent.availableMaps).toContain('the-capital');
        expect(state.world.currentContinent.lockedMaps).not.toContain('the-capital');
        expect(state.world.currentContinent.completedMaps).toContain('town-across-river');
        expect(state.world.mapStates?.['town-across-river']?.currentNode).toBe('tar-7');
    });

    it('completes get-to-the-capital: The Sweetheart\'s grant ticks on arrival', () => {
        const gated = atRibbonRoad();
        const quest = getMapDefinition('northern-continent', 'town-across-river')
            .quests!.find(q => q.name === 'get-to-the-capital')!;
        const questing: GameState = { ...gated, quests: startQuest(gated.quests, quest) };

        const travelled = resolveMapEvent(questing).state;
        expect(travelled.quests.completed).not.toContain('get-to-the-capital');

        const arrived = resolveMapEvent(travelled);
        expect(arrived.state.quests.completed).toContain('get-to-the-capital');
    });
});
