/**
 * THE DECK PRESETS — after the card purge (P1, 2026-09-27; D36).
 *
 * The ten campaign presets and the 5/5/5 aspect thirds were repealed with
 * the cards they dealt. One preset survives: the grey deck every fresh run
 * opens with (`STARTING_CARD_IDS` — Blow 5 / Ward 3 / Word 2, D43). The
 * sims, the playtest CLI and the deck-picker keep their preset API so a
 * guided session can seat new presets here again.
 *
 * Pure data + pure helpers — card ids are validated against the library at
 * call time (an id that no longer resolves is dropped).
 */

import { getCardById } from '../Cards/cards.library';
import { STARTING_CARD_IDS } from './combat.rewards';

/**
 * The design lever a preset leans on. Kept coarse for the draft/sim-policy
 * consumers.
 */
export type CombatDeckFocus = 'dot' | 'control' | 'utility' | 'damage' | 'rush-execute' | 'balanced';

/** A curated, ready-to-play combat deck. */
export interface CombatDeckPreset {
    /** Stable kebab-case id. */
    id: string;
    /** Display name (the mobile deck-picker label). */
    name: string;
    /** Campaign stage this snapshot represents. */
    stage: 'early' | 'mid' | 'late';
    /** The coarse lever this deck leans on (sim-policy compatibility). */
    focus: CombatDeckFocus;
    /** One-line pitch for the deck-picker. */
    description: string;
    /** Curated card ids. DUPLICATES intentional (copies). */
    cardIds: readonly string[];
}

export const COMBAT_DECK_PRESETS: Record<string, CombatDeckPreset> = {
    grey: {
        id: 'grey',
        name: 'The Grey Office',
        stage: 'early',
        focus: 'balanced',
        description:
            'No flourish, no colour, no argument: a plain blow, a plain ward, '
            + 'and a plain word. Everything else is earned.',
        cardIds: [...STARTING_CARD_IDS],
    },
};

/** Stable display order for the deck-picker. */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze(['grey']);

/** All presets in display order. */
export function listDeckPresets(): CombatDeckPreset[] {
    return COMBAT_DECK_PRESET_ORDER
        .map(id => COMBAT_DECK_PRESETS[id])
        .filter((p): p is CombatDeckPreset => p !== undefined);
}

/** Looks up a preset by id (undefined when unknown). */
export function getDeckPreset(id: string): CombatDeckPreset | undefined {
    return COMBAT_DECK_PRESETS[id];
}

/**
 * Builds a ready-to-play deck from a preset: its recipe with any id that no
 * longer resolves dropped. Returns an empty array for an unknown preset id
 * (callers can fall back to `buildCombatDeck`).
 */
export function buildPresetDeck(presetId: string): string[] {
    const preset = getDeckPreset(presetId);
    return preset ? preset.cardIds.filter(id => !!getCardById(id)) : [];
}
