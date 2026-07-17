/**
 * Dump for the paid-summary authoring passes (2026-07-16): for the given
 * presets' cards, emit each card's full payload + the engine-generated face
 * text, so summary authors work from ground truth.
 *
 * Run: npx ts-node --transpile-only scripts/dump-paid-context.ts [presetId ...]
 * (no args = all presets, in display order)
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCardById } from '../src/Cards/cards.library';
import { lookupEffect } from '../src/Effects';
import { toCombatCard, paidText } from '../src/Combat/combat.cards';
import { COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER } from '../src/Combat/combat.deck-presets';

const PRESETS = process.argv.length > 2 ? process.argv.slice(2) : [...COMBAT_DECK_PRESET_ORDER];

const out: Record<string, unknown[]> = {};
for (const pid of PRESETS) {
    const preset = COMBAT_DECK_PRESETS[pid]!;
    const ids = [...new Set(preset.cardIds)];
    out[pid] = ids.map((id) => {
        const card = getCardById(id)!;
        const cc = toCombatCard(id, getCardById, lookupEffect)!;
        const effects = (card.combatEffects ?? []).map((ce) => {
            const def = lookupEffect(ce.effectId)!;
            return {
                ...ce,
                effectName: def.name,
                libraryDuration: def.duration,
                dot: def.payload.damageOverTime ?? null,
            };
        });
        return {
            id, name: card.name, theme: card.theme, cardType: card.cardType,
            aspect: card.philosophicalAspect, rank: card.rank, tier: card.tier,
            targetType: card.targetType,
            persistentEffect: card.persistentEffect ?? null,
            paidSummary: card.paidSummary ?? null,
            free: card.free ?? null,
            combatEffects: effects,
            specialMechanics: card.specialMechanics ?? null,
            threshold: card.threshold ?? null,
            dieBonus: card.dieBonus ?? null,
            fate: card.fate ?? null,
            fallen: card.fallen ?? null,
            synergy: card.synergy ?? null,
            generatedPaid: card.cardType === 'spell' ? paidText(card, lookupEffect) : null,
            topActionText: cc.topActionText,
            bottomActionText: cc.bottomActionText,
            dieLines: cc.dieLines ?? null,
        };
    });
}

const dest = join(__dirname, '..', '..', 'tmp-paid-context.json');
writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`wrote ${dest}`);
