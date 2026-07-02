/**
 * THE DATA ADAPTER — the single bridge between the editor UI and the REAL
 * Axiomancer mechanics package source (../src).
 *
 * Everything the editor knows about cards (a.k.a. Actions — internally typed
 * `Card`), effects/keywords, and the combat enums is re-exported from here so
 * the rest of the app never reaches into ../src directly. These submodules are
 * browser-safe: `cards.library` only imports its own type module, and
 * `effects.library` imports two JSON files (Vite handles JSON natively). We
 * deliberately avoid the big `../src/index.ts` barrel (it can pull node-only
 * code via the "./node" export).
 */

// ── Live REAL data imports (the heart of "incorporate everything") ───────────
import { cardLibrary, getCardById } from '@mechanics/Cards/cards.library';
import { effectsLibrary, lookupEffect } from '@mechanics/Effects/effects.library';
import { GOLD_CARD_IDS, isGoldCard } from '@mechanics/Combat/combat.cards';

// ── Types (erased at runtime; here for full-fidelity editing) ────────────────
import type {
    Card,
    CardCategory,
    StatType,
    CardTier,
    CardTarget,
} from '@mechanics/Cards/types';
import type { Effect, EffectType, EffectCategory } from '@mechanics/Effects/types';
import type { Stance } from '@mechanics/Combat/types';
import type {
    CombatDieColor,
    CombatVerbClass,
    CardEffectKind,
} from '@mechanics/Combat/combat.encounter.types';

// ── Re-exported live data + lookups ──────────────────────────────────────────
export { cardLibrary, getCardById, effectsLibrary, lookupEffect, GOLD_CARD_IDS };
export type { Card };

/** True when a card id is a GOLD (rare) card. Thin wrapper over the real set. */
export const isGold = (cardId: string): boolean => isGoldCard(cardId);

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

/** Card category — drives the philosophical token generated on use. */
export const CATEGORIES: Option<CardCategory>[] = [
    { value: 'fallacy', label: 'FALLACY' },
    { value: 'paradox', label: 'PARADOX' },
];

/** Philosophical aspect / stance color (heart / body / mind). */
export const STANCES: Option<StatType>[] = [
    { value: 'body', label: 'BODY' },
    { value: 'mind', label: 'MIND' },
    { value: 'heart', label: 'HEART' },
];
/** Alias — `philosophicalAspect` and `scalingStat` share this domain. */
export const SCALING_STATS = STANCES;

/** Card tier (1 / 2 / 3) — mirrors the effect tier system. */
export const TIERS: Option<CardTier>[] = [
    { value: 1, label: 'I' },
    { value: 2, label: 'II' },
    { value: 3, label: 'III' },
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

/** The discriminated-union `kind`s of `specialMechanics`. */
export const SPECIAL_MECHANIC_KINDS = [
    'strip_random_buff',
    'convert_enemy_buff_to_self',
    'secondary_heal_self',
    'befriend_attempt',
    'guard',
    'rupture',
    'compound',
    'siphon',
    'barrier',
    'riposte',
    'execute',
    'amplify',
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
    'retreat',
];

/** Effect-kind a card's bottom action applies. */
export const EFFECT_KINDS: CardEffectKind[] = ['dot', 'control', 'none'];

/** The five-resource resonance economy keys (for resourceCost editing). */
export const RESOURCE_KEYS = ['heart', 'body', 'mind', 'fallacy', 'paradox'] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

/** Stance RPS domain (heart > body > mind > heart). */
export const STANCE_VALUES: Stance[] = ['heart', 'body', 'mind'];
