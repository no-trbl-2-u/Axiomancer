/**
 * THE CAMPAIGN PRESETS — the Profane Canon (2026-08-08 rework).
 *
 * Three presets, and they are NOT independent decks: they are SNAPSHOTS OF
 * ONE DECK EVOLVING through the campaign arc —
 *
 *   the player starts with n weak early-game cards
 *     → earns new cards as encounter rewards
 *     → REMOVES some of the weak starters at a removal encounter
 *     → keeps earning rewards.
 *
 *   THREADBARE (early, 18 cards) — the Threadbare Office: deliberately weak,
 *     honest, teaching cards. One per archetype verb, at whisper volume.
 *     These cards exist to wear out their welcome.
 *   PILGRIM (mid, 30 cards) — the Pilgrim's Burden: the Office minus six
 *     chaff, plus a run of rewards (rot + debt core, vigil/grave splash).
 *   APOSTATE (end, 45 cards) — the Apostate's Canon: further trimmed,
 *     further rewarded. Of the original Office only the heirloom psalter,
 *     one spadeful, and the thumbprick oaths survive.
 *
 * DECK LAW — ONLY ONE SURVIVES THE BIG NUMBERS REWRITE (2026-09-02,
 * `plan/2026-09-02-big-numbers-overhaul.prompt.md` §2/§3 L19): exact aspect
 * thirds per preset (pinned by `deck-presets.engine.test.ts`) — every die
 * color is always live for card play (the color law, generalized). The
 * 18/30/45 size pins, the 50-card hard cap, the ≤4-copies MTG rule, and the
 * LINEAGE multiset-equality law are REPEALED; today's presets happen to still
 * sit at 18/30/45 and still read as a lineage because nobody has had reason
 * to change them, not because anything enforces it any more. `DECK_SIZE_HARD_CAP`
 * below is now advisory (read only by the Upgradeable Dice valve builder's own
 * self-check, not by the preset law).
 *
 * Pure data + pure helpers — card ids are validated against the library at
 * call time (an id that no longer resolves is dropped).
 */

import { getCardById } from '../Cards/cards.library';
import { isUpgradeableDiceEnabled } from './combat.upgradeable-dice';

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

/** Expands { id: copies } records into a flat card-id list. */
function copies(counts: Record<string, number>): string[] {
    return Object.entries(counts).flatMap(([id, n]) => Array.from({ length: n }, () => id));
}

/** A sanity ceiling on a derived deck's size, checked only by
 *  {@link buildUpgradeableDicePresetDeck}'s own self-audit (the deck-size LAW
 *  it used to enforce was repealed 2026-09-02 — see the file header). */
export const DECK_SIZE_HARD_CAP = 50;

// ── THREADBARE — the early office (18 = 6 body / 6 mind / 6 heart) ───────────
const THREADBARE_COUNTS: Record<string, number> = {
    // body
    'spoiled-poultice': 3,
    'chilblain-watch': 3,
    // mind
    'petty-indictment': 2,
    'first-spadeful': 3,
    'grandmothers-psalter': 1,
    // heart
    'thumbprick-oath': 2,
    'thin-hymn': 3,
    'threadbare-cope': 1,
};

// ── PILGRIM — the mid burden (30 = 10/10/10) ─────────────────────────────────
/** Starters cut at the first removal encounter (the confessor's shears). */
export const PILGRIM_REMOVED: Record<string, number> = {
    'spoiled-poultice': 2,
    'thin-hymn': 2,
    'petty-indictment': 1,
    'first-spadeful': 1,
};
/** Rewards earned between the Office and the Burden. */
export const PILGRIM_ADDED: Record<string, number> = {
    // rot core
    'unction-of-boils': 2,
    'the-sextons-bell': 2,
    'the-long-lent': 2,
    'the-untended-garden': 1,
    // debt core
    'promissory-cut': 2,
    'the-vig': 2,
    'dead-pledge': 1,
    'the-red-ledger': 1,
    // vigil splash
    'frostbitten-palisade': 2,
    // grave splash
    'shallow-grave': 2,
    'paupers-pyre': 1,
};

// ── APOSTATE — the end canon (45 = 15/15/15) ─────────────────────────────────
/** The second trimming: almost none of the Office survives it. */
export const APOSTATE_REMOVED: Record<string, number> = {
    'spoiled-poultice': 1,
    'chilblain-watch': 3,
    'petty-indictment': 1,
    'first-spadeful': 1,
    'thin-hymn': 1,
    'threadbare-cope': 1,
};
/** Rewards earned between the Burden and the Canon. */
export const APOSTATE_ADDED: Record<string, number> = {
    // rot deepened
    'gangrene-gospel': 2,
    'communion-of-the-worm': 1,
    'edict-of-the-open-wound': 1,
    'unction-of-boils': 1,
    'the-long-lent': 1,
    // debt deepened
    'distraint': 2,
    'blank-indenture': 1,
    'joint-and-several': 1,
    // vigil package
    'hoarfrost-teeth': 2,
    'nothing-crossed-the-ice': 2,
    'the-reprisal-bell': 1,
    'the-besiegers-winter': 1,
    'every-stone-an-oath': 1,
    'caltrops-under-the-snow': 1,
    // grave recursion
    'the-charnel-ledger': 1,
    'dirge-for-the-disinterred': 2,
    'open-every-grave': 1,
    'the-sextons-count': 1,
};

/** Applies a removal/addition step to a copy-count record (multiset math). */
function evolve(
    base: Record<string, number>,
    removed: Record<string, number>,
    added: Record<string, number>,
): Record<string, number> {
    const next: Record<string, number> = { ...base };
    for (const [id, n] of Object.entries(removed)) {
        next[id] = (next[id] ?? 0) - n;
        if (next[id] <= 0) delete next[id];
    }
    for (const [id, n] of Object.entries(added)) {
        next[id] = (next[id] ?? 0) + n;
    }
    return next;
}

const PILGRIM_COUNTS = evolve(THREADBARE_COUNTS, PILGRIM_REMOVED, PILGRIM_ADDED);
const APOSTATE_COUNTS = evolve(PILGRIM_COUNTS, APOSTATE_REMOVED, APOSTATE_ADDED);

/**
 * The documented deck evolution, exported so the structural tests (and the
 * design doc) can pin the lineage law: each snapshot is its predecessor minus
 * `removed` plus `added` — the campaign arc as machine-checkable data.
 */
export const PRESET_LINEAGE = Object.freeze({
    threadbare: { base: THREADBARE_COUNTS },
    pilgrim: { base: THREADBARE_COUNTS, removed: PILGRIM_REMOVED, added: PILGRIM_ADDED },
    apostate: { base: PILGRIM_COUNTS, removed: APOSTATE_REMOVED, added: APOSTATE_ADDED },
});

export const COMBAT_DECK_PRESETS: Record<string, CombatDeckPreset> = {
    threadbare: {
        id: 'threadbare',
        name: 'The Threadbare Office',
        stage: 'early',
        focus: 'balanced',
        description:
            'What you own when you own nothing: a spoiled poultice, a thin hymn, '
            + 'and a psalter that opens to the page you need. Every card here is '
            + 'waiting to be replaced.',
        cardIds: copies(THREADBARE_COUNTS),
    },
    pilgrim: {
        id: 'pilgrim',
        name: "The Pilgrim's Burden",
        stage: 'mid',
        focus: 'dot',
        description:
            'The Office after the confessor\'s shears and the first rewards of '
            + 'the road: rot that ripens, debts that compound, and a wall worth '
            + 'standing behind.',
        cardIds: copies(PILGRIM_COUNTS),
    },
    apostate: {
        id: 'apostate',
        name: "The Apostate's Canon",
        stage: 'late',
        focus: 'dot',
        description:
            'The full profane canon: gospels of gangrene, contracts signed in X, '
            + 'winter as a weapon, and every grave open. Of the old Office, only '
            + 'the psalter and the oaths remain.',
        cardIds: copies(APOSTATE_COUNTS),
    },
};

/** Stable display order for the deck-picker (campaign order). */
export const COMBAT_DECK_PRESET_ORDER: readonly string[] = Object.freeze([
    'threadbare', 'pilgrim', 'apostate',
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
 * - `starter` — it lives in at least one preset deck; `presetDeck` names it.
 * - `reward`  — it is earned some other way (encounter reward, quest, drop).
 * A derived VIEW of the library, not a gate.
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
 * preset re-tags it automatically.
 */
export function cardOrigin(cardId: string): CardOrigin {
    // Phase 104 — the grey office is the deck every run opens with; its two
    // cards are starters even though no campaign preset seats them.
    if (getCardById(cardId)?.theme === 'grey') {
        return { source: 'starter', presetDeck: 'The Grey Office', presetDeckId: 'grey-office' };
    }
    for (const id of COMBAT_DECK_PRESET_ORDER) {
        const preset = COMBAT_DECK_PRESETS[id];
        if (preset && preset.cardIds.includes(cardId)) {
            return { source: 'starter', presetDeck: preset.name, presetDeckId: preset.id };
        }
    }
    return { source: 'reward' };
}

// ── PHASE D8 — the flag-on dice-valve seats (spec 33 §4 valve 3) ────────────
// Under Upgradeable Dice every preset's BUILT deck swaps exactly one
// same-aspect card INSTANCE of `replacesId` for the stage's reliquary-die
// relic. `cardIds` above stays the flag-off truth.

/** One preset's valve seat: the valve card and the flag-off source it replaces. */
export interface PresetDiceValveSeat {
    /** The dice-interaction card (tagged `dice` + `valve`). */
    valveId: string;
    /** The flag-off card whose ONE instance the valve replaces (same aspect). */
    replacesId: string;
}

/** The valve seat per preset (profane-canon rework: one relic per stage,
 *  one per aspect across the campaign — body, then mind, then heart). */
export const PRESET_DICE_VALVES: Readonly<Record<string, PresetDiceValveSeat>> = Object.freeze({
    threadbare: { valveId: 'knucklebone-recant', replacesId: 'chilblain-watch' },
    pilgrim: { valveId: 'ossuary-drawer', replacesId: 'first-spadeful' },
    apostate: { valveId: 'saints-finger-bone', replacesId: 'thumbprick-oath' },
});

/** True when a card is a dice valve (tagged `dice` + `valve`). */
function isDiceValveCard(id: string): boolean {
    const tags = getCardById(id)?.tags ?? [];
    return tags.includes('dice') && tags.includes('valve');
}

/**
 * Derives a preset's Upgradeable-Dice deck: the flag-off recipe with exactly
 * one instance of the seat's `replacesId` swapped for its valve. Fails LOUDLY
 * (throws) on any structural-law violation — a silent fallback here would
 * ship a wrong-sized or valveless deck into live combat. Returns `[]` only
 * for an unknown preset id (mirroring {@link buildPresetDeck}).
 */
export function buildUpgradeableDicePresetDeck(
    presetId: string,
    seats: Readonly<Record<string, PresetDiceValveSeat>> = PRESET_DICE_VALVES,
): string[] {
    const preset = getDeckPreset(presetId);
    if (!preset) return [];
    const seat = seats[presetId];
    if (!seat) throw new Error(`D8 valve law: preset '${presetId}' has no valve seat.`);
    const valve = getCardById(seat.valveId);
    if (!valve) throw new Error(`D8 valve law: valve '${seat.valveId}' (${presetId}) is not a library card.`);
    const source = getCardById(seat.replacesId);
    if (!source) throw new Error(`D8 valve law: source '${seat.replacesId}' (${presetId}) is not a library card.`);
    if (valve.philosophicalAspect !== source.philosophicalAspect) {
        throw new Error(
            `D8 valve law: '${seat.valveId}' (${valve.philosophicalAspect}) must match `
            + `'${seat.replacesId}' (${source.philosophicalAspect}) — the color law would break.`,
        );
    }
    const idx = preset.cardIds.indexOf(seat.replacesId);
    if (idx < 0) throw new Error(`D8 valve law: '${seat.replacesId}' is not in preset '${presetId}'.`);
    if (preset.cardIds.some(isDiceValveCard)) {
        throw new Error(`D8 valve law: preset '${presetId}' flag-off recipe already carries a valve.`);
    }
    const deck = [...preset.cardIds];
    deck[idx] = seat.valveId;
    if (deck.length !== preset.cardIds.length) {
        throw new Error(`D8 valve law: preset '${presetId}' derived deck changed size.`);
    }
    if (deck.length > DECK_SIZE_HARD_CAP) {
        throw new Error(`Deck law: preset '${presetId}' exceeds the ${DECK_SIZE_HARD_CAP}-card hard cap.`);
    }
    return deck.filter(isValidPresetCard);
}

/**
 * Builds a ready-to-play deck from a preset: the curated cards (invalid ids
 * dropped). No escape-hatch card is appended — once combat is joined it
 * resolves only by winning or losing. Returns an empty array for an unknown
 * preset id (callers can fall back to `buildCombatDeck`).
 *
 * Flag-aware since Phase D8: under Upgradeable Dice the deck is derived by
 * {@link buildUpgradeableDicePresetDeck}; flag-off it is the byte-identical
 * curated recipe.
 */
export function buildPresetDeck(presetId: string): string[] {
    if (isUpgradeableDiceEnabled()) return buildUpgradeableDicePresetDeck(presetId);
    const preset = getDeckPreset(presetId);
    if (!preset) return [];
    return preset.cardIds.filter(isValidPresetCard);
}
