/**
 * Combat state factory + the one reducer the shared skill engine still uses.
 *
 * The legacy turn-based combat *driver* (round resolution, stance/action
 * progression, the battle log, the Pressure-Track win model) was removed.
 * What remains is `CombatState` — the state shape the Hazard-Pattern engine
 * builds as a shim to drive the shared `executeSkill` (see `combat.engine.ts`)
 * — plus:
 *   - `initializeCombat`: the canonical `CombatState` constructor. Used by the
 *     skill / effects / equipment engines (and their tests) to build a fresh
 *     combat state with deep-cloned combatants and equipment-seeded resources.
 *   - `incrementFriendship`: the friendship-counter bump `executeSkill` applies
 *     on a successful Befriend.
 */

import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';
import { deepClone } from '../Utils';
import { aggregateCombatStartTokens } from '../Items/equipment.engine';
import { aggregateSetStartTokens, getActiveSetPassiveEffectIds } from '../Items/set.engine';
import { lookupEffect } from '../Effects';
import type { ActiveEffect } from '../Effects/types';
import type { CombatResources } from '../Cards/types';
import { CombatState } from './types';

/**
 * Builds a fresh CombatState. Combatants are deep-cloned so combat
 * mutations don't bleed back into the canonical player/enemy.
 *
 * Per Spec 05, the per-combat resource counters are NOT unconditionally
 * zeroed — they are seeded from the sum of every equipped item's
 * `resourceInteraction.combatStartTokens`. Items without a
 * `resourceInteraction` contribute zero, so the default behaviour (no
 * equipment) is unchanged. Today only the player's equipment seeds tokens;
 * enemies pre-Spec 07 do not carry equipment.
 */
export function initializeCombat(player: Character, enemy: Enemy): CombatState {
    const equipment = player.equipment ?? {};
    const itemTokens = aggregateCombatStartTokens(equipment);
    const setTokens = aggregateSetStartTokens(equipment);
    // Sum per-item + per-set start tokens additively (Spec 05e Q2 — no cap).
    const seeded: CombatResources = {
        heart:    itemTokens.heart    + setTokens.heart,
        body:     itemTokens.body     + setTokens.body,
        mind:     itemTokens.mind     + setTokens.mind,
        fallacy:  itemTokens.fallacy  + setTokens.fallacy,
        paradox:  itemTokens.paradox  + setTokens.paradox,
    };

    // Apply set-bonus passive effects as combat-LIFETIME ActiveEffects
    // (Spec 05e Q4). remainingDuration: -1 is the engine's "infinite-duration"
    // sentinel — tickAllEffects skips the tick decrement for these entries,
    // so set passives survive every round of combat. Combat-end cleanup
    // discards the cloned player along with the effects, so persistence is
    // bounded by the combat lifetime even though duration is unbounded.
    //
    // We construct ActiveEffect directly here rather than going through
    // applyEffect — applyEffect clamps remainingDuration to MAX_EFFECT_DURATION
    // (10), which would let the passive expire on an unusually long combat
    // (e.g. boss-encounter walkthrough at ~16+ rounds). The -1 sentinel
    // bypasses that ceiling.
    const clonedPlayer = deepClone(player);
    const setPassiveIds = getActiveSetPassiveEffectIds(equipment);
    let playerWithSetEffects = clonedPlayer;
    for (const effectId of setPassiveIds) {
        const effect = lookupEffect(effectId);
        if (!effect) continue;
        const newEffect: ActiveEffect = {
            effectId:          effect.id,
            remainingDuration: -1,        // combat-lifetime sentinel (tickAllEffects skips)
            intensity:         1,
            appliedAt:         1,
            tier:              effect.tier,
            resistedBy:        effect.resistedBy,
            resistDR:          effect.resistDR,
            sourceId:          'set-bonus',
        };
        playerWithSetEffects = {
            ...playerWithSetEffects,
            effects: [...(playerWithSetEffects.effects ?? []), newEffect],
        };
    }

    return {
        active: true,
        phase: 'choosing_stance',
        round: 1,
        friendshipCounter: 0,
        player: playerWithSetEffects,
        enemy: deepClone(enemy),
        playerChoice: {},
        enemyChoice: {},
        log: [],
        combatResources: seeded,
    };
}

/**
 * Increments the friendship counter on a `CombatState`.
 *
 * Used by the shared skill engine (`executeSkill`) when a Befriend attempt
 * lands — the Hazard-Pattern engine drives `executeSkill` against a
 * `CombatState` shim, so this bump still fires inside the new combat system.
 */
export function incrementFriendship(state: CombatState): CombatState {
    return { ...state, friendshipCounter: state.friendshipCounter + 1 };
}
