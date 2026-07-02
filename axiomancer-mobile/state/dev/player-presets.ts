/**
 * Dev-only player-tier presets for mobile evidence runs (Phase 131).
 *
 * The pre-existing `applyCharacterPreset` (Phase 59) swaps the player
 * for one of three engine archetypes (apprentice / wanderer / sage).
 * The evidence matrix needs a finer, level-explicit ladder — exactly
 * `L1`, `L15`, `L30`, `L50`.
 *
 * **The preset DATA now lives in the engine** (`levelLadderPresets`),
 * so the curated level / stat / skill / gear selection is engine-owned
 * and validated by `buildCharacterFromPreset`. This file keeps only the
 * mobile-side presentation wrapper (button `label` + one-line `summary`)
 * and the dev store-apply glue.
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never
 * reaches this.
 */

import {
    buildCharacterFromPreset,
    levelLadderPresets,
    type Character,
    type CharacterPreset,
} from 'axiomancer-mechanics';

import type { AppStore } from '@/state/store';

export type PlayerTierPresetId = 'kid-l1' | 'kid-l15' | 'kid-l30' | 'kid-l50';

export interface PlayerTierPreset {
    id: PlayerTierPresetId;
    /** Short button label (e.g. "L15"). */
    label: string;
    /** One-line summary surfaced under the button row. */
    summary: string;
    /** The engine-owned preset fed through `buildCharacterFromPreset`. */
    preset: CharacterPreset;
}

export interface ApplyPlayerTierPresetResult {
    applied: boolean;
    presetId: PlayerTierPresetId | null;
    label: string | null;
    level: number | null;
}

/**
 * Mobile presentation wrapper for the engine's level ladder — button
 * label + summary copy per tier. The `preset` payload is sourced from
 * the engine `levelLadderPresets` (looked up by id), so this file holds
 * no game data.
 */
const TIER_DISPLAY: Record<PlayerTierPresetId, { label: string; summary: string }> = {
    'kid-l1': { label: 'L1', summary: 'fresh start — tier-1 fallacies, no gear' },
    'kid-l15': { label: 'L15', summary: 'mid kit — tier-1/2 skills, steel + chain' },
    'kid-l30': { label: 'L30', summary: 'late kit — every tier, mithril + plate' },
    'kid-l50': { label: 'L50', summary: 'endgame — all skills, top-tier affixed gear' },
};

export const PLAYER_TIER_PRESETS: readonly PlayerTierPreset[] = Object.freeze(
    levelLadderPresets.map((preset) => {
        const display = TIER_DISPLAY[preset.id as PlayerTierPresetId];
        return {
            id: preset.id as PlayerTierPresetId,
            label: display.label,
            summary: display.summary,
            preset,
        };
    }),
);

export function getPlayerTierPreset(
    presetId: string,
): PlayerTierPreset | undefined {
    return PLAYER_TIER_PRESETS.find((row) => row.id === presetId);
}

/**
 * Replace the player slice with a fresh build of the requested
 * level tier. No-op (`applied: false`) on an unknown id. Mirrors
 * `applyCharacterPresetAction` (Phase 59) — same engine build path,
 * just the finer level ladder.
 */
export function applyPlayerTierPresetAction(
    store: AppStore,
    presetId: string,
): ApplyPlayerTierPresetResult {
    try {
        const row = getPlayerTierPreset(presetId);
        if (!row) {
            return { applied: false, presetId: null, label: null, level: null };
        }
        const nextPlayer = buildCharacterFromPreset(row.preset) as Character;
        store.setState({ player: nextPlayer });
        return {
            applied: true,
            presetId: row.id,
            label: row.label,
            level: row.preset.level,
        };
    } catch (error) {
        console.error(`Failed to apply player tier preset ${presetId}:`, error);
        return { applied: false, presetId: null, label: null, level: null };
    }
}
