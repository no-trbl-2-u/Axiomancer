/**
 * Hermetic e2e — Phase 66 Tier 2 synergy skills.
 *
 * Drives each of the 5 authored synergy skills through `executeSkill`
 * with a seeded `CombatState` and asserts the synergy predicate /
 * damage / consumption / type-swap / detonation behaviour per the
 * brief's D2-D9 design locks.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { executeSkill } from '../skill.engine';
import { cardLibrary, getCardById } from '../cards.library';
import { lookupEffect } from '../../Effects';
import { CombatState } from '../../Combat/types';
import { ActiveEffect } from '../../Effects/types';
import { setSeed } from '../../Utils/rng';
import type { CombatResources } from '../types';

beforeEach(() => setSeed('synergy-skills-engine-test'));
afterEach(() => vi.restoreAllMocks());

const synergySkillIds = [
    'resonance-bleed',
    'intensity-feedback',
    'bat-swarm-thoughtform',
    'resonance-burst',
    'resonance-detonation',
] as const;

const fixturePlayer = () => createCharacter({
    name: 'P',
    level: 5,
    baseStats: { heart: 6, body: 6, mind: 6 },
    knownSkills: [...synergySkillIds],
});

const fixtureEnemy = () => createEnemy({
    id: 'e1', name: 'Test', description: 'd', level: 5,
    baseStats: { heart: 4, body: 4, mind: 4 },
    mapName: 'fishing-village', logic: 'random',
});

const fixtureState = (resources: Partial<CombatResources> = {}): CombatState => {
    const state = initializeCombat(fixturePlayer(), fixtureEnemy());
    return {
        ...state,
        combatResources: {
            heart: 5, body: 5, mind: 5, fallacy: 0, paradox: 0,
            ...resources,
        },
    };
};

function seedEffect(opts: {
    effectId: string;
    intensity?: number;
    remainingDuration?: number;
}): ActiveEffect {
    const effect = lookupEffect(opts.effectId);
    if (!effect) throw new Error(`No such effect: ${opts.effectId}`);
    return {
        effectId: opts.effectId,
        intensity: opts.intensity ?? 1,
        remainingDuration: opts.remainingDuration ?? 3,
        appliedAt: 0,
        tier: effect.tier,
    };
}

describe('Phase 66 — Tier 2 synergy skills (5 patterns)', () => {
    it('library registers all 5 synergy skills', () => {
        for (const id of synergySkillIds) {
            const skill = getCardById(id);
            expect(skill, `${id} should resolve from cardLibrary`).toBeDefined();
            expect(skill!.tier).toBe(2);
            expect(skill!.synergy, `${id} should carry a synergy clause`).toBeDefined();
        }
        // Content expansion may add further tier-2 synergy skills; the named
        // Phase 66 set must all be present (asserted above).
        expect(cardLibrary.filter(s => s.synergy && s.tier === 2).length).toBeGreaterThanOrEqual(5);
    });

    // ─── 1. resonance-bleed: cross-stance duration amp ────────────────────────
    describe('resonance-bleed (predicate: debuff_bleed on target, durationMin: 2)', () => {
        it('synergy fires when target carries debuff_bleed ≥2 duration — adds bonusDamage + duration*3', () => {
            const state = fixtureState();
            const target = state.enemy;
            const enemyWithBleed = { ...target, effects: [seedEffect({ effectId: 'debuff_bleed', intensity: 2, remainingDuration: 4 })] };
            const seeded = { ...state, enemy: enemyWithBleed };
            const result = executeSkill(seeded, 'resonance-bleed', getCardById);
            const synergyEvent = result.events.find(e => e.kind === 'synergy-fired');
            expect(synergyEvent).toBeDefined();
            // bonusDamage 5 + durationDamageMul 3 × 4 = 17.
            expect(synergyEvent && 'bonusDamage' in synergyEvent ? synergyEvent.bonusDamage : -1).toBe(17);
            // Target takes both base + synergy damage (HP drops more than basePower alone).
            expect(result.state.enemy.health).toBeLessThan(target.health - 4);
        });

        it('synergy does NOT fire when predicate misses (no debuff_bleed on target)', () => {
            const state = fixtureState();
            const result = executeSkill(state, 'resonance-bleed', getCardById);
            expect(result.events.find(e => e.kind === 'synergy-fired')).toBeUndefined();
            // Only basePower damage applies — modest enemy HP drop.
            expect(result.state.enemy.health).toBeLessThan(state.enemy.health);
        });
    });

    // ─── 2. intensity-feedback: cross-stance intensity amp ───────────────────
    describe('intensity-feedback (predicate: buff_critical_rate_up on caster, intensityMin: 1)', () => {
        it('synergy fires when caster has buff_critical_rate_up — adds bonusDamage + intensity*5', () => {
            const state = fixtureState();
            const caster = state.player;
            const playerWithBuff = { ...caster, effects: [seedEffect({ effectId: 'buff_critical_rate_up', intensity: 3, remainingDuration: 5 })] };
            const seeded = { ...state, player: playerWithBuff };
            const result = executeSkill(seeded, 'intensity-feedback', getCardById);
            const synergyEvent = result.events.find(e => e.kind === 'synergy-fired');
            expect(synergyEvent).toBeDefined();
            // bonusDamage 4 + intensityDamageMul 5 × 3 = 19.
            expect(synergyEvent && 'bonusDamage' in synergyEvent ? synergyEvent.bonusDamage : -1).toBe(19);
        });

        it('synergy does NOT fire when caster has no buff', () => {
            const state = fixtureState();
            const result = executeSkill(state, 'intensity-feedback', getCardById);
            expect(result.events.find(e => e.kind === 'synergy-fired')).toBeUndefined();
        });
    });

    // ─── 3. bat-swarm-thoughtform: buff type-swap ────────────────────────────
    describe('bat-swarm-thoughtform (predicate: tier1_body_defend on caster, durationMin: 5)', () => {
        it('synergy fires when caster has tier1_body_defend ≥5 — consumes it + applies buff_max_hp_up', () => {
            const state = fixtureState();
            const caster = state.player;
            const playerWithThorns = { ...caster, effects: [seedEffect({ effectId: 'tier1_body_defend', intensity: 2, remainingDuration: 6 })] };
            const seeded = { ...state, player: playerWithThorns };
            const result = executeSkill(seeded, 'bat-swarm-thoughtform', getCardById);
            const synergyEvent = result.events.find(e => e.kind === 'synergy-fired');
            expect(synergyEvent).toBeDefined();
            // Matched tier1_body_defend consumed from caster.
            expect(result.state.player.effects.some(e => e.effectId === 'tier1_body_defend')).toBe(false);
            // applyEffectOnFire landed buff_max_hp_up on caster.
            expect(result.state.player.effects.some(e => e.effectId === 'buff_max_hp_up')).toBe(true);
        });

        it('synergy does NOT fire when tier1_body_defend duration is below 5', () => {
            const state = fixtureState();
            const caster = state.player;
            const playerWithShortThorns = { ...caster, effects: [seedEffect({ effectId: 'tier1_body_defend', intensity: 2, remainingDuration: 3 })] };
            const seeded = { ...state, player: playerWithShortThorns };
            const result = executeSkill(seeded, 'bat-swarm-thoughtform', getCardById);
            expect(result.events.find(e => e.kind === 'synergy-fired')).toBeUndefined();
            // tier1_body_defend stays on caster (not consumed).
            expect(result.state.player.effects.some(e => e.effectId === 'tier1_body_defend')).toBe(true);
        });
    });

    // ─── 4. resonance-burst: consume opposing debuff for damage ──────────────
    describe('resonance-burst (predicate: debuff_confusion on target, durationMin: 1)', () => {
        it('synergy fires + consumes the matched debuff_confusion on target', () => {
            const state = fixtureState();
            const target = state.enemy;
            const enemyWithConfusion = { ...target, effects: [seedEffect({ effectId: 'debuff_confusion', intensity: 4, remainingDuration: 3 })] };
            const seeded = { ...state, enemy: enemyWithConfusion };
            const result = executeSkill(seeded, 'resonance-burst', getCardById);
            const synergyEvent = result.events.find(e => e.kind === 'synergy-fired');
            expect(synergyEvent).toBeDefined();
            // bonusDamage 3 + intensityDamageMul 2 × 4 + durationDamageMul 3 × 3 = 3+8+9 = 20.
            expect(synergyEvent && 'bonusDamage' in synergyEvent ? synergyEvent.bonusDamage : -1).toBe(20);
            // debuff_confusion is consumed from enemy.
            expect(result.state.enemy.effects.some(e => e.effectId === 'debuff_confusion')).toBe(false);
        });
    });

    // ─── 5. resonance-detonation: unconditional apex burn ────────────────────
    describe('resonance-detonation (no predicate; unconditional on cast)', () => {
        it('synergy fires unconditionally; consumes all combat resources; clears effects on both sides', () => {
            const state = fixtureState({ heart: 4, body: 6, mind: 5 }); // consumedTokens = 15
            const seededPlayer = { ...state.player, effects: [seedEffect({ effectId: 'buff_critical_rate_up', intensity: 2, remainingDuration: 4 })] };
            const seededEnemy = { ...state.enemy, effects: [seedEffect({ effectId: 'debuff_bleed', intensity: 2, remainingDuration: 4 })] };
            const seeded = { ...state, player: seededPlayer, enemy: seededEnemy };
            const result = executeSkill(seeded, 'resonance-detonation', getCardById);
            const synergyEvent = result.events.find(e => e.kind === 'synergy-fired');
            expect(synergyEvent).toBeDefined();
            if (synergyEvent && 'consumedTokens' in synergyEvent) {
                // consumedTokens = 4 + 6 + 5 = 15.
                expect(synergyEvent.consumedTokens).toBe(15);
                expect(synergyEvent.consumedAllResources).toBe(true);
                expect(synergyEvent.clearedAllEffects).toBe(true);
                // bonusDamage 25 + resourceTokenDamageMul 10 × 15 = 175.
                expect(synergyEvent.bonusDamage).toBe(175);
            }
            // Both sides have empty effects[].
            expect(result.state.player.effects).toHaveLength(0);
            expect(result.state.enemy.effects).toHaveLength(0);
            // combatResources is zeroed.
            expect(result.state.combatResources.body).toBe(0);
            expect(result.state.combatResources.mind).toBe(0);
            expect(result.state.combatResources.heart).toBe(0);
        });

        it('still fires synergy even with no effects on the field (unconditional)', () => {
            const state = fixtureState({ heart: 3, body: 3, mind: 3 });
            const result = executeSkill(state, 'resonance-detonation', getCardById);
            const synergyEvent = result.events.find(e => e.kind === 'synergy-fired');
            expect(synergyEvent).toBeDefined();
            if (synergyEvent && 'consumedTokens' in synergyEvent) {
                // consumedTokens = 9; bonusDamage = 25 + 9*10 = 115.
                expect(synergyEvent.consumedTokens).toBe(9);
                expect(synergyEvent.bonusDamage).toBe(115);
            }
        });
    });
});
