/**
 * Character presets — pre-built characters for testing and tooling.
 *
 * Deprecation rescinded 2026-06-12: the v0.13.0 removal never landed
 * because presets became load-bearing — mobile's DEV preset picker
 * (`applyCharacterPreset`), the Playtest runner, and the Tuning
 * difficulty bands all consume them. They are a supported public
 * surface until those consumers migrate.
 *
 * Each preset is a declarative recipe. `buildCharacterFromPreset` lifts
 * the recipe into a real `Character` by calling `createCharacter`
 * through the canonical path: the fixed signet-relic loadout is seeded by
 * `createCharacter` (the procedural `dropItem` equipment path is retired —
 * see `buildCharacterFromPreset`), and consumables are cloned from the
 * shared `consumableLibrary` so the canonical library is never
 * mutated.
 */

import { Character, BaseStats } from './types';
import { createCharacter } from './index';
import { consumableLibrary } from '../Items/consumable.library';
import type { Item } from '../Items/types';

export interface CharacterPresetEquipmentEntry {
    /**
     * EquipmentTemplate id (e.g. 'iron-blade'). The dropped item's slot kind is
     * taken from the template itself (Phase 18 — presets no longer restate the
     * slot). Declaration order is the equip order: the worn loadout takes the
     * first weapon, first armor, and first 3 accessories; the rest seed the
     * inventory.
     */
    templateId: string;
}

export interface CharacterPreset {
    id: string;
    name: string;
    /** Short blurb shown in the picker. */
    summary: string;
    level: number;
    baseStats: BaseStats;
    /** Vestigial: the procedural equipment library is retired, so these entries
     *  no longer resolve (see `buildCharacterFromPreset`). */
    equipment: CharacterPresetEquipmentEntry[];
    /** Card IDs the character knows. The full known set is the combat
     *  catalogue (ADR-0002); there is no equipped-card rotation. */
    knownCards: string[];
    /** Consumable IDs (and quantities) to seed the inventory. */
    consumables: { id: string; quantity: number }[];
    currency: number;
}

// ─── Preset records ───────────────────────────────────────────────────────────

// Profane-canon rework (2026-08-08): the ladder presets seed from the
// Threadbare Office starters (tier 1), the first reward commons (tier 2),
// and the mid-game uncommons (tier 3).
const TIER_1_CARDS = [
    'spoiled-poultice',
    'chilblain-watch',
    'petty-indictment',
    'thin-hymn',
    'first-spadeful',
    'thumbprick-oath',
    'threadbare-cope',
];

const TIER_2_CARDS = [
    'unction-of-boils',
    'scolds-bridle',
    'promissory-cut',
];

const TIER_3_CARDS = [
    'the-long-lent',
    'hoarfrost-teeth',
    'shallow-grave',
];

// The synergy-payoff line — knownCards is a set-like catalogue, so the lists
// stay disjoint to avoid duplicate ids.
const TIER_2_SYNERGY_CARDS = [
    'communion-of-the-worm',
];

export const apprenticePreset: CharacterPreset = {
    id: 'apprentice',
    name: 'Apprentice',
    summary: 'Just stepping out — balanced stats, basic cards, no gear.',
    level: 1,
    baseStats: { heart: 5, body: 5, mind: 5 },
    equipment: [],
    knownCards: [...TIER_1_CARDS],
    consumables: [
        { id: 'minor-healing-potion', quantity: 3 },
    ],
    currency: 0,
};

export const wandererPreset: CharacterPreset = {
    id: 'wanderer',
    name: 'Wanderer',
    summary: 'Mid-game — light armor, mixed-tier cards, a pouch of coin.',
    level: 8,
    baseStats: { heart: 5, body: 4, mind: 4 },
    equipment: [
        { templateId: 'iron-blade' },
        { templateId: 'hide-vest' },
        { templateId: 'leather-cap' },
    ],
    knownCards: [...TIER_1_CARDS, ...TIER_2_CARDS, ...TIER_2_SYNERGY_CARDS],
    consumables: [
        { id: 'healing-potion', quantity: 5 },
        { id: 'antidote', quantity: 2 },
    ],
    currency: 25,
};

export const sagePreset: CharacterPreset = {
    id: 'sage',
    name: 'Sage',
    summary: 'Late-game — mid-tier kit, every card known, paradox in reach.',
    level: 15,
    baseStats: { heart: 20, body: 30, mind: 25 },
    equipment: [
        { templateId: 'steel-blade' },
        { templateId: 'chain-mail' },
        { templateId: 'chain-coif' },
    ],
    knownCards: [...TIER_1_CARDS, ...TIER_2_CARDS, ...TIER_3_CARDS, ...TIER_2_SYNERGY_CARDS],
    consumables: [
        { id: 'healing-potion', quantity: 6 },
        { id: 'clarity-serum', quantity: 2 },
    ],
    currency: 75,
};

export const characterPresets: CharacterPreset[] = [
    apprenticePreset, wandererPreset, sagePreset,
];

// ─── Level-ladder presets (evidence / tooling) ──────────────────────────────────
//
// A finer, level-explicit ladder (L1 / L15 / L30 / L50) used by consumer
// dev tooling for reproducible combat / encounter evidence runs. Kept in a
// SEPARATE array so the canonical archetype picker (`characterPresets`)
// stays apprentice / wanderer / sage; `getPresetById` searches both.
// Previously authored client-side (`axiomancer-mobile`); moved here so the
// engine owns the preset data (curated level / stat / card / gear
// selection) — `buildCharacterFromPreset` validates every consumable id at build time.

export const ladderL1Preset: CharacterPreset = {
    id: 'kid-l1',
    name: 'Ladder · L1',
    summary: 'Tier-1 evidence baseline.',
    level: 1,
    baseStats: { heart: 5, body: 5, mind: 5 },
    equipment: [],
    knownCards: [...TIER_1_CARDS],
    consumables: [{ id: 'minor-healing-potion', quantity: 3 }],
    currency: 0,
};

export const ladderL15Preset: CharacterPreset = {
    id: 'kid-l15',
    name: 'Ladder · L15',
    summary: 'Mid-tier evidence kit.',
    level: 15,
    baseStats: { heart: 12, body: 14, mind: 12 },
    equipment: [
        { templateId: 'steel-blade' },
        { templateId: 'chain-mail' },
        { templateId: 'chain-coif' },
        { templateId: 'leather-coat' },
        { templateId: 'chain-gauntlets' },
        { templateId: 'leather-boots' },
        { templateId: 'silver-ring' },
    ],
    knownCards: [...TIER_1_CARDS, ...TIER_2_CARDS, ...TIER_2_SYNERGY_CARDS],
    consumables: [
        { id: 'healing-potion', quantity: 5 },
        { id: 'antidote', quantity: 2 },
    ],
    currency: 50,
};

export const ladderL30Preset: CharacterPreset = {
    id: 'kid-l30',
    name: 'Ladder · L30',
    summary: 'Late-tier evidence kit.',
    level: 30,
    baseStats: { heart: 24, body: 28, mind: 26 },
    equipment: [
        { templateId: 'mithril-blade' },
        { templateId: 'plate-mail' },
        { templateId: 'full-helm' },
        { templateId: 'scaled-coat' },
        { templateId: 'plate-gauntlets' },
        { templateId: 'iron-greaves' },
        { templateId: 'gold-ring' },
    ],
    knownCards: [
        ...TIER_1_CARDS,
        ...TIER_2_CARDS,
        ...TIER_3_CARDS,
        ...TIER_2_SYNERGY_CARDS,
    ],
    consumables: [
        { id: 'greater-healing-potion', quantity: 6 },
        { id: 'clarity-serum', quantity: 3 },
    ],
    currency: 250,
};

export const ladderL50Preset: CharacterPreset = {
    id: 'kid-l50',
    name: 'Ladder · L50',
    summary: 'Endgame evidence kit.',
    level: 50,
    baseStats: { heart: 40, body: 44, mind: 42 },
    // Top-tier curated affixed L20 variants — the highest requiredLevel
    // rows the library ships — so the build still arrives geared and
    // affix-backed.
    equipment: [
        { templateId: 'savage-mithril-blade-of-ruin' },
        { templateId: 'adamant-plate-mail-of-warding' },
        { templateId: 'full-helm-of-insight' },
        { templateId: 'scaled-coat-of-thorns' },
        { templateId: 'plate-gauntlets-of-the-duelist' },
        { templateId: 'phantom-iron-greaves-of-shadows' },
        { templateId: 'silver-ring-of-resilience' },
    ],
    knownCards: [
        ...TIER_1_CARDS,
        ...TIER_2_CARDS,
        ...TIER_3_CARDS,
        ...TIER_2_SYNERGY_CARDS,
    ],
    consumables: [
        { id: 'supreme-healing-potion', quantity: 8 },
        { id: 'regeneration-tonic', quantity: 3 },
        { id: 'phoenix-tear', quantity: 2 },
    ],
    currency: 1000,
};

/** Level-explicit evidence ladder. Not part of `characterPresets`. */
export const levelLadderPresets: CharacterPreset[] = [
    ladderL1Preset, ladderL15Preset, ladderL30Preset, ladderL50Preset,
];

export function getPresetById(id: string): CharacterPreset | undefined {
    return characterPresets.find(p => p.id === id)
        ?? levelLadderPresets.find(p => p.id === id);
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildCharacterFromPreset(preset: CharacterPreset): Character {
    const consumables: Item[] = preset.consumables.map(({ id, quantity }) => {
        const source = consumableLibrary.find(c => c.id === id);
        if (!source) {
            throw new Error(`buildCharacterFromPreset: unknown consumable id '${id}'.`);
        }
        return { ...source, quantity };
    });

    // Phase 21 — the procedural equipment library + factory are retired. The
    // declared `preset.equipment` template entries no longer resolve to anything
    // (there is no more procedural gear), so presets carry only their consumables
    // and wear the fixed 11-relic default loadout seeded by `createCharacter`. The
    // `equipment` field is retained on the recipe as vestigial metadata.
    return createCharacter({
        name: preset.name,
        level: preset.level,
        baseStats: preset.baseStats,
        currency: preset.currency,
        inventory: consumables,
        seedStartingRelics: true,
        knownCards: preset.knownCards,
    });
}
