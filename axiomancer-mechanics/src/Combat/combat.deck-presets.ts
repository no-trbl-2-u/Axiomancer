/**
 * Spec 32 v3 §8 — the TEN themed preset decks.
 *
 * Every preset follows the owner's recipe exactly: 4 copies × 2 unique
 * commons, 2 copies × 2 unique uncommons, 1 copy × 3 unique rares (the rare
 * spell finisher + the theme's enchantment + its disenchant) = 15 cards, all
 * in-theme. Themes are strictly self-contained — zero card overlap; only the
 * synthetic Retreat is shared (appended by `buildPresetDeck`).
 *
 * Each deck plays fundamentally differently (the deck-distinctness law):
 * Erosion ramps DoTs and detonates; Oratory builds Premises toward a declared
 * conclusion (CONCEDE at 8); Foundry manufactures dice and cashes the pips;
 * Penitent buys power with blood and turns Fallen into a state of grace;
 * Standstill strips action rungs and lets BACKFIRE bleed the denied blows;
 * Augury sees the future and collects when it arrives; Tithe churns short
 * afflictions into Souls and swings the scythe; Grace never touches HP —
 * SWAY to CAPITULATION; Bastion lets their aggression kill them; Refrain
 * replays its greatest hits until the tune kills.
 *
 * Pure data + pure helpers — card ids are validated against the library at
 * call time (an id that no longer resolves is dropped).
 */

import { getCardById } from '../Cards/cards.library';
import { SYNTHETIC_CARD_IDS } from './combat.cards';

/**
 * The design lever a preset leans on. Kept coarse for the draft/sim-policy
 * consumers; `theme` (below) carries the v3 identity.
 */
export type CombatDeckFocus = 'dot' | 'control' | 'utility' | 'damage' | 'rush-execute' | 'balanced';

/** A curated, ready-to-play combat deck with a single design focus. */
export interface CombatDeckPreset {
    /** Stable kebab-case id. */
    id: string;
    /** Display name (the mobile deck-picker label). */
    name: string;
    /** Spec 32 v3 theme key (T1-T10). */
    theme: string;
    /** The coarse lever this deck leans on (sim-policy compatibility). */
    focus: CombatDeckFocus;
    /** One-line pitch for the deck-picker. */
    description: string;
    /** Curated card ids on the 4/4/2/2/1/1/1 recipe. DUPLICATES intentional. */
    cardIds: readonly string[];
}

/** Builds the 15-card recipe list: commons ×4, uncommons ×2, rares ×1. */
function recipe(
    c1: string, c2: string, u1: string, u2: string,
    rareSpell: string, enchantment: string, disenchant: string,
): string[] {
    return [
        c1, c1, c1, c1,
        c2, c2, c2, c2,
        u1, u1,
        u2, u2,
        rareSpell, enchantment, disenchant,
    ];
}

export const COMBAT_DECK_PRESETS: Record<string, CombatDeckPreset> = {
    erosion: {
        id: 'erosion',
        name: 'Erosion',
        theme: 'affliction',
        focus: 'dot',
        description: 'Stack poison and bleed, stretch them, convert them — then detonate everything at once.',
        cardIds: recipe(
            'slippery-slope', 'straw-mans-jab',
            'festering-argument', 'currys-conversion',
            'resonance-detonation', 'venom-and-vein', 'suppurating-curse',
        ),
    },
    oratory: {
        id: 'oratory',
        name: 'Oratory',
        theme: 'peroration',
        focus: 'balanced',
        description: 'Build the case premise by premise; the declared conclusion fires free — and at eight, they concede.',
        cardIds: recipe(
            'exordium', 'opening-statement',
            'mounting-case', 'peroratio-interrupta',
            'the-closing-word', 'practiced-cadence', 'captive-audience',
        ),
    },
    foundry: {
        id: 'foundry',
        name: 'Foundry',
        theme: 'forge',
        focus: 'utility',
        description: 'Manufacture dice from nothing, ripen the pips, then spend every one in a single overwhelming stride.',
        cardIds: recipe(
            'sketch-of-a-thought', 'half-step',
            'bootstrap-loop', 'ex-nihilo',
            'the-overtake', 'anvil-of-form', 'entropy-tax',
        ),
    },
    penitent: {
        id: 'penitent',
        name: 'Penitent',
        theme: 'akrasia',
        focus: 'dot',
        description: 'Pay in blood for undercosted power; two self-afflictions make you Fallen, and the debt starts arguing for you.',
        cardIds: recipe(
            'against-my-judgment', 'sweet-poison',
            'self-flagellant', 'fallen-grace',
            'pact-of-akrasia', 'crown-of-thorns', 'mirror-of-guilt',
        ),
    },
    standstill: {
        id: 'standstill',
        name: 'Standstill',
        theme: 'control',
        focus: 'control',
        description: 'Strip the rungs from every telegraphed blow; what cannot land, lands inward.',
        cardIds: recipe(
            'zenos-half-step', 'red-herring',
            'undistributed-middle', 'arrow-paradox',
            'paralysis-of-analysis', 'achilles-and-the-tortoise', 'quagmire-of-doubt',
        ),
    },
    augury: {
        id: 'augury',
        name: 'Augury',
        theme: 'oracle',
        focus: 'balanced',
        description: 'See the next move, declare it aloud, and collect on every prophecy that comes true.',
        cardIds: recipe(
            'glimpse', 'signs-and-portents',
            'cassandras-burden', 'delphic-ambiguity',
            'prophecy-fulfilled', 'the-oracles-eye', 'fated-course',
        ),
    },
    tithe: {
        id: 'tithe',
        name: 'Tithe',
        theme: 'harvest',
        focus: 'rush-execute',
        description: 'Plant short afflictions, harvest the Souls as they expire, and swing the scythe when the bank is full.',
        cardIds: recipe(
            'brief-candle', 'memento-mori',
            'winnowing', 'the-gleaners-due',
            'the-reaping', 'bone-orchard', 'the-tithe',
        ),
    },
    grace: {
        id: 'grace',
        name: 'Grace',
        theme: 'charm',
        // SWAY/RAPPORT cards classify as the control lever (they hinder and
        // soften the enemy); 'control' keeps the draft/sim-policy consumers
        // pointed at the deck's real texture.
        focus: 'control',
        description: 'The deck that never strikes: build SWAY past their resolve and win by capitulation — or mercy.',
        cardIds: recipe(
            'soft-word', 'disarming-smile',
            'common-ground', 'the-olive-branch',
            'heart-of-the-matter', 'irresistible-grace', 'mirror-of-longing',
        ),
    },
    bastion: {
        id: 'bastion',
        name: 'Bastion',
        theme: 'bulwark',
        focus: 'utility',
        description: 'Guard, thorns, riposte — stand behind the wall and let their own aggression kill them.',
        cardIds: recipe(
            'brace-for-impact', 'nettle-cloak',
            'tu-quoque', 'measured-answer',
            'the-adamant-wall', 'hedgehogs-dilemma', 'crumbling-resolve',
        ),
    },
    refrain: {
        id: 'refrain',
        name: 'Refrain',
        theme: 'echo',
        focus: 'balanced',
        description: 'Nothing is said once: echo, reprise, replay — the tune they cannot stop hearing is yours.',
        cardIds: recipe(
            'refrain', 'second-thoughts',
            'ad-nauseam', 'circular-reasoning',
            'ouroboros', 'resonant-chamber', 'stuck-in-their-head',
        ),
    },
};

/** Stable display order for the deck-picker (spec §8 table order). */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze([
    'erosion', 'oratory', 'foundry', 'penitent', 'standstill',
    'augury', 'tithe', 'grace', 'bastion', 'refrain',
]);

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

/** True when a card id resolves to a real skill (presets carry only skill-sourced cards). */
function isValidPresetCard(id: string): boolean {
    return !!getCardById(id);
}

/**
 * Builds a ready-to-play deck from a preset: the curated cards (invalid ids
 * dropped) PLUS the synthetic baseline (Retreat) so a player can always leave a
 * fight — exactly the contract `buildCombatDeck` guarantees. Returns an empty
 * array for an unknown preset id (callers can fall back to `buildCombatDeck`).
 */
export function buildPresetDeck(presetId: string): string[] {
    const preset = getDeckPreset(presetId);
    if (!preset) return [];
    const deck = preset.cardIds.filter(isValidPresetCard);
    for (const id of SYNTHETIC_CARD_IDS) {
        if (!deck.includes(id)) deck.push(id);
    }
    return deck;
}
