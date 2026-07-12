/**
 * Spec 32 v3 §8 — the TEN themed preset decks.
 *
 * Every preset follows the owner's recipe exactly: 4 copies × 2 unique
 * commons, 2 copies × 2 unique uncommons, 1 copy × 3 unique rares (the rare
 * spell finisher + an enchantment + a disenchant) = 15 cards, and no
 * in-combat escape card is appended to any of them (no retreat exists once
 * combat is joined).
 *
 * THE COLOR LAW OF RECIPES (ratified 2026-07-12, spec 32 §12 item 9): every
 * preset carries exactly 5 body / 5 mind / 5 heart cards by
 * `philosophicalAspect`. All three die colors are always possible in the
 * tray and the Color Law otherwise strands off-color dice (the owner
 * playtest found foundry/standstill/tithe at ZERO heart — every purple die
 * dead for card play). Under the fixed 4/4/2/2/1/1/1 recipe the only legal
 * partition of 15 into 5/5/5 is 4+1 / 4+1 / 2+2+1: commons in two different
 * colors, both uncommons in the third, rares one of each color. Where a
 * theme's own 7 cards cannot cover the partition, the preset BORROWS
 * utility-leaning cards of the missing color from a neighbor theme (same
 * rarity slot, same cardType slot) — see {@link PRESET_COLOR_BORROWS}.
 * Color playability outranks strict theme purity; each theme's hallmark
 * engine cards stay home. Cards squeezed out of every recipe by the law
 * remain in the 70-card reward pool as reward/draft-only cards.
 *
 * Each deck still plays fundamentally differently (the deck-distinctness
 * law): Erosion ramps DoTs and detonates; Oratory builds Premises toward a
 * declared conclusion (CONCEDE at 8); Foundry manufactures dice and cashes
 * the pips; Penitent buys power with blood and turns Fallen into a state of
 * grace; Standstill strips action rungs and lets BACKFIRE bleed the denied
 * blows; Augury sees the future and collects when it arrives; Tithe churns
 * short afflictions into Souls and swings the scythe; Grace never strikes —
 * SWAY to CAPITULATION; Bastion lets their aggression kill them; Refrain
 * replays its greatest hits until the tune kills.
 *
 * Pure data + pure helpers — card ids are validated against the library at
 * call time (an id that no longer resolves is dropped).
 */

import { getCardById } from '../Cards/cards.library';

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
        // Colors 5/5/5: body = slippery×4 + venom | heart = opening×4 +
        // resonance | mind = festering×2 + currys×2 + curse.
        // Borrow: opening-statement (peroration, heart) replaces
        // straw-mans-jab — its mark+poison payload feeds the DoT/RUPTURE
        // engine directly (MARK amplifies every tick).
        cardIds: recipe(
            'slippery-slope', 'opening-statement',
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
        // Colors 5/5/5: heart = exordium×4 + closing-word | body = brace×4 +
        // venom | mind = mounting×2 + peroratio×2 + quagmire.
        // Borrows: brace-for-impact (bulwark, body — GUARD utility keeps the
        // case-builder alive; also keeps the starter card seated),
        // venom-and-vein (affliction, body ench — +1 intensity on the deck's
        // own poison payloads), quagmire-of-doubt (control, mind dis —
        // universal telegraph softener).
        cardIds: recipe(
            'exordium', 'brace-for-impact',
            'mounting-case', 'peroratio-interrupta',
            'the-closing-word', 'venom-and-vein', 'quagmire-of-doubt',
        ),
    },
    foundry: {
        id: 'foundry',
        name: 'Foundry',
        theme: 'forge',
        focus: 'utility',
        description: 'Manufacture dice from nothing, ripen the pips, then spend every one in a single overwhelming stride.',
        // Colors 5/5/5: heart = signs×4 + mirror-of-longing | body =
        // half-step×4 + overtake | mind = bootstrap×2 + ex-nihilo×2 + anvil.
        // Borrows: signs-and-portents (oracle, heart — OMEN rides any
        // powering die, pure draw utility), mirror-of-longing (charm, heart
        // dis — half-step/overtake guard converts to SWAY).
        cardIds: recipe(
            'signs-and-portents', 'half-step',
            'bootstrap-loop', 'ex-nihilo',
            'the-overtake', 'anvil-of-form', 'mirror-of-longing',
        ),
    },
    penitent: {
        id: 'penitent',
        name: 'Penitent',
        theme: 'akrasia',
        focus: 'dot',
        description: 'Pay in blood for undercosted power; two different self-afflictions make you Fallen, and the debt starts arguing for you.',
        // Colors 5/5/5: heart = judgment×4 + crown | body = sweet-poison×4 +
        // pact | mind = undistributed×2 + delphic×2 + mirror-of-guilt.
        // Borrows: undistributed-middle (control, mind — stagger+backfire
        // keeps the self-harm deck alive), delphic-ambiguity (oracle, mind —
        // cashes the deck's own enemy DoTs early). Both self-afflictions
        // toward FALLEN stay home in the commons.
        cardIds: recipe(
            'against-my-judgment', 'sweet-poison',
            'undistributed-middle', 'delphic-ambiguity',
            'pact-of-akrasia', 'crown-of-thorns', 'mirror-of-guilt',
        ),
    },
    standstill: {
        id: 'standstill',
        name: 'Standstill',
        theme: 'control',
        focus: 'control',
        description: 'Strip the rungs from every telegraphed blow; what cannot land, lands inward.',
        // Colors 5/5/5: body = zeno×4 + hedgehog | mind = red-herring×4 +
        // paralysis | heart = cassandra×2 + fallen-grace×2 + mirror.
        // Borrows: cassandras-burden (oracle, heart — OMEN guard + chip),
        // fallen-grace (akrasia, heart — bleed chip + draw), hedgehogs-
        // dilemma (bulwark, body ench), mirror-of-longing (charm, heart dis
        // — the deck's heavy guard converts to SWAY). STAGGER/BACKFIRE core
        // (zeno, red-herring, paralysis) stays home.
        cardIds: recipe(
            'zenos-half-step', 'red-herring',
            'cassandras-burden', 'fallen-grace',
            'paralysis-of-analysis', 'hedgehogs-dilemma', 'mirror-of-longing',
        ),
    },
    augury: {
        id: 'augury',
        name: 'Augury',
        theme: 'oracle',
        focus: 'balanced',
        description: 'See the next move, declare it aloud, and collect on every prophecy that comes true.',
        // Colors 5/5/5: mind = glimpse×4 + prophecy | heart = signs×4 + eye |
        // body = arrow×2 + flagellant×2 + crumbling.
        // Borrows: arrow-paradox (control, body — stagger/lock defense),
        // self-flagellant (akrasia, body — RUPTURE detonates glimpse's
        // poison+mark), crumbling-resolve (bulwark, body dis).
        cardIds: recipe(
            'glimpse', 'signs-and-portents',
            'arrow-paradox', 'self-flagellant',
            'prophecy-fulfilled', 'the-oracles-eye', 'crumbling-resolve',
        ),
    },
    tithe: {
        id: 'tithe',
        name: 'Tithe',
        theme: 'harvest',
        focus: 'rush-execute',
        description: 'Plant short afflictions, harvest the Souls as they expire, and swing the scythe when the bank is full.',
        // Colors 5/5/5: body = candle×4 + reaping | heart = disarming×4 +
        // stuck | mind = gleaners×2 + circular×2 + orchard.
        // Borrows: disarming-smile (charm, heart — rapport softening),
        // circular-reasoning (echo, mind — REPRISE returns the reap payoffs
        // from the discard), stuck-in-their-head (echo, heart dis — drips on
        // circular's reprises).
        cardIds: recipe(
            'brief-candle', 'disarming-smile',
            'the-gleaners-due', 'circular-reasoning',
            'the-reaping', 'bone-orchard', 'stuck-in-their-head',
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
        // Colors 5/5/5: heart = soft-word×4 + irresistible | mind =
        // second-thoughts×4 + ouroboros | body = olive×2 + measured×2 +
        // crumbling.
        // Borrows: second-thoughts (echo, mind — zero-damage draw/reprise
        // utility), measured-answer (bulwark, body — guard keeps the SWAY
        // engine alive; its riposte is reactive-only), ouroboros (echo, mind
        // — replays soft-word for double SWAY), crumbling-resolve (bulwark,
        // body dis — NOTE: its standing-wall drip deals HP, a documented
        // dent in grace's never-touches-HP purity, traded for survival).
        cardIds: recipe(
            'soft-word', 'second-thoughts',
            'the-olive-branch', 'measured-answer',
            'ouroboros', 'irresistible-grace', 'crumbling-resolve',
        ),
    },
    bastion: {
        id: 'bastion',
        name: 'Bastion',
        theme: 'bulwark',
        // Post-5/5/5 the deck's classifier-visible surface is genuinely mixed:
        // nettle/sketch read as dot chip, tu-quoque/adamant as defense,
        // common-ground as control, mirror-of-longing as an alt-win. The old
        // 'utility' label needed brace-for-impact's ×4 defend copies (now
        // seated in oratory); 'balanced' is the honest coarse label.
        focus: 'balanced',
        description: 'Thorns, riposte, and a stinging cloak — stand behind the wall and let their own aggression kill them.',
        // Colors 5/5/5: body = nettle×4 + adamant-wall | mind = sketch×4 +
        // resonant | heart = tu-quoque×2 + common-ground×2 + mirror.
        // Borrows: sketch-of-a-thought (forge, mind — kindle + ember chip +
        // draw), common-ground (charm, heart — rapport softening),
        // resonant-chamber (echo, mind ench — first spell each turn echoes:
        // double guard/thorns), mirror-of-longing (charm, heart dis — THE
        // guard deck's prevented damage becomes SWAY, a real alt-win).
        // THORNS stays on the ×4 body common (nettle) so the reflect engine
        // ignites off the deck's dominant die color; brace-for-impact moves
        // to oratory's body slot (guard is utility-10 anywhere).
        // Thorns/riposte core (nettle, tu-quoque, adamant) stays home.
        cardIds: recipe(
            'nettle-cloak', 'sketch-of-a-thought',
            'tu-quoque', 'common-ground',
            'the-adamant-wall', 'resonant-chamber', 'mirror-of-longing',
        ),
    },
    refrain: {
        id: 'refrain',
        name: 'Refrain',
        theme: 'echo',
        focus: 'balanced',
        description: 'Nothing is said once: echo, reprise, replay — the tune they cannot stop hearing is yours.',
        // Colors 5/5/5: mind = refrain×4 + ouroboros | heart = opening×4 +
        // stuck | body = winnowing×2 + flagellant×2 + venom.
        // Borrows: opening-statement (peroration, heart — mark+poison for
        // ECHO to double), winnowing (harvest, body — cashes the echoed
        // DoTs), self-flagellant (akrasia, body — RUPTURE detonates the
        // echoed marks), venom-and-vein (affliction, body ench — the echoed
        // poison lands harder). ECHO core (refrain, ouroboros, stuck) stays
        // home.
        cardIds: recipe(
            'refrain', 'opening-statement',
            'winnowing', 'self-flagellant',
            'ouroboros', 'venom-and-vein', 'stuck-in-their-head',
        ),
    },
};

/**
 * The documented cross-theme borrows of the 5/5/5 color law (spec 32 §12
 * item 9) — preset id → the borrowed off-theme card ids in its recipe.
 * Structural tests pin preset composition against exactly this map: a card
 * in a preset is either in-theme or listed here.
 */
export const PRESET_COLOR_BORROWS: Readonly<Record<string, readonly string[]>> = Object.freeze({
    erosion: ['opening-statement'],
    oratory: ['brace-for-impact', 'venom-and-vein', 'quagmire-of-doubt'],
    foundry: ['signs-and-portents', 'mirror-of-longing'],
    penitent: ['undistributed-middle', 'delphic-ambiguity'],
    standstill: ['cassandras-burden', 'fallen-grace', 'hedgehogs-dilemma', 'mirror-of-longing'],
    augury: ['arrow-paradox', 'self-flagellant', 'crumbling-resolve'],
    tithe: ['disarming-smile', 'circular-reasoning', 'stuck-in-their-head'],
    grace: ['second-thoughts', 'measured-answer', 'ouroboros', 'crumbling-resolve'],
    bastion: ['sketch-of-a-thought', 'common-ground', 'resonant-chamber', 'mirror-of-longing'],
    refrain: ['opening-statement', 'winnowing', 'self-flagellant', 'venom-and-vein'],
});

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

/** True when a card id resolves to a real card (presets carry only card-sourced cards). */
function isValidPresetCard(id: string): boolean {
    return !!getCardById(id);
}

/**
 * How a card enters the player's collection.
 * - `starter` — it lives in at least one preset deck (the decks a player can
 *   pick at the start); `presetDeck` names that deck.
 * - `reward`  — it is earned some other way (encounter reward, quest, drop).
 *
 * Today the rule is one-directional (starters come from presets; rewards do
 * not appear in presets), but that is NOT enforced — a card could in future be
 * BOTH a preset staple and a reward. This is a derived VIEW of the library, not
 * a gate.
 */
export type CardSource = 'starter' | 'reward';

/** A card's origin, DERIVED live from {@link COMBAT_DECK_PRESETS}. */
export interface CardOrigin {
    source: CardSource;
    /** The preset deck this card belongs to (only when `source === 'starter'`). */
    presetDeck?: string;
    /** The preset's stable id (only when `source === 'starter'`). */
    presetDeckId?: string;
}

/**
 * Computes a card's origin dynamically: a card in any preset's recipe is a
 * `starter` tagged with that preset; everything else is a `reward`. Because it
 * reads the presets at call time, adding a card to (or removing it from) a
 * preset re-tags it automatically — no per-card metadata to keep in sync.
 */
export function cardOrigin(cardId: string): CardOrigin {
    for (const id of COMBAT_DECK_PRESET_ORDER) {
        const preset = COMBAT_DECK_PRESETS[id];
        if (preset && preset.cardIds.includes(cardId)) {
            return { source: 'starter', presetDeck: preset.name, presetDeckId: preset.id };
        }
    }
    return { source: 'reward' };
}

/**
 * Builds a ready-to-play deck from a preset: the curated cards (invalid ids
 * dropped). There is no escape-hatch card appended — once combat is joined it
 * resolves only by winning or losing (no in-combat retreat exists). Returns an
 * empty array for an unknown preset id (callers can fall back to `buildCombatDeck`).
 */
export function buildPresetDeck(presetId: string): string[] {
    const preset = getDeckPreset(presetId);
    if (!preset) return [];
    return preset.cardIds.filter(isValidPresetCard);
}
