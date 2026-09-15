/**
 * Phase 88 — Stat-band effects coverage sweep.
 *
 * Drains the Phase 79 LOW "Stat-band buffs uncovered" CRITIQUE row by
 * asserting every uncovered stat-band buff's `statModifiers` aggregate
 * correctly through `getEffectiveStats`.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../../Effects/effects.library';
import { getEffectiveStats } from '../../Combat/effect-modifiers';
import { createCharacter } from '../../Character';
import type { Combatant } from '../../Combat/types';
import type { ActiveEffect } from '../../Effects/types';

afterEach(() => vi.restoreAllMocks());

/**
 * Builds a Character with base stats { body: 5, mind: 5, heart: 5 } and
 * the given effects already applied. The Character type satisfies
 * `isCharacter`, so `nonCombatStats` will be derived (needed for save-stat
 * assertions on resistance buffs).
 */
function combatantWithEffects(effects: ActiveEffect[]): Combatant {
    return {
        ...createCharacter({
            name: 'stat-band-tester',
            level: 1,
            baseStats: { body: 5, mind: 5, heart: 5 },
        }),
        effects,
    };
}

// ─── Parameterized stat-band buffs with statModifiers ─────────────────────────

/**
 * Each entry declares: effect ID, expected flat stat deltas at intensity 1,
 * and optionally expected defenseModifier. Multipliers are excluded since
 * they're tested in Phase 48 already — these are all flat-only bands.
 *
 * The math: base stats are all 5.
 *   - ATTACK multiplier = 1, so physicalAttack = body × 1 = 5.
 *   - DEFENSE multiplier = 3, so physicalDefense = body × 3 = 15.
 *   - SAVE multiplier = 2, so physicalSave = body × 2 = 10.
 *   - luck = average(body, mind, heart) = 5.
 *
 * When a base stat (body/mind/heart) is bumped by N, the effective base stat
 * is 5 + N and ALL derived stats for that stance re-derive.
 */
// The attack/defense stat-band buffs (buff_mind_attack_up,
// buff_heart_attack_up, buff_body/mind/heart_defense_up) were retired
// outright by the spec 32 v3 keyword reset — no support consumer resolves
// them, so their cases retire with them. The survivors below are
// support-tagged non-card effects (items / Cards system).
const statBandCases = [
    {
        effectId: 'buff_all_stats_up',
        label: 'buff_all_stats_up: body/mind/heart +2, luck +1',
        assertions: (eff: ReturnType<typeof getEffectiveStats>) => {
            expect(eff.baseStats.body).toBe(7);
            expect(eff.baseStats.mind).toBe(7);
            expect(eff.baseStats.heart).toBe(7);
            // luck re-derives as average(7,7,7) = 7 then flat +1 = 8
            expect(eff.derivedStats.luck).toBe(8);
        },
    },
];

describe('Phase 88 — Stat-band buffs: stat deltas via getEffectiveStats', () => {
    describe.each(statBandCases)('$label', ({ effectId, assertions }) => {
        it('applies cleanly and produces expected stat deltas at intensity 1', () => {
            const effect = lookupEffect(effectId);
            expect(effect, `${effectId} must exist in the effects library`).toBeDefined();

            const { activeEffects } = applyEffect([], effect!, 1);
            expect(activeEffects).toHaveLength(1);

            const combatant = combatantWithEffects(activeEffects);
            const eff = getEffectiveStats(combatant);
            assertions(eff);
        });
    });
});

// ─── No-stat-change effects (apply without error, don't alter stats) ──────────

const noStatCases = [
    { effectId: 'buff_cleanse', label: 'buff_cleanse (empty payload)' },
    { effectId: 'buff_cleanse_minor', label: 'buff_cleanse_minor (empty payload)' },
    { effectId: 'buff_status_chance_up', label: 'buff_status_chance_up (rollModifier only)' },
];

describe('Phase 88 — Stat-band buffs with no statModifiers', () => {
    it.each(noStatCases)('$label applies without error and does not change base stats', ({ effectId }) => {
        const effect = lookupEffect(effectId);
        expect(effect, `${effectId} must exist in the effects library`).toBeDefined();

        const { activeEffects, result } = applyEffect([], effect!, 1);
        expect(result.success).toBe(true);

        const combatant = combatantWithEffects(activeEffects);
        const eff = getEffectiveStats(combatant);
        expect(eff.baseStats).toEqual({ body: 5, mind: 5, heart: 5 });
    });
});
