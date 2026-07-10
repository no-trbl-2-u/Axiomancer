/**
 * Combat state factory + the one reducer the shared card engine still uses.
 *
 * The legacy turn-based combat *driver* (round resolution, stance/action
 * progression, the battle log, the Pressure-Track win model) was removed.
 * What remains is `CombatState` — the state shape the Hazard-Pattern engine
 * builds as a shim to drive the shared `executeCard` (see `combat.engine.ts`)
 * — plus:
 *   - `initializeCombat`: the canonical `CombatState` constructor. Used by the
 *     card / effects / equipment engines (and their tests) to build a fresh
 *     combat state with deep-cloned combatants and equipment-seeded resources.
 *   - `incrementFriendship`: the friendship-counter bump `executeCard` applies
 *     on a successful Befriend.
 */

import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';
import { deepClone } from '../Utils';
import type { CombatResources } from '../Cards/types';
import { CombatState } from './types';

/**
 * Builds a fresh CombatState. Combatants are deep-cloned so combat
 * mutations don't bleed back into the canonical player/enemy.
 *
 * Phase 20 decoupled equipment from effects; phase 23 tore down item sets. No
 * equipment (individual or set) seeds combat-start tokens or applies passive
 * effects any more — the counters start at zero. Items contribute only their
 * `statModifiers` (folded into `derivedStats` at equip-time).
 */
export function initializeCombat(player: Character, enemy: Enemy): CombatState {
    const seeded: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };

    return {
        active: true,
        phase: 'choosing_stance',
        round: 1,
        friendshipCounter: 0,
        player: deepClone(player),
        enemy: deepClone(enemy),
        playerChoice: {},
        enemyChoice: {},
        combatResources: seeded,
    };
}

/**
 * Increments the friendship counter on a `CombatState`.
 *
 * Used by the shared card engine (`executeCard`) when a Befriend attempt
 * lands — the Hazard-Pattern engine drives `executeCard` against a
 * `CombatState` shim, so this bump still fires inside the new combat system.
 */
export function incrementFriendship(state: CombatState): CombatState {
    return { ...state, friendshipCounter: state.friendshipCounter + 1 };
}
