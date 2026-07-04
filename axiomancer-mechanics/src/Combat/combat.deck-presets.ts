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
    'dot-erosion': {
        id: 'dot-erosion',
        name: 'Erosion',
        focus: 'dot',
        description: 'Stack damage-over-time across two aspects and let the enemy bleed out — the fast, hands-off HP clock.',
        cardIds: [
            'straw-mans-jab',       // body DoT (bleed)
            'naturalistic-fallacy', // body DoT (hemorrhage)
            'poisoned-well',        // body DoT (septic, stacks)
            'sorites-whisper',      // mind DoT (unraveling)
            'ship-in-a-bottle',     // mind DoT (unraveling + fatigue)
            'regress-ad-infinitum', // mind DoT (unraveling, tier-3 non-execute payoff)
            'pyrrhic-victory',      // gold — execute gated on 2+ body-DoT stacks
            'brace-for-impact',     // GUARD — brace from turn one
        ],
        wildDieCards: 0,
    },
    'control-lock': {
        id: 'control-lock',
        name: 'Saturation',
        focus: 'control',
        description: 'Deny the enemy its telegraphed turns — chain control + stat-debuffs across all three aspects so it never lands a threat.',
        cardIds: [
            'zenos-half-step',        // body control (slow)
            'slippery-slopes-grip',   // body soft control (fatigue + exposure)
            'ad-hominem-murmur',      // mind control (doubt)
            'false-dilemmas-fork',    // mind control (sensory-null)
            'moving-the-goalposts',   // mind control (doubt + sensory-null)
            'eternal-regress',        // heart control (confusion + slow)
            'suspend-judgment',       // GUARD — brace while the locks land
        ],
        wildDieCards: 0,
    },
    'utility-bulwark': {
        id: 'utility-bulwark',
        name: 'Bulwark',
        focus: 'utility',
        description: 'Outlast and convert — guards on every stance color, self-buffs, and a Befriend line, with just enough offense to still close.',
        cardIds: [
            'brace-for-impact', 'suspend-judgment', 'stoic-reserve',  // GUARD across all three colors
            'ship-of-theseus-drift', 'soothing-words', 'bootstrap-paradox', // self-buff / sustain
            'befriend',                            // the mercy line
            'straw-mans-jab', 'moving-the-goalposts', // a DoT + a control win-condition
        ],
        wildDieCards: 0, // variance is antithetical to a stall deck
    },
    'aggro-strike': {
        id: 'aggro-strike',
        name: 'Onslaught',
        focus: 'rush-execute',
        description: 'The fastest DoT stack in the game — cheap, doubled tier-1 applicators feeding the earliest execute access.',
        cardIds: [
            'straw-mans-jab', 'straw-mans-jab',                 // body tier-1 DoT, doubled — cheapest die-cost
            'appeal-to-pitys-despair', 'appeal-to-pitys-despair', // heart tier-1 DoT, doubled
            'achilles-overtake',                                 // lower-tier execute — smaller detonation, earlier access
            'brace-for-impact',                                  // GUARD
        ],
        wildDieCards: 0,
    },
    'balanced': {
        id: 'balanced',
        name: 'Generalist',
        focus: 'balanced',
        description: 'One of every lever — DoT across all three aspects, control, a self-buff, a guard, Befriend, and a taste of the execute payoff.',
        cardIds: [
            'straw-mans-jab', 'sorites-whisper', 'appeal-to-pitys-despair', // DoT — body / mind / heart
            'zenos-half-step', 'ad-hominem-murmur',                        // control — body / mind
            'ship-of-theseus-drift',                                       // self-buff
            'brace-for-impact',                                            // GUARD
            'befriend',                                                    // mercy line
            'achilles-overtake',                                           // tier-3 execute payoff sample
        ],
        wildDieCards: 0,
    },
    'token-recursion': {
        id: 'token-recursion',
        name: 'Recursion',
        focus: 'balanced',
        description: 'Cheap, reliable token generators spread across body/mind/heart — the payoff comes from Skills triggers, not card power.',
        cardIds: [
            'straw-mans-jab', 'zenos-half-step',    // body — cheap tier-1 token generators
            'liars-paradox', 'ad-hominem-murmur',   // mind — cheap tier-1 token generators
            'ship-of-theseus-drift', 'appeal-to-pitys-despair', // heart — cheap tier-1 token generators
            'brace-for-impact',                     // GUARD
        ],
        tokenLean: 'body/mind/heart spread',
        wildDieCards: 0,
    },
    'wild-escalation': {
        id: 'wild-escalation',
        name: 'Escalation',
        focus: 'balanced',
        description: 'Snowball the dice pool with all three wild-die cards, then cash in with the gold-rare executes that ignore die-cost on a Wild roll.',
        cardIds: [
            'gamblers-folly', 'continuum-fallacy', 'buridans-wager', // all 3 wild-die cards — body / mind / heart
            'straw-mans-jab', 'sorites-whisper', 'bandwagons-pull',  // color-agnostic DoT/control backing
            'pyrrhic-victory', 'the-final-word', 'unmoved-mover',    // gold executes — the wild-synergy payoff tier
            'brace-for-impact',                                      // GUARD (present, not prioritized — this deck snowballs)
        ],
        tokenLean: 'n/a — dice-pool focused',
        wildDieCards: 3,
    },
};

/** Stable display order for the deck-picker (headline status kits first). */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze([
    'dot-erosion', 'control-lock', 'utility-bulwark', 'aggro-strike', 'balanced',
    'token-recursion', 'wild-escalation',
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
