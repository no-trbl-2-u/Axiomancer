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
 * through the canonical path: equipment is constructed via
 * `dropItem(templateId, level, 'common')` so stat folding goes through
 * the same code combat uses, and consumables are cloned from the
 * shared `consumableLibrary` so the canonical library is never
 * mutated.
 */

import { Character, BaseStats } from './types';
import { createCharacter } from './index';
import { dropItem } from '../Items/item.factory';
import { consumableLibrary } from '../Items/consumable.library';
import type { EquipmentSlot, Equipment, Item } from '../Items/types';

export interface CharacterPresetEquipmentEntry {
    /** EquipmentTemplate id (e.g. 'iron-blade'). */
    templateId: string;
    slot: EquipmentSlot;
}

export interface CharacterPreset {
    id: string;
    name: string;
    /** Short blurb shown in the picker. */
    summary: string;
    level: number;
    baseStats: BaseStats;
    /** Equipment to drop and equip. Each slot is filled at 'common' rarity. */
    equipment: CharacterPresetEquipmentEntry[];
    /** Card IDs the character knows. The full known set is the combat
     *  catalogue (ADR-0002); there is no equipped-skill rotation. */
    knownSkills: string[];
    /** Consumable IDs (and quantities) to seed the inventory. */
    consumables: { id: string; quantity: number }[];
    currency: number;
}

// ─── Preset records ───────────────────────────────────────────────────────────

const TIER_1_SKILLS = [
    'ad-hominem-strike',
    'false-dilemma',
    'appeal-to-pity',
    'achilles-gambit',
    'liars-echo',
    'ship-of-theseus',
    'befriend', // Phase 108 — starting heart skill
];

const TIER_2_SKILLS = [
    'mob-appeal',
    'undistributed-middle',
    'eternal-regress',
];

const TIER_3_SKILLS = [
    'sorites-cascade',
    'straw-giant',
    'bootstrap-paradox',
];

const TIER_2_SYNERGY_SKILLS = [
    'resonance-bleed',
    'intensity-feedback',
    'bat-swarm-thoughtform',
    'resonance-burst',
    'resonance-detonation',
];

export const apprenticePreset: CharacterPreset = {
    id: 'apprentice',
    name: 'Apprentice',
    summary: 'Just stepping out — balanced stats, basic skills, no gear.',
    level: 1,
    baseStats: { heart: 5, body: 5, mind: 5 },
    equipment: [],
    knownSkills: [...TIER_1_SKILLS],
    consumables: [
        { id: 'minor-healing-potion', quantity: 3 },
    ],
    currency: 0,
};

export const wandererPreset: CharacterPreset = {
    id: 'wanderer',
    name: 'Wanderer',
    summary: 'Mid-game — light armor, mixed-tier skills, a pouch of coin.',
    level: 8,
    baseStats: { heart: 5, body: 4, mind: 4 },
    equipment: [
        { templateId: 'iron-blade', slot: 'weapon' },
        { templateId: 'hide-vest', slot: 'armor' },
        { templateId: 'leather-cap', slot: 'head' },
    ],
    knownSkills: [...TIER_1_SKILLS, ...TIER_2_SKILLS, ...TIER_2_SYNERGY_SKILLS],
    consumables: [
        { id: 'healing-potion', quantity: 5 },
        { id: 'antidote', quantity: 2 },
    ],
    currency: 25,
};

export const sagePreset: CharacterPreset = {
    id: 'sage',
    name: 'Sage',
    summary: 'Late-game — mid-tier kit, every skill known, paradox in reach.',
    level: 15,
    baseStats: { heart: 20, body: 30, mind: 25 },
    equipment: [
        { templateId: 'steel-blade', slot: 'weapon' },
        { templateId: 'chain-mail', slot: 'armor' },
        { templateId: 'chain-coif', slot: 'head' },
    ],
    knownSkills: [...TIER_1_SKILLS, ...TIER_2_SKILLS, ...TIER_3_SKILLS, ...TIER_2_SYNERGY_SKILLS],
    consumables: [
        { id: 'healing-potion', quantity: 6 },
        { id: 'clarity-serum', quantity: 2 },
        { id: 'focus-vial', quantity: 2 },
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
// engine owns the preset data (curated level / stat / skill / gear
// selection) — `buildCharacterFromPreset` validates every id at build time.

export const ladderL1Preset: CharacterPreset = {
    id: 'kid-l1',
    name: 'Ladder · L1',
    summary: 'Tier-1 evidence baseline.',
    level: 1,
    baseStats: { heart: 5, body: 5, mind: 5 },
    equipment: [],
    knownSkills: [...TIER_1_SKILLS],
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
        { templateId: 'steel-blade', slot: 'weapon' },
        { templateId: 'chain-mail', slot: 'armor' },
        { templateId: 'chain-coif', slot: 'head' },
        { templateId: 'leather-coat', slot: 'body' },
        { templateId: 'chain-gauntlets', slot: 'hands' },
        { templateId: 'leather-boots', slot: 'feet' },
        { templateId: 'silver-ring', slot: 'accessory' },
    ],
    knownSkills: [...TIER_1_SKILLS, ...TIER_2_SKILLS, ...TIER_2_SYNERGY_SKILLS],
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
        { templateId: 'mithril-blade', slot: 'weapon' },
        { templateId: 'plate-mail', slot: 'armor' },
        { templateId: 'full-helm', slot: 'head' },
        { templateId: 'scaled-coat', slot: 'body' },
        { templateId: 'plate-gauntlets', slot: 'hands' },
        { templateId: 'iron-greaves', slot: 'feet' },
        { templateId: 'gold-ring', slot: 'accessory' },
    ],
    knownSkills: [
        ...TIER_1_SKILLS,
        ...TIER_2_SKILLS,
        ...TIER_3_SKILLS,
        ...TIER_2_SYNERGY_SKILLS,
    ],
    consumables: [
        { id: 'greater-healing-potion', quantity: 6 },
        { id: 'clarity-serum', quantity: 3 },
        { id: 'focus-vial', quantity: 3 },
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
        { templateId: 'savage-mithril-blade-of-ruin', slot: 'weapon' },
        { templateId: 'adamant-plate-mail-of-warding', slot: 'armor' },
        { templateId: 'full-helm-of-insight', slot: 'head' },
        { templateId: 'scaled-coat-of-thorns', slot: 'body' },
        { templateId: 'plate-gauntlets-of-the-duelist', slot: 'hands' },
        { templateId: 'phantom-iron-greaves-of-shadows', slot: 'feet' },
        { templateId: 'silver-ring-of-resilience', slot: 'accessory' },
    ],
    knownSkills: [
        ...TIER_1_SKILLS,
        ...TIER_2_SKILLS,
        ...TIER_3_SKILLS,
        ...TIER_2_SYNERGY_SKILLS,
    ],
    consumables: [
        { id: 'supreme-healing-potion', quantity: 8 },
        { id: 'regeneration-tonic', quantity: 3 },
        { id: 'phoenix-tear', quantity: 2 },
        { id: 'greater-resonance-crystal', quantity: 3 },
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

export function buildCharacterFromPreset(
    preset: CharacterPreset,
    rng: () => number = Math.random,
): Character {
    const inventory: Item[] = preset.consumables.map(({ id, quantity }) => {
        const source = consumableLibrary.find(c => c.id === id);
        if (!source) {
            throw new Error(`buildCharacterFromPreset: unknown consumable id '${id}'.`);
        }
        return { ...source, quantity };
    });

    const equipment: Partial<Record<EquipmentSlot, Equipment>> = {};
    for (const entry of preset.equipment) {
        equipment[entry.slot] = dropItem(entry.templateId, preset.level, 'common', rng);
    }

    return createCharacter({
        name: preset.name,
        level: preset.level,
        baseStats: preset.baseStats,
        currency: preset.currency,
        inventory,
        equipment,
        knownSkills: preset.knownSkills,
    });
}
