/**
 * Debug state dumps for combat testing and automation.
 * 
 * Provides structured effect state snapshots for Python test harness
 * and manual debugging. Only active when COMBAT_DEBUG=1 environment
 * variable is set.
 */

import { EffectTier } from '../Effects/types';
import { CombatState } from './types';

export interface EffectStateDump {
    round: number;
    rngState: number;
    playerEffects: Array<{ id: string; intensity: number; tier: EffectTier }>;
    enemyEffects: Array<{ id: string; intensity: number; tier: EffectTier }>;
}

/**
 * Captures a snapshot of all active effects on both combatants.
 * Used by automation scripts to verify expected effect states.
 */
export function dumpEffectState(combat: CombatState, round: number, rngState: number): EffectStateDump {
    return {
        round,
        rngState,
        playerEffects: combat.player.effects.map(e => ({
            id: e.effectId,
            intensity: e.intensity,
            tier: e.tier,
        })),
        enemyEffects: combat.enemy.effects.map(e => ({
            id: e.effectId,
            intensity: e.intensity,
            tier: e.tier,
        })),
    };
}