/**
 * Wording guard — the complete live Erosion paid-line surface.
 *
 * The normal preset contributes seven unique cards. Upgradeable Dice swaps in
 * Recurring Symptom, so its paid line belongs to the same player-facing audit.
 * This test pins the production projection, not merely the authored fragments.
 */

import { describe, expect, it } from 'vitest';

import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';
import { getDeckPreset, PRESET_DICE_VALVES } from '../combat.starter-deck-presets';

const EXPECTED_PAID_LINES: Readonly<Record<string, string>> = {
    'poisoned-well':
        'PAID — Inflict POISON 2 (ticks each card you play; 2 turns). Costs 1 die.',
    'opening-statement':
        'PAID — Apply MARK 1. Inflict POISON 1 (ticks each card you play; 2 turns). Gain 2 PREMISES. Costs 1 die.',
    'festering-argument':
        'PAID — PROLONG every DoT on the enemy by 1 turn. Costs 1 die.',
    'currys-conversion':
        'PAID — REARGUE — Convert all enemy BLEED to POISON and all POISON to BLEED, then add 1 intensity to each. Costs 1 die.',
    'resonance-detonation':
        'PAID — RUPTURE ALL for 50% more damage. SIPHON 35% of the RUPTURE damage. RECALL 2 cards; fire their FREE lines now. Costs 1 die.',
    'venom-and-vein':
        'PAID (rest of combat) — When a PAID line includes BLEED or POISON, every enemy status on that line gains +1 intensity and +1 duration. Costs 1 die.',
    'suppurating-curse':
        "PAID (rest of combat) — At the end of each round, deal the enemy's POISON and BLEED damage from that round again. Costs 1 die. Attaches to the enemy.",
    'recurring-symptom':
        'PAID — Inflict POISON 1 (ticks each card you play; 2 turns). Reroll all spent, exhausted, or X dice in your tray except floating dice. Costs 1 die.',
};

describe('Erosion paid-effect wording', () => {
    it('covers every unique preset card plus the live Erosion dice valve', () => {
        const preset = getDeckPreset('erosion');
        expect(preset).toBeDefined();

        const scope = new Set(preset?.cardIds ?? []);
        scope.add(PRESET_DICE_VALVES.erosion.valveId);

        expect([...scope].sort()).toEqual(Object.keys(EXPECTED_PAID_LINES).sort());
    });

    it('projects the approved paid lines through the production card face', () => {
        const projected = Object.fromEntries(
            Object.keys(EXPECTED_PAID_LINES).map((id) => [
                id,
                toCombatCard(id, getCardById, lookupEffect)?.bottomActionText,
            ]),
        );

        expect(projected).toEqual(EXPECTED_PAID_LINES);
    });
});
