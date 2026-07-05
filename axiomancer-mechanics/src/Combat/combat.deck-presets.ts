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
 * converts; RUSH-EXECUTE is the fastest DoT-stack-into-finisher clock;
 * BALANCED carries one of each lever. RECURSION and ESCALATION (Master Spec
 * §5.6-5.7) sample the newer Skills-token and wild-die-growth systems. Every
 * preset bundles a defensive (GUARD) card so it can brace from turn one,
 * mirroring `STARTING_SKILL_IDS` — ESCALATION keeps exactly one for the same
 * reason but does not lean on it (variance, not turtling, is its identity).
 *
 * Pure data + pure helpers — card ids are validated against the skill library at
 * call time (an id that no longer resolves is dropped), so the lists stay safe to
 * edit as the library evolves.
 */

import { getCardById } from '../Cards/cards.library';
import { SYNTHETIC_CARD_IDS } from './combat.cards';

/**
 * The design lever a preset leans on (mirrors the card effect-kinds).
 * `'damage'` is kept (existing draft/sim-policy consumers key off it) and
 * `'rush-execute'` is added alongside it (Master Spec §5.4) rather than
 * replacing it in place, to avoid an engine-wide rename outside this pass's
 * scope — `'damage'` still means "raw direct-damage lever" wherever else it's
 * used (`combat.deck-draft.ts`, `combat.sim-policies.ts`, `combat.cli.ts`).
 */
export type CombatDeckFocus = 'dot' | 'control' | 'utility' | 'damage' | 'rush-execute' | 'balanced';

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
    /** Dev-UI legibility only (Master Spec §5) — which aspect(s) the deck's
     *  token generation leans on. Omitted where token lean isn't the point. */
    tokenLean?: string;
    /** Dev-UI legibility only — count of wild-die (`grant_permanent_wild_die`)
     *  cards in `cardIds`. */
    wildDieCards?: number;
}

/**
 * The preset roster. Card ids are drawn from the skill library and grouped by the
 * verb-class they project to (see `classifyVerbClass`): DoT, control, stat-debuff
 * (soft control), buff-self / defend (utility), and direct-damage.
 */
export const COMBAT_DECK_PRESETS: Record<string, CombatDeckPreset> = {
    // Fate Engine P1 trim (spec 31 §4.2): presets re-cut over the 48-card
    // curated library. Every preset carries ≥1 threshold/dieBonus/fate card so
    // its headline dice mechanic is reachable, and a GUARD so it braces from
    // turn one. RECURSION and ESCALATION retired with their cut identity cards
    // (the wild-die line lives on inside FATE FORGE).
    'dot-erosion': {
        id: 'dot-erosion',
        name: 'Erosion',
        focus: 'dot',
        description: 'Stack damage-over-time across three aspects, amplify it, then detonate — the patient clock, cashed early.',
        cardIds: [
            'slippery-slope',        // body poison (ramps)
            'hasty-generalization',  // body bleed + Body-threshold rider
            'poisoned-well',         // body septic (damps its hits)
            'eternal-regress',       // mind unraveling + mind-die rider
            'leeching-syllogism',    // heart hemorrhage + siphon sustain
            'the-inevitable',        // AMPLIFY payoff + Mind-threshold tick-all
            'resonance-detonation',  // RUPTURE payoff
            'pyrrhic-victory',       // gold — execute gated on DoT stacks
            'brace-for-impact',      // GUARD — brace from turn one
        ],
        wildDieCards: 0,
    },
    'control-lock': {
        id: 'control-lock',
        name: 'Saturation',
        focus: 'control',
        description: 'Deny the enemy its telegraphed turns — doubt cancels riders, confusion weakens, fear + confusion DETONATE into a stagger.',
        cardIds: [
            'false-dilemma',          // confusion + off-color rider
            'undistributed-middle',   // confusion + Mind-threshold rider
            'moving-the-goalposts',   // doubt + overextended (both real)
            'liars-echo',             // MARK — the stance goes public
            'appeal-to-consequences', // fear + Body-threshold chip
            'existential-collapse',   // REACT: fear+confusion → stagger burst
            'suspend-judgment',       // GUARD + bank the die (Epoché)
        ],
        wildDieCards: 0,
    },
    'utility-bulwark': {
        id: 'utility-bulwark',
        name: 'Bulwark',
        focus: 'utility',
        description: 'Outlast and convert — guards on every color, real damage reduction, thorns, and the mercy line.',
        cardIds: [
            'brace-for-impact', 'suspend-judgment', 'stoic-reserve', // GUARD across the colors (+pips)
            'appeal-to-pity', 'soothing-words',                      // heal + resolute / cleanse
            'apophatic-aegis', 'tu-quoque',                          // barrier + thorns
            'briar-riposte',                                         // the parry
            'befriend',                                              // the mercy line
            'hasty-generalization',                                  // a win-condition
        ],
        wildDieCards: 0, // variance is antithetical to a stall deck
    },
    'aggro-strike': {
        id: 'aggro-strike',
        name: 'Onslaught',
        focus: 'rush-execute',
        description: 'Spend body dice fast and cash the resonance thresholds — the quickest route to an execute.',
        cardIds: [
            'hasty-generalization', 'hasty-generalization', // body bleed ×2 — feeds the Body tally
            'achilles-gambit',                              // bleed + the FATE line
            'mob-appeal',                                   // strike + Body-threshold chip
            'appeal-to-consequences',                       // fear + Body-threshold chip
            'achilles-overtake',                            // the execute
            'brace-for-impact',                             // GUARD
        ],
        wildDieCards: 0,
    },
    'fate-forge': {
        id: 'fate-forge',
        name: 'Fate Forge',
        focus: 'balanced',
        description: 'The dice ARE the deck — fate cards that spend dead X dice, forged and converted dice, ripened Reserve pips, and the wild-die snowball.',
        cardIds: [
            'achilles-gambit',        // FATE — the impossible strike
            'barbers-paradox',        // FATE — the unresolvable question
            'pascals-wager',          // FATE — infinite payoff
            'transcendent-synthesis', // FATE — synthesis of the dead faces
            'ship-of-theseus',        // convert the die to WILD
            'bat-swarm-thoughtform',  // forge a temporary die
            'gamblers-folly',         // wild-die growth (real downside now)
            'unmoved-mover',          // gold — stagger + ripen the Reserve
            'brace-for-impact',       // GUARD
        ],
        tokenLean: 'n/a — dice-pool focused',
        wildDieCards: 1,
    },
    'balanced': {
        id: 'balanced',
        name: 'Generalist',
        focus: 'balanced',
        description: 'One of every lever — DoT, control, anti-heal, a guard, sustain, Befriend, and the execute payoff.',
        cardIds: [
            'slippery-slope', 'hasty-generalization', // DoT — poison + bleed
            'existential-debt',                       // heart despair + isolate (anti-heal)
            'false-dilemma', 'moving-the-goalposts',  // control — confusion + doubt
            'appeal-to-pity',                         // heal + resolute
            'brace-for-impact',                       // GUARD
            'befriend',                               // mercy line
            'achilles-overtake',                      // tier-3 execute payoff
        ],
        wildDieCards: 0,
    },
};

/** Stable display order for the deck-picker (headline status kits first). */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze([
    'dot-erosion', 'control-lock', 'utility-bulwark', 'aggro-strike', 'fate-forge', 'balanced',
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
