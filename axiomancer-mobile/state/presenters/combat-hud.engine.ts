import { clamp } from '@mechanics';
import type { ActiveEffect } from '@mechanics';

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
 * Derives the combat HUD view-model from app state.
 *
 * - `hpPercent` reads from the in-combat player snapshot when a
 *   battle is active, otherwise from the out-of-combat player.
 * - `manaPercent` is always `1.0` (full). This persistent top-bar HUD
 *   always reflects the overworld player (see note below) and has no
 *   wired source for in-combat resources — the Hazard-Pattern combat
 *   panel shows live resources itself, via its own dice tray.
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

    // Phase 87 — dev override can force mana hidden (null) for testing.
    const hudOverrides = state.devOverrides?.hud ?? {
        hideMana: false,
        hideEffects: false,
        hideStance: false,
    };

    // No source wires in-combat resources to this persistent top-bar HUD
    // (legacy combat's `state.combat` was removed in mechanics 0.37.0; the
    // Hazard-Pattern panel shows live resources itself). The bar always
    // reads as full regardless of `hideMana` — kept as a no-op override
    // rather than removed, so existing dev-menu wiring stays intact.
    const manaPercent = 1;

    // Phase 87 — dev override can force effects empty for testing.
    const rawEffects = hudOverrides.hideEffects ? [] : player.effects;
    const effects = rawEffects
        .slice(0, MAX_EFFECTS_SHOWN)
        .map(toDisplay);

    return { hpPercent, manaPercent, effects };
}
