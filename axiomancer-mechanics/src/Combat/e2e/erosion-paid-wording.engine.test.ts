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

const EXPECTED_PAID_LINES: Readonly<Record<string, string>> = {
    'spoiled-poultice':
        'PAID — Inflict POISON 1 (ticks each card you play, 2 turns). Costs 1 die.',
    'chilblain-watch':
        'PAID — GUARD 6. Gain THORNS 1 for 2 turns. Costs 1 die.',
    'petty-indictment':
        'PAID — Apply MARK 1 for 2 turns. Gain 1 CHARGE. Costs 1 die.',
    'first-spadeful':
        'PAID — MILL 2. FORETELL 1. Costs 1 die.',
    'grandmothers-psalter':
        'PAID — DRAW 2. CLEANSE 1. Costs 1 die.',
    'thumbprick-oath':
        'PAID — RECOIL 1. DRAW 1 and gain 1 Conviction. Costs 1 die.',
    'thin-hymn':
        'PAID — PLEA 3. Costs 1 die.',
    'threadbare-cope':
        'PAID — GUARD 4. DRAW 1. Costs 1 die.',
    'knucklebone-recant':
        'PAID — Reroll every spent die in your tray. Gain 1 Conviction. Costs 1 die.',
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
