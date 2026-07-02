/**
 * Typed event surface (post-Phase-21).
 *
 * The engine emits one uniform envelope from `eventForAction` in
 * `src/Game/store.ts`:
 *
 *   { type, payload: { action, state, report? } }
 *
 * `TypedGameEvent<T>` narrows the `type` field for consumers; the
 * `payload` shape is the same for every topic. Per-topic aliases
 * (`TypedCombatStartedEvent`, ...) cover all 10 `GameEventType`
 * values so the narrowed type is concrete at every guard call site.
 *
 * Pre-Phase-21 also shipped seven per-topic Payload interfaces
 * (`CombatStartedPayload`, etc.) and corresponding `create*Event`
 * factories. The interfaces were aspirational — the engine never
 * produced them — and the factories had zero internal callers, so
 * they were removed. A future phase can introduce richer per-topic
 * payloads via a deliberate engine-side rewrite if the UI surface
 * needs them.
 */

import type { GameEvent, GameEventType } from './events';
import type { GameState } from './types';
import type { GameAction } from './actions.types';
import type { CombatEndReport } from './store';

/** The shape every emitted event carries today. */
export interface EnginePayload {
    action: GameAction;
    state: GameState;
    report?: CombatEndReport;
    /**
     * Card ids newly eligible to learn after this transition (Phase 30 unit
     * 2 / Spec 06 Q7). Populated only on `character:levelup` when at least
     * one level promotion crossed a tier-eligibility threshold; an empty
     * array means the levelup didn't unlock anything new. Absent on every
     * other topic.
     */
    unlockedSkills?: string[];
}

/** GameEvent narrowed by `type`. Payload is always the engine envelope. */
export interface TypedGameEvent<T extends GameEventType = GameEventType> extends GameEvent {
    type: T;
    payload: EnginePayload;
}

export type TypedCombatStartedEvent     = TypedGameEvent<'combat:started'>;
export type TypedCombatEndedEvent       = TypedGameEvent<'combat:ended'>;
export type TypedWorldMovedEvent        = TypedGameEvent<'world:moved'>;
export type TypedWorldProcessedEvent    = TypedGameEvent<'world:processed'>;
export type TypedLevelUpEvent           = TypedGameEvent<'character:levelup'>;
export type TypedInventoryChangedEvent  = TypedGameEvent<'inventory:changed'>;
export type TypedDialogueAppliedEvent   = TypedGameEvent<'dialogue:applied'>;
export type TypedGameSavedEvent         = TypedGameEvent<'game:saved'>;
export type TypedGameLoadedEvent        = TypedGameEvent<'game:loaded'>;
