/**
 * Engine card-library adapter.
 *
 * Bridges the engine's `Card` shape (`cardLibrary` + `getCardById`) to the
 * mobile presentation row consumed by the combat card picker.
 *
 * Mapping:
 *   - `id` = engine `id` (e.g. `'slippery-slope'`)
 *   - `name` = engine `name`, uppercased for display
 *   - `description` = engine `description` verbatim
 *   - `stance` = engine `color` ('body' | 'mind' | 'heart')
 */

import {
    cardLibrary,
    getCardById,
    type Card,
    type CardCombatEffects,
    type CardTarget,
} from '@mechanics';

import { keywordForEffect } from '@/state/combat/keywords';

/**
 * The philosophical stances a card can be locked to, plus the colourless
 * 'any' (the grey office).
 */
export type StanceKey = 'heart' | 'body' | 'mind' | 'any';

export interface CombatCardOption {
    /** Stable engine card id. */
    id: string;
    /** Display name in caps. */
    name: string;
    /** Display description. */
    description: string;
    /** Stance the card is locked to. */
    stance: StanceKey;
    /** 'enemy' = damage; 'self' = heal. */
    targetType: CardTarget;
    /** Status effects the card applies on cast. */
    combatEffects: readonly CardCombatEffects[];
}

/** The keyword for an effect id (e.g. 'debuff_bleed' → 'BLEED'), or a humanised id. */
function effectName(effectId: string): string {
    return keywordForEffect(effectId)?.toUpperCase() ?? effectId.replace(/[-_]/g, ' ').toUpperCase();
}

/**
 * Compact effect line for the picker row, e.g.
 * `"12 DMG · BLEED 2 (3R)"` or `"9 HEAL · CLARITY (2R)"`.
 * `damage` comes from the engine's `calculateCardDamage` with the
 * live player's stats (no target resistance — it's an estimate).
 */
export function cardEffectText(card: CombatCardOption, damage: number): string {
    const parts: string[] = [];
    if (damage > 0) parts.push(`${damage} ${card.targetType === 'self' ? 'HEAL' : 'DMG'}`);
    for (const fx of card.combatEffects) {
        let label = effectName(fx.effectId);
        if (fx.intensity !== undefined) label += ` ${fx.intensity}`;
        if (fx.duration !== undefined) label += ` (${fx.duration}R)`;
        parts.push(label);
    }
    return parts.length > 0 ? parts.join(' · ') : 'NO DIRECT EFFECT';
}

function toCombatCardOption(card: Card): CombatCardOption {
    return {
        id: card.id,
        name: card.name.toUpperCase(),
        description: card.description,
        stance: card.color,
        targetType: card.targetType,
        combatEffects: card.combatEffects ?? [],
    };
}

/** Full engine card library, projected into the combat picker shape. */
export const COMBAT_CARDS: readonly CombatCardOption[] = Object.freeze(
    cardLibrary.map(toCombatCardOption),
);

/**
 * Resolve a card id to its mobile presentation row. Returns `null`
 * when the id is not in the engine library (e.g. an id from an old
 * save). Callers treat `null` as a missing card.
 */
export function getCombatCardById(id: string): CombatCardOption | null {
    const card = getCardById(id);
    return card ? toCombatCardOption(card) : null;
}
