/**
 * Wording guard — the complete live starter paid-line surface.
 *
 * Profane Canon re-pin (2026-08-08): the ten theme presets (erosion et al.)
 * are retired; the campaign now opens on the THREADBARE preset (the
 * Threadbare Office, 18 cards / 8 uniques). Its paid lines are the first
 * player-facing wording surface of every run, so they carry the audit the
 * Erosion preset used to. Upgradeable Dice swaps in the threadbare valve
 * (Knucklebone Recant), so its paid line belongs to the same audit.
 * This test pins the production projection, not merely the authored fragments.
 */

import { describe, expect, it } from 'vitest';

import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';
import { getDeckPreset, PRESET_DICE_VALVES } from '../combat.starter-deck-presets';

// Re-derived 2026-09-02 (THE BIG NUMBERS REWRITE): every starter card was
// rewritten, so every line below moved. The intent of the pin is unchanged —
// the production projection is the wording the player reads, and it must not
// drift silently.
const EXPECTED_PAID_LINES: Readonly<Record<string, string>> = {
    'spoiled-poultice':
        'PAID — Deal 7. Inflict POISON 4 for 3 turns. Costs 1 die.',
    'chilblain-watch':
        'PAID — GUARD 12. THORNS 4. Costs 1 die.',
    'petty-indictment':
        'PAID — Deal 6. Gain 3 Charges. STAGGER 1. Costs 1 die.',
    'first-spadeful':
        'PAID — Deal 6. RECALL 1. Costs 1 die.',
    'grandmothers-psalter':
        'PAID — Heal 8. Draw 2. CLEANSE 1. Costs 1 die.',
    'thumbprick-oath':
        'PAID — Deal 14. RECOIL 5. Costs 1 die.',
    'thin-hymn':
        'PAID — PLEA 8. Heal 5. Costs 1 die.',
    'threadbare-cope':
        'PAID — GUARD 8 (persists). FORETELL 2. Costs 1 die.',
    'knucklebone-recant':
        'PAID — Reroll every spent die in your tray. Gain 2 Conviction. Deal 6. Costs 1 die.',
};

describe('Threadbare paid-effect wording', () => {
    it('covers every unique preset card plus the live threadbare dice valve', () => {
        const preset = getDeckPreset('threadbare');
        expect(preset).toBeDefined();

        const scope = new Set(preset?.cardIds ?? []);
        scope.add(PRESET_DICE_VALVES.threadbare.valveId);

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
