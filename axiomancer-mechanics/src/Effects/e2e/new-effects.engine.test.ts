/**
 * New status-effect content sweep (authored "since April").
 *
 * Hermetic coverage for the ~20 effects appended to buffs.library.json and
 * debuffs.library.json. Asserts that:
 *   - every new id resolves via the effects library lookup,
 *   - each has a valid tier (1-3) and a non-empty payload,
 *   - tier 2/3 entries declare `resistedBy` (+ a `resistDR`),
 *   - each carries provenance (`addedIn` ISO date + non-empty `tags`),
 *   - each applies cleanly via the engine.
 */

import { describe, it, expect } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../../Effects/effects.library';
import type { Effect, EffectPayload } from '../../Effects/types';

const NEW_BUFF_IDS = [
    'buff_quine_resolve',
    'buff_apollonian_clarity',
    'buff_promethean_ember',
    'buff_aegis_recursion',
    'buff_dionysian_surge',
    'buff_brazen_thorns',
    'buff_oracle_foresight',
    'buff_stoic_bulwark',
    'buff_minor_fortitude',
    'buff_phoenix_vigor',
];

const NEW_DEBUFF_IDS = [
    'debuff_tartarus_rot',
    'debuff_lethe_fog',
    'debuff_gorgon_gaze',
    'debuff_sisyphean_weight',
    'debuff_harpy_torment',
    'debuff_icarus_descent',
    'debuff_basilisk_venom',
    'debuff_minotaur_maze',
    'debuff_hubris_brand',
    'debuff_minor_unsteadiness',
];

const ALL_NEW_IDS = [...NEW_BUFF_IDS, ...NEW_DEBUFF_IDS];

const payloadIsNonEmpty = (payload: EffectPayload): boolean =>
    Object.keys(payload).length > 0;

describe('New effects — library lookup + schema', () => {
    it('every new id resolves via lookupEffect', () => {
        for (const id of ALL_NEW_IDS) {
            expect(lookupEffect(id), `${id} must exist in the effects library`).toBeDefined();
        }
    });

    it.each(NEW_BUFF_IDS)('%s is typed as a buff', (id) => {
        expect(lookupEffect(id)!.type).toBe('buff');
    });

    it.each(NEW_DEBUFF_IDS)('%s is typed as a debuff', (id) => {
        expect(lookupEffect(id)!.type).toBe('debuff');
    });

    it.each(ALL_NEW_IDS)('%s has a valid tier (1-3) and non-empty payload', (id) => {
        const effect = lookupEffect(id) as Effect;
        expect([1, 2, 3]).toContain(effect.tier);
        expect(payloadIsNonEmpty(effect.payload)).toBe(true);
    });

    it.each(ALL_NEW_IDS)('%s tier 2/3 declares resistedBy + resistDR', (id) => {
        const effect = lookupEffect(id) as Effect;
        if (effect.tier >= 2) {
            expect(effect.resistedBy, `${id} (tier ${effect.tier}) must declare resistedBy`).toBeDefined();
            expect(['body', 'mind', 'heart']).toContain(effect.resistedBy);
            expect(typeof effect.resistDR).toBe('number');
        }
    });
});

describe('New effects — provenance metadata', () => {
    const VALID_DATES = ['2026-04-15', '2026-05-20', '2026-06-07'];

    it.each(ALL_NEW_IDS)('%s carries an addedIn ISO date used by tuning focus', (id) => {
        const effect = lookupEffect(id) as Effect;
        expect(effect.addedIn).toBeDefined();
        expect(VALID_DATES).toContain(effect.addedIn);
    });

    it.each(ALL_NEW_IDS)('%s carries non-empty tags', (id) => {
        const effect = lookupEffect(id) as Effect;
        expect(Array.isArray(effect.tags)).toBe(true);
        expect(effect.tags!.length).toBeGreaterThan(0);
        expect(effect.tags).toContain('since-april');
    });

    it('uses more than one addedIn date so date-range focus can filter', () => {
        const dates = new Set(ALL_NEW_IDS.map((id) => lookupEffect(id)!.addedIn));
        expect(dates.size).toBeGreaterThan(1);
    });
});

describe('New effects — apply cleanly via the engine', () => {
    it.each(ALL_NEW_IDS)('%s applies without error', (id) => {
        const effect = lookupEffect(id)!;
        const { activeEffects, result } = applyEffect([], effect, 1);
        expect(result.success).toBe(true);
        expect(activeEffects).toHaveLength(1);
    });
});
