/**
 * Spec 26b deckbuilder — PRESET combat decks (focused starter / sandbox decks).
 *
 * A preset is a curated, ready-to-play list of skill-card ids with a single
 * design FOCUS — the lever it leans on to drop enemy HP to 0. They give the
 * mobile sandbox, tuning sims, and "pick-a-style" onboarding a hand-authored
 * deck per archetype-of-play WITHOUT requiring the player to have learned the
 * skills first (unlike `buildCombatDeck`, which projects a character's actual
 * `knownSkills`). Pass the result of `buildPresetDeck` straight into
 * `initializeCombatEncounter(player, enemy, deck)`.
 *
 * Doctrine (CLAUDE.md): status effects are the main fun. The DoT and CONTROL
 * presets are the headline kits — they erode / hinder. UTILITY survives and
 * converts; DAMAGE is the deliberately-weak basic-attack baseline kept honest
 * with a status splash; BALANCED carries one of each lever. Every preset bundles
 * a defensive (GUARD) card so it can brace from turn one, mirroring
 * `STARTING_SKILL_IDS`.
 *
 * Pure data + pure helpers — card ids are validated against the skill library at
 * call time (an id that no longer resolves is dropped), so the lists stay safe to
 * edit as the library evolves.
 */

import { getCardById } from '../Cards/cards.library';
import { SYNTHETIC_CARD_IDS } from './combat.cards';

/** The design lever a preset leans on (mirrors the card effect-kinds). */
export type CombatDeckFocus = 'dot' | 'control' | 'utility' | 'damage' | 'balanced';

/** A curated, ready-to-play combat deck with a single design focus. */
export interface CombatDeckPreset {
    /** Stable kebab-case id. */
    id: string;
    /** Display name (the mobile deck-picker label). */
    name: string;
    /** The lever this deck leans on. */
    focus: CombatDeckFocus;
    /** One-line pitch for the deck-picker. */
    description: string;
    /** Curated skill-card ids. DUPLICATES are intentional (extra copies of a key
     *  card are part of the deck's identity — the deckbuilder point). */
    cardIds: readonly string[];
}

/**
 * The preset roster. Card ids are drawn from the skill library and grouped by the
 * verb-class they project to (see `classifyVerbClass`): DoT, control, stat-debuff
 * (soft control), buff-self / defend (utility), and direct-damage.
 */
export const COMBAT_DECK_PRESETS: Record<string, CombatDeckPreset> = {
    'dot-erosion': {
        id: 'dot-erosion',
        name: 'Erosion',
        focus: 'dot',
        description: 'Stack damage-over-time and let the enemy bleed out — the fast, hands-off HP clock.',
        cardIds: [
            'slippery-slope', 'slippery-slope',   // body DoT (bleed) — the backbone, doubled
            'sorites-cascade', 'sorites-cascade',  // mind DoT — second stacking source
            'pyrrhic-victory',                     // gold — a MAJOR DoT finisher
            'the-final-word',                      // gold — guaranteed DoT at boosted intensity
            'resonance-bleed', 'straw-giant',      // chip strikes to close a low-HP enemy
            'brace-for-impact',                    // GUARD — brace from turn one
        ],
    },
    'control-lock': {
        id: 'control-lock',
        name: 'Saturation',
        focus: 'control',
        description: 'Deny the enemy its telegraphed turns — chain control + stat-debuffs so it never lands a threat.',
        cardIds: [
            'false-dilemma', 'heap-of-doubt',      // mind tier-1 control — cheap, spammable openers
            'eternal-regress',                     // heart control (confusion + slow)
            'barbers-paradox', 'gamblers-ruin',    // mind control
            'appeal-to-fear',                      // heart control (fear)
            'buridans-impasse',                    // mind control
            'unmoved-mover',                       // gold — a MAJOR control lock
            'red-herring', 'appeal-to-authority',  // stat-debuffs — soft control to fill gaps
            'suspend-judgment',                    // GUARD — brace while the locks land
        ],
    },
    'utility-bulwark': {
        id: 'utility-bulwark',
        name: 'Bulwark',
        focus: 'utility',
        description: 'Outlast and convert — guards, self-buffs, and a Befriend line, with just enough offense to close.',
        cardIds: [
            'brace-for-impact', 'suspend-judgment', 'stoic-reserve',  // GUARD across all three colors
            'stoic-bulwark', 'apophatic-aegis',    // heart defensive buffs
            'bootstrap-paradox', 'soothing-words', // heart sustain / utility
            'befriend',                            // the mercy line
            'slippery-slope', 'eternal-regress',   // a DoT + a control win-condition so it can still close
        ],
    },
    'aggro-strike': {
        id: 'aggro-strike',
        name: 'Onslaught',
        focus: 'damage',
        description: 'Raw HP strikes — the fastest baseline clock, splashed with one DoT so it is not pure trading.',
        cardIds: [
            'ad-hominem-strike', 'ad-hominem-strike',  // body tier-1 strike, doubled
            'achilles-gambit', 'hasty-generalization', // tier-1 strikes
            'mob-appeal', 'sunk-cost-momentum',        // body tier-2 strikes
            'straw-giant', 'grandfather-paradox',      // body tier-3 finishers
            'slippery-slope',                          // a DoT splash — keeps a status payoff in the kit
            'brace-for-impact',                        // GUARD
        ],
    },
    'balanced': {
        id: 'balanced',
        name: 'Generalist',
        focus: 'balanced',
        description: 'One of every lever — DoT, control, a strike, a buff, a guard, and Befriend. A flexible default.',
        cardIds: [
            'slippery-slope', 'sorites-cascade',   // DoT
            'eternal-regress', 'red-herring',      // control + soft control
            'ad-hominem-strike', 'mob-appeal',     // strikes
            'bootstrap-paradox',                   // self-buff
            'brace-for-impact',                    // GUARD
            'befriend',                            // mercy line
        ],
    },
};

/** Stable display order for the deck-picker (headline status kits first). */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze([
    'dot-erosion', 'control-lock', 'utility-bulwark', 'aggro-strike', 'balanced',
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
