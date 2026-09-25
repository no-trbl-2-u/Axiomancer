/**
 * Game module barrel — store, persistence, reducers, constants.
 */

export {
    createGameStore,
    selectPlayer, selectIsInCombat,
    selectInventory, selectVersion, selectMoralMeter,
} from './store';
export type { GameStore, GameActions, StoreApi, CombatEndReport } from './store';

export { createNewGameState, GAME_STATE_VERSION, gameReducer } from './game.reducer';
export type { GameState, CodexState, CodexEntry, RegionConsequences } from './types';

export { generateRunId, STARTING_REGION } from './run-loop';

export type { GameAction, GameActionOf } from './actions.types';

export { migrate } from './game.migrate';

export {
    LEGACY_SLOT_MAP, reslotLegacyEquipment, reslotLegacyLoadout,
} from './legacy-slots';
export type { LegacySlot, LegacySlotMapping } from './legacy-slots';

export {
    createEventEmitter,
} from './events';
export type {
    GameEvent, GameEventEmitter, GameEventHandler, GameEventType,
} from './events';

export {
    RESOURCE_MULTIPLIERS, EXPERIENCE_PER_LEVEL,
    STAT_POINTS_PER_LEVEL,
    MAX_EFFECT_INTENSITY, MAX_EFFECT_DURATION, FRIENDSHIP_COUNTER_MAX,
    RESOURCE_CARRY,
} from './game-mechanics.constants';

export type { PersistenceAdapter } from './persistence/types';
export { nullAdapter } from './persistence/null.adapter';

// State fixtures (2026-09-07) — declarative test states for CLI / Jest / web.
export type { StateFixture, StateFixturePlayer, StateFixtureWorld } from './fixtures';
export {
    buildStateFromFixture,
    StateFixtureError, problemsFor, validateStateFixture, parseStateFixture,
    STATE_FIXTURES, getStateFixtureById, listStateFixtureIds,
} from './fixtures';
