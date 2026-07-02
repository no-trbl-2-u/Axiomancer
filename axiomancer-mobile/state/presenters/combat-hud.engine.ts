import { clamp } from 'axiomancer-mechanics';
import type { ActiveEffect, CombatResources } from 'axiomancer-mechanics';

import type { AppStoreState } from '@/state/store';

import { MAX_EFFECTS_SHOWN } from './constants';

export interface ActiveEffectDisplay {
    effectId: string;
    intensity: number;
    remainingDuration: number;
}

export interface CombatHudViewModel {
    hpPercent: number;
    manaPercent: number;
    effects: ActiveEffectDisplay[];
}

function toDisplay(e: ActiveEffect): ActiveEffectDisplay {
    return {
        effectId: e.effectId,
        intensity: e.intensity,
        remainingDuration: e.remainingDuration,
    };
}

/**
 * Calculate resource percentage from engine combat resources.
 * Uses estimated max based on typical combat starting values.
 * Formal follow-up: tracked in plan/PHASE_CANDIDATES.md as candidate.
 */
function calculateResourcePercent(resources: CombatResources): number {
    const totalCurrent = resources.heart + resources.body + resources.mind + 
                        resources.fallacy + resources.paradox;
    
    // Estimate typical max total resources (can be refined based on testing)
    // Starting values are typically around 3-5 per resource type
    const estimatedMax = 20; 
    
    return totalCurrent > 0 ? clamp(totalCurrent / estimatedMax, 0, 1) : 0;
}

/**
 * Derives the combat HUD view-model from app state.
 *
 * - `hpPercent` reads from the in-combat player snapshot when a
 *   battle is active, otherwise from the out-of-combat player.
 * - `manaPercent` reads from engine `CombatState.combatResources` 
 *   (Phase 105 — uses engine truth). Shows total combined resources
 *   from all pools (heart/body/mind/fallacy/paradox). When combat
 *   is inactive, the bar shows as full (1.0).
 * - Dev overrides (Phase 87) can force empty states for testing
 *   branches that would otherwise require specific game state.
 */
export function selectCombatHudViewModel(state: AppStoreState): CombatHudViewModel {
    // Legacy turn-based combat (and its `state.combat` player snapshot)
    // was removed in mechanics 0.37.0. Live hazard combat owns its HUD in
    // the panel's local state, so this persistent top-bar HUD always
    // reflects the overworld player.
    const player = state.player;

    const hpPercent = player.maxHealth > 0
        ? clamp(player.health / player.maxHealth, 0, 1)
        : 0;

    // Engine combat resources (Phase 105 — replaced local combatMana slice).
    // When combat is inactive, show full bar (1.0). During combat, 
    // calculate percentage from total current vs approximate max resources.
    // Phase 87 — dev override can force mana hidden (null) for testing.
    const hudOverrides = state.devOverrides?.hud ?? {
        hideMana: false,
        hideEffects: false,
        hideStance: false,
    };
    
    // No legacy combat slice → no engine combat resources to read; the
    // mana bar shows full (1.0) out of combat. `hideMana` still forces null.
    const combatResources = hudOverrides.hideMana ? null : null;
    const manaPercent: number = combatResources === null
        ? 1
        : calculateResourcePercent(combatResources);

    // Phase 87 — dev override can force effects empty for testing.
    const rawEffects = hudOverrides.hideEffects ? [] : player.effects;
    const effects = rawEffects
        .slice(0, MAX_EFFECTS_SHOWN)
        .map(toDisplay);

    return { hpPercent, manaPercent, effects };
}
