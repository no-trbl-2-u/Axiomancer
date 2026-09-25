/**
 * Phase 88 — Advantage-category effects coverage sweep.
 *
 * Drains the Phase 79 LOW "Advantage-category effects (13 of 14 uncovered)"
 * CRITIQUE row. For each effect, asserts it applies cleanly and that
 * `getActiveEffectModifiers` reflects the expected advantageGrants/Denies +
 * any defenseModifier.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { applyEffect } from '../../Effects';
import { lookupEffect } from '../../Effects/effects.library';
import { getActiveEffectModifiers } from '../../Combat/effect-modifiers';
import type { ActiveEffect } from '../../Effects/types';

afterEach(() => vi.restoreAllMocks());

const ae = (effectId: string, intensity = 1): ActiveEffect => ({
    effectId,
    intensity,
    remainingDuration: 3,
    appliedAt: 1,
    tier: 2,
});

// ─── Buff effects with advantageModifier ──────────────────────────────────────

describe('Phase 88 — Advantage buffs: advantageGrants via getActiveEffectModifiers', () => {
    // The precision/crit buffs were re-themed onto `advantageModifier`
    // (2026-07-14): under "THE STRIKE IS DEAD" the player has no roll/crit/stat
    // surface, so a flat rollModifier or stat multiplier was inert. They grant
    // advantage on a stance. NOTE (D7 flag collapse, 2026-09-25): the hidden-
    // stance read that consumed `advantageGrants` was deleted with the draft,
    // so this pins the aggregator only — combat no longer reads the grant.
    it.each(['buff_accuracy_up', 'buff_critical_rate_up', 'buff_critical_damage_up'])(
        '%s grants advantage on all stances (re-themed from inert roll/stat payloads)',
        (effectId) => {
            const effect = lookupEffect(effectId);
            expect(effect).toBeDefined();
            const { activeEffects } = applyEffect([], effect!, 1);
            const mods = getActiveEffectModifiers(activeEffects);
            expect(mods.advantageGrants).toEqual(new Set(['body', 'mind', 'heart']));
            // The dead surface is gone — no lingering inert roll payload.
            expect(effect!.payload.rollModifier ?? 0).toBe(0);
        },
    );

    it('buff_damage_reduction has defenseModifier 5', () => {
        const mods = getActiveEffectModifiers([ae('buff_damage_reduction')]);
        expect(mods.defenseDelta).toBe(5);
    });

    it('buff_invincibility has defenseModifier 99', () => {
        const mods = getActiveEffectModifiers([ae('buff_invincibility')]);
        expect(mods.defenseDelta).toBe(99);
    });
});

// ─── Debuff effects in the advantage category ─────────────────────────────────

// The pre-v3 advantage-debuff band (debuff_evasion_down / debuff_accuracy_down
// / debuff_defense_down) was retired outright by the spec 32 v3 keyword reset
// — no support consumer resolves those ids, so their coverage retires with
// them (the ban list in deprecated-effects.engine.test.ts keeps them dead).

// ─── Application sanity ───────────────────────────────────────────────────────

describe('Phase 88 — Advantage effects: all apply without error', () => {
    // Retired ids (buff_advantage_*, buff_evasion_up, buff_taunt,
    // buff_stealth, buff_counter, buff_life_steal, debuff_evasion_down,
    // debuff_accuracy_down, debuff_defense_down) left with the v3 reset;
    // the survivors below are support-tagged non-card effects.
    const allIds = [
        'buff_accuracy_up', 'buff_damage_reduction', 'buff_invincibility',
    ];

    it.each(allIds)('%s applies cleanly via applyEffect', (effectId) => {
        const effect = lookupEffect(effectId);
        expect(effect, `${effectId} must exist in the effects library`).toBeDefined();
        const { activeEffects, result } = applyEffect([], effect!, 1);
        expect(result.success).toBe(true);
        expect(activeEffects).toHaveLength(1);
    });
});
