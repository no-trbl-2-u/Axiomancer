/**
 * Game module barrel — store, persistence, reducers, constants.
 */

export {
    createGameStore,
    selectPlayer, selectIsInCombat,
    selectVersion,
} from './store';
export type { GameStore, StoreApi } from './store';

export { createNewGameState, GAME_STATE_VERSION } from './game.reducer';
export type { GameState, CodexEntry } from './types';

export { migrate } from './game.migrate';

export {
    LEGACY_SLOT_MAP, reslotLegacyEquipment, reslotLegacyLoadout,
} from './legacy-slots';
export type { LegacySlot } from './legacy-slots';

export {
    createEventEmitter,
} from './events';
export type {
    GameEvent, GameEventEmitter, GameEventHandler,
} from './events';

export {
    MAX_EFFECT_INTENSITY,
} from './game-mechanics.constants';

export type { PersistenceAdapter } from './persistence/types';
export { nullAdapter } from './persistence/null.adapter';

// State fixtures (2026-09-07) — declarative test states for CLI / Jest / web.
export type { StateFixture } from './fixtures';
export {
    buildStateFromFixture,
    validateStateFixture,
    getStateFixtureById, listStateFixtureIds,
} from './fixtures';
