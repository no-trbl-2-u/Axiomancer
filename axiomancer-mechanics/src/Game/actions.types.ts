/**
 * GameAction tagged union — every top-level state transition.
 *
 * Dispatched through `gameReducer(state, action): GameState`. The store
 * provides typed sugar around `dispatch` and emits `GameEvent`s after each
 * reducer run.
 *
 * Phase 09 keeps payloads minimal but real. Where the underlying reducer
 * needs richer context (e.g. dialogue requires the active tree), the payload
 * carries it through — the CLI / UI is responsible for staging that context
 * before dispatch. See `phase_09_game_loop_orchestration.md` Unit 1.
 */

import { Enemy } from '../Enemy/types';
import { Encounter } from '../World/types';
import { Character } from '../Character/types';
import { Equipment, EquipmentSlot, Item } from '../Items/types';
import { DialogueTree, DialogueChoice } from '../NPCs/types';
import { PhilosophicalAlignment } from '../Philosophy/types';

export type GameAction =
    | { type: 'START_COMBAT';   payload: { target: Enemy | Encounter } }
    | {
          type: 'END_COMBAT';
          payload?: {
              /**
               * Outcome reported by the Hazard-Pattern combat driver. Defaults
               * to `'flee'` when omitted. `'victory'` / `'friendship'` grant
               * loot, XP, quest progress, and per-foe friendship rewards;
               * `'defeat'` / `'flee'` grant nothing.
               */
              outcome?: 'victory' | 'defeat' | 'friendship' | 'flee';
              /**
               * Final player snapshot from the combat driver (post-fight HP /
               * effects). Promoted to the root player on `'victory'` /
               * `'friendship'`; on `'defeat'` / `'flee'` the root inventory is
               * preserved so combat-side inventory mutations don't leak. When
               * omitted, the root player is left untouched.
               */
              finalPlayer?: Character;
              grantedLoot?: Item[];
              grantedXp?: number;
          };
      }
    | { type: 'MOVE_TO_NODE';   payload: { nodeId: string } }
    | { type: 'PROCESS_NODE';   payload?: undefined }
    | { type: 'APPLY_DIALOGUE'; payload: { tree: DialogueTree; choice: DialogueChoice } }
    | { type: 'USE_ITEM';       payload: { itemId: string } }
    | { type: 'EQUIP_ITEM';     payload: { item: Equipment } }
    | { type: 'UNEQUIP_ITEM';   payload: { slot: EquipmentSlot } }
    | { type: 'LEVEL_UP';       payload?: undefined }
    | { type: 'ALLOCATE_STAT_POINT'; payload: { stat: 'heart' | 'body' | 'mind' } }
    | { type: 'LEARN_SKILL';    payload: { skillId: string } }
    | { type: 'SHIFT_MORAL_METER'; payload: { delta: number; gating?: { min?: number; max?: number } } }
    | { type: 'SHIFT_PHILOSOPHICAL_ALIGNMENT'; payload: { delta: Partial<PhilosophicalAlignment> } }
    | { type: 'SAVE_GAME';      payload?: undefined }
    | { type: 'LOAD_GAME';      payload?: undefined }
    | { type: 'RESET_RUN';      payload: { keepCharacter: boolean } }
    | { type: 'UNLOCK_CODEX_ENTRY'; payload: { entryId: string } };

/** Narrowed action type, extracted by `type` discriminator. */
export type GameActionOf<T extends GameAction['type']> = Extract<GameAction, { type: T }>;
