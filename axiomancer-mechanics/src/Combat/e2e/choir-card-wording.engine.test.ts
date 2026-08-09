/**
 * Card-face wording lint for THE PALE CHOIR (profane canon, 2026-08-08).
 *
 * Successor to the retired `grace-card-wording` suite: the ten theme presets
 * became three campaign snapshots, so the wording pin now rides an ARCHETYPE
 * (choir — the canon's most verb-dense family: PLEA, SOUL, REAP, QUARTER,
 * CLEANSE, SIPHON, and both persistent zones) plus a projection smoke over
 * every card the three campaign presets actually seat.
 *
 * What it proves: a projected face prints REAL units for every payload it
 * carries — no silent verb, no un-numbered promise.
 */
import { describe, expect, it } from 'vitest';
import { cardLibrary, getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { toCombatCard } from '../combat.cards';
import { buildPresetDeck, COMBAT_DECK_PRESET_ORDER } from '../combat.starter-deck-presets';

/** Every unique card the three campaign snapshots seat, derived from the
 *  presets themselves rather than a hand-copied list. `buildPresetDeck` is
 *  flag-aware: under Upgradeable Dice (forced ON since THE FLIP) each stage
 *  carries its reliquary valve, so those projections are covered here too. */
const PRESET_CARD_IDS = [...new Set(
    COMBAT_DECK_PRESET_ORDER.flatMap(id => buildPresetDeck(id)),
)];

const CHOIR_CARD_IDS = cardLibrary.filter(c => c.theme === 'choir').map(c => c.id);

function face(cardId: string): string {
    const card = toCombatCard(cardId, getCardById, lookupEffect);
    expect(card, `${cardId} must project`).not.toBeNull();
    return `${card!.topActionText}\n${card!.bottomActionText}`;
}

describe('projection smoke — the seated canon', () => {
    it('projects every unique card the three campaign presets seat', () => {
        expect(PRESET_CARD_IDS.length).toBeGreaterThan(0);
        for (const cardId of PRESET_CARD_IDS) {
            expect(toCombatCard(cardId, getCardById, lookupEffect), cardId).not.toBeNull();
        }
    });

    it('projects every Pale Choir card (the 7-card package plus the choir-slugged starter, psalter and valve)', () => {
        expect(CHOIR_CARD_IDS).toHaveLength(10);
        for (const cardId of CHOIR_CARD_IDS) {
            expect(toCombatCard(cardId, getCardById, lookupEffect), cardId).not.toBeNull();
        }
    });
});

describe('Pale Choir card wording', () => {
    it('Thin Hymn states both PLEA gains and nothing else', () => {
        const text = face('thin-hymn');
        expect(text).toContain('FREE — PLEA 1.');
        expect(text).toContain('PAID — PLEA 3.');
    });

    it('Alms of Breath states its QUARTER duration, PLEA, and CLEANSE', () => {
        const text = face('alms-of-breath');
        expect(text).toContain('Apply QUARTER 1 for 2 turns');
        expect(text).toContain('PLEA 2');
        expect(text).toContain('CLEANSE 1');
        expect(text).toContain('+1 Soul');
    });

    it('Passing Bell prints DOOM with its growth clause and no calendar', () => {
        const text = face('passing-bell');
        expect(text).toContain('Inflict DOOM 2 (grows +1 each time the foe acts)');
        expect(text).not.toContain('DOOM 2 for');
        expect(text).toContain('Gain 1 SOUL');
    });

    it('Last Rites, Sung Early states the RUPTURE, the Souls, and the die bonus', () => {
        const text = face('last-rites-sung-early');
        expect(text).toContain('RUPTURE 1 affliction — its remaining damage lands now');
        expect(text).toContain('Gain 2 SOULS');
        expect(text).toContain('BODY/WILD die: +1 Soul');
    });

    it('The Offertory Plate states its REAP price, every payoff, and the threshold', () => {
        const text = face('the-offertory-plate');
        expect(text).toContain('REAP 3');
        expect(text).toContain('PLEA 5');
        expect(text).toContain('apply QUARTER 2 for 2 turns');
        expect(text).toContain('KINDLE a heart die');
        expect(text).toContain('HEART ×3 spent: +2 Souls');
    });

    it('Miserere states the per-Soul burst, the SIPHON, and the fate line with its price', () => {
        const text = face('miserere');
        expect(text).toContain('REAP ALL — 3 damage per Soul spent');
        expect(text).toContain('SIPHON 50% of the harvest');
        expect(text).toContain('an X die may power this');
        expect(text).toContain('recoil 2 HP');
    });

    it('Choirbone Reliquary states its trigger and both payoffs on both durations', () => {
        const text = face('choirbone-reliquary');
        expect(text).toContain('FREE (3 rounds)');
        expect(text).toContain('PAID (rest of combat)');
        expect(text).toContain('Whenever an affliction on the enemy expires or is consumed');
        expect(text).toContain('gain 1 SOUL and PLEA 1');
    });

    it('The Long Amen names its clock, its scaling, and that it rides the enemy', () => {
        const text = face('the-long-amen');
        expect(text).toContain('At the end of each round');
        expect(text).toContain('the enemy gains PLEA equal to the number of Souls you hold');
        expect(text).toContain('Attaches to the enemy');
    });
});

describe('the vigil wall — GUARD honesty on the reflect cards', () => {
    it('Nothing Crossed the Ice separates the persistent FREE brick from the PAID wall', () => {
        const text = face('nothing-crossed-the-ice');
        expect(text).toContain('GUARD 3 (persists)');
        expect(text).toContain('GUARD 6 (persists)');
        expect(text).toContain('FORETELL 2');
        expect(text).toContain('UNMOVED (the enemy dealt you no damage last round)');
    });

    it('The Reprisal Bell states persistent GUARD and the complete RIPOSTE', () => {
        const text = face('the-reprisal-bell');
        expect(text).toContain('GUARD 4 (persists)');
        expect(text).toContain('GUARD 8');
        expect(text).toContain('arm RIPOSTE 4 (parry 2) for one threat phase');
        expect(text).toContain('the enemy drew blood since your last turn');
    });
});
