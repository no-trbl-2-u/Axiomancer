/**
 * THE DATA ADAPTER — the single bridge between the editor UI and the REAL
 * Axiomancer mechanics package source (../axiomancer-mechanics/src).
 *
 * Everything the editor knows about cards (a.k.a. Actions — internally typed
 * `Card`), effects/keywords, and the combat enums is re-exported from here so
 * the rest of the app never reaches into the mechanics src directly. These
 * submodules are browser-safe: `cards.library` only imports its own type
 * module, and `effects.library` imports two JSON files (Vite handles JSON
 * natively). We deliberately avoid the big `@mechanics/index` barrel (it can
 * pull node-only code via the "./node" export).
 */

// ── Live REAL data imports (the heart of "incorporate everything") ───────────
import { cardLibrary, getCardById } from '@mechanics/Cards/cards.library';
import { effectsLibrary, lookupEffect } from '@mechanics/Effects/effects.library';
import { rankToRarity, CARD_RANK_NAMES } from '@mechanics/Cards/types';
import { toCombatCard } from '@mechanics/Combat/combat.cards';

// ── Types (erased at runtime; here for full-fidelity editing) ────────────────
import type {
    Card,
    CardAspect,
    CardTier,
    CardTarget,
    CardRank,
    CardRarity,
    CardType,
} from '@mechanics/Cards/types';
import type { Effect, EffectType, EffectCategory } from '@mechanics/Effects/types';
import type { Stance } from '@mechanics/Combat/types';
import type {
    CombatDieColor,
    CombatVerbClass,
    CardEffectKind,
} from '@mechanics/Combat/combat.encounter.types';

// ── Re-exported live data + lookups ──────────────────────────────────────────
export { cardLibrary, getCardById, effectsLibrary, lookupEffect, rankToRarity, CARD_RANK_NAMES, toCombatCard };
export type { Card, CardRank, CardRarity, CardType };

/** Rarity band for a card (spec 32 v3 §4): derived from its rank ladder. */
export const rarityOf = (card: Pick<Card, 'rank'>): CardRarity => rankToRarity(card.rank);

// ── Effects, flattened for the keyword/effect dropdowns ──────────────────────
/** A single selectable effect for the editor's effect dropdowns. */
export interface EffectOption {
    id: string;
    name: string;
    /** 'buff' | 'debuff'. */
    type: EffectType;
    /** Thematic grouping (stat / damage / control / …). */
    category: EffectCategory;
    description: string;
    tier: Effect['tier'];
    duration: number;
    stacking: Effect['stacking'];
}

const toOption = (e: Effect): EffectOption => ({
    id: e.id,
    name: e.name,
    type: e.type,
    category: e.category,
    description: e.description,
    tier: e.tier,
    duration: e.duration,
    stacking: e.stacking,
});

/** All effects (buffs + debuffs) as selectable options, name-sorted. */
export const EFFECTS: EffectOption[] = [
    ...effectsLibrary.buffs,
    ...effectsLibrary.debuffs,
]
    .map(toOption)
    .sort((a, b) => a.name.localeCompare(b.name));

/** Just the debuffs (enemy-facing payloads) — handy for `appliedTo: 'opponent'`. */
export const DEBUFF_EFFECTS: EffectOption[] = EFFECTS.filter((e) => e.type === 'debuff');
/** Just the buffs (self-facing payloads). */
export const BUFF_EFFECTS: EffectOption[] = EFFECTS.filter((e) => e.type === 'buff');

/** O(1) effect-option lookup by id (UI display helper). */
export const lookupEffectOption = (id: string): EffectOption | undefined =>
    EFFECTS.find((e) => e.id === id);

// ── Enum tables (derived from the REAL union types) ──────────────────────────
/** A labelled option for a Segmented / Dropdown control. */
export interface Option<T extends string | number> {
    value: T;
    label: string;
}

/** Philosophical aspect / stance color (heart / body / mind), plus Phase
 *  104's colourless 'any' (the grey office — every die colour powers it). */
export const STANCES: Option<CardAspect>[] = [
    { value: 'body', label: 'BODY' },
    { value: 'mind', label: 'MIND' },
    { value: 'heart', label: 'HEART' },
    { value: 'any', label: 'ANY' },
];
/** Card tier (1 / 2 / 3) — mirrors the effect tier system. */
export const TIERS: Option<CardTier>[] = [
    { value: 1, label: 'I' },
    { value: 2, label: 'II' },
    { value: 3, label: 'III' },
];

/** Spec 32 v3 §4 — the rank ladder (Ash → Saint), printed on the face. */
export const RANKS: Option<CardRank>[] = ([1, 2, 3, 4, 5, 6] as CardRank[]).map((r) => ({
    value: r,
    label: CARD_RANK_NAMES[r].toUpperCase(),
}));

/** Spec 32 v3 §2 — card type (spell / oath / hex). */
export const CARD_TYPES: Option<CardType>[] = [
    { value: 'spell', label: 'SPELL' },
    { value: 'oath', label: 'OATH' },
    { value: 'hex', label: 'HEX' },
];

/** Targeting scope. */
export const TARGET_TYPES: Option<CardTarget>[] = [
    { value: 'enemy', label: 'ENEMY' },
    { value: 'self', label: 'SELF' },
];

/** `appliedTo` domain for combatEffects (relative to the caster). */
export const APPLIED_TO: Option<'self' | 'opponent'>[] = [
    { value: 'opponent', label: 'OPPONENT' },
    { value: 'self', label: 'SELF' },
];

/** The discriminated-union `kind`s of `specialMechanics` (spec 32 v3). */
export const SPECIAL_MECHANIC_KINDS = [
    'strip_random_buff',
    'befriend_attempt',
    'guard',
    'rupture',
    'siphon',
    'barrier',
    'riposte',
    // Fate Engine P1 (spec 31 §4.1) — die-manipulation verbs
    'reroll_spent',
    'refresh_die',
    'convert_die_color',
    'create_temporary_die',
    'grant_pip',
    'overheat',
    'bank_spent_die',
    // Spec 32 v3 — the themed-deck verb set
    'forge_floating_die',
    'float_x_die',
    'stagger',
    'lock_stance',
    'foretell',
    'omen',
    'premise',
    'peroration',
    'spend_premises',
    'spend_all_pips',
    'recoil',
    'recoil_x',
    'extend_dots',
    'convert_dots',
    'boost_all_dots',
    'soul_gain',
    'consume_affliction',
    'reap',
    'reap_all',
    'turnabout',
    'sway',
    'echo',
    'echo_next_spell',
    'reprise',
    'replay_last',
    'conjure_card',
    'rider',
    // Profane-canon rework — the pyre verbs
    'immolate',
    'purge_self',
    // THE BIG NUMBERS REWRITE (2026-09-02) — direct damage and its family.
    // The strike-ban doctrine was repealed: DEAL is a real mechanic again.
    'deal',
    'wrath',
    'flay',
    'twin',
    'chain',
    'execute',
    'overkill',
] as const;
export type SpecialMechanicKind = (typeof SPECIAL_MECHANIC_KINDS)[number];

/** Die-color economy (heart / body / mind / wild / x) — projection-side info. */
export const DIE_COLORS: Option<CombatDieColor>[] = [
    { value: 'body', label: 'BODY' },
    { value: 'mind', label: 'MIND' },
    { value: 'heart', label: 'HEART' },
    { value: 'wild', label: 'WILD' },
    { value: 'x', label: 'X' },
];

/** Combat verb-class taxonomy (projection-side; read-only reference). */
export const VERB_CLASSES: CombatVerbClass[] = [
    'direct-dot',
    'direct-control',
    'stat-debuff',
    'buff-self',
    'direct-damage',
    'befriend',
    'defend',
    'oath',
    'hex',
    'retreat',
];

/** Effect-kind a card's bottom action applies. */
export const EFFECT_KINDS: CardEffectKind[] = ['dot', 'control', 'none'];

/** Stance RPS domain (heart > body > mind > heart). */
export const STANCE_VALUES: Stance[] = ['heart', 'body', 'mind'];
