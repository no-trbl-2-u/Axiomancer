/**
 * Hermetic E2E — the CURATED card library (Fate Engine P1 trim, spec 31 §4).
 *
 * The 2026-07-05 trim cut the library from 88 cards to the locked-in keepers
 * (owner call: fewer, genuinely distinct cards first — extend from there).
 * This suite is the shape contract: coverage across stance × tier × verb,
 * every mechanic engine-real, the dice layer reachable from cards, and the
 * synergy engine still exercised by a keeper.
 */

import { describe, it, expect } from 'vitest';

import { cardLibrary, getCardById } from '../cards.library';
import { getCard } from '../../Combat/combat.engine';
import { COMBAT_REWARD_POOL, STARTING_SKILL_IDS } from '../../Combat/combat.rewards';
import { COMBAT_DECK_PRESETS, buildPresetDeck } from '../../Combat/combat.deck-presets';
import { GOLD_CARD_IDS } from '../../Combat/combat.cards';

describe('curated library — shape contract', () => {
    it('is the locked-in keeper set (49 cards)', () => {
        expect(cardLibrary.length).toBe(49);
        const ids = cardLibrary.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length); // no duplicate ids
    });

    it('covers every stance at every tier', () => {
        for (const tier of [1, 2, 3] as const) {
            for (const aspect of ['body', 'mind', 'heart'] as const) {
                const n = cardLibrary.filter(c => c.tier === tier && c.philosophicalAspect === aspect).length;
                expect(n, `tier ${tier} ${aspect} must have cards`).toBeGreaterThan(0);
            }
        }
    });

    it('keeps the gold trio, the starters, and the mercy line', () => {
        for (const id of GOLD_CARD_IDS) expect(getCardById(id), id).toBeDefined();
        for (const id of STARTING_SKILL_IDS) expect(getCardById(id), id).toBeDefined();
        expect(getCardById('befriend')).toBeDefined();
        expect(getCardById('peaceful-gesture')).toBeDefined();
    });

    it('every reward-pool and preset id resolves to a keeper', () => {
        for (const id of COMBAT_REWARD_POOL) {
            expect(getCardById(id), `reward pool: ${id}`).toBeDefined();
        }
        for (const preset of Object.values(COMBAT_DECK_PRESETS)) {
            for (const id of preset.cardIds) {
                expect(getCardById(id), `${preset.id}: ${id}`).toBeDefined();
            }
            expect(buildPresetDeck(preset.id).length).toBeGreaterThan(preset.cardIds.length - 1);
        }
    });
});

describe('curated library — the dice layer is reachable from cards (spec 31 §1)', () => {
    it('carries thresholds, dieBonus lines, fate cards, and die-manipulation verbs', () => {
        const thresholds = cardLibrary.filter(c => c.threshold).length;
        const dieBonuses = cardLibrary.filter(c => c.dieBonus).length;
        const fates = cardLibrary.filter(c => c.fate).length;
        const manip = cardLibrary.filter(c => (c.specialMechanics ?? []).some(m =>
            ['convert_die_color', 'bank_spent_die', 'create_temporary_die', 'grant_pip', 'refresh_die', 'reroll_spent'].includes(m.kind))).length;
        const react = cardLibrary.filter(c => (c.specialMechanics ?? []).some(m => m.kind === 'react')).length;
        expect(thresholds).toBeGreaterThanOrEqual(6);
        expect(dieBonuses).toBeGreaterThanOrEqual(6);
        expect(fates).toBeGreaterThanOrEqual(4);
        expect(manip).toBeGreaterThanOrEqual(5);
        expect(react).toBeGreaterThanOrEqual(1);
    });

    it('every die-interaction line prints on the projected card in real units', () => {
        for (const skill of cardLibrary) {
            const card = getCard(skill.id)!;
            const lines = skill.threshold || skill.dieBonus || skill.fate
                || (skill.specialMechanics ?? []).some(m =>
                    ['convert_die_color', 'bank_spent_die', 'create_temporary_die', 'grant_pip', 'refresh_die', 'reroll_spent', 'react'].includes(m.kind));
            if (lines) {
                expect(card.dieLines?.length ?? 0, `${skill.id} must print its die lines`).toBeGreaterThan(0);
            }
            if (skill.threshold) {
                expect(card.bottomActionText).toContain(`×${skill.threshold.count}`);
            }
        }
    });

    it('rider fields carry only real units the engine applies', () => {
        for (const skill of cardLibrary) {
            const riders = [skill.threshold?.rider, skill.dieBonus?.rider, skill.fate?.rider].filter(Boolean);
            for (const r of riders) {
                const total = Object.values(r!).reduce<number>((n, v) => n + (typeof v === 'number' ? v : v === true ? 1 : 0), 0);
                expect(total, `${skill.id} rider must not be empty`).toBeGreaterThan(0);
            }
        }
    });
});

describe('curated library — the synergy engine stays exercised', () => {
    it('at least one keeper carries a target-side synergy predicate', () => {
        const withSynergy = cardLibrary.filter(c => c.synergy?.predicate?.on === 'target');
        expect(withSynergy.length).toBeGreaterThanOrEqual(1);
        for (const c of withSynergy) {
            expect(c.synergy!.predicate!.effectId.startsWith('debuff_') || c.synergy!.predicate!.effectId.startsWith('buff_')).toBe(true);
        }
    });
});
