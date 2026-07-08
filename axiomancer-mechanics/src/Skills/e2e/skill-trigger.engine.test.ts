/**
 * Hermetic E2E — Skills system (Master Spec §3).
 *
 * Skills are NOT cards: covers the token-economy trigger hook in isolation
 * (`Skills/skill-trigger.engine.ts`) plus the combat-engine wiring
 * (`Combat/combat.engine.ts`'s `triggerCombatSkill`) that folds a skill
 * trigger into a live encounter — independent of the drawn hand / card plays.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { setSeed } from '../../Utils/rng';
import type { CombatResources } from '../../Cards/types';
import { initializeCombatEncounter, triggerCombatSkill } from '../../Combat/combat.engine';
import { SKILLS_LIBRARY, lookupSkill } from '../skills.library';
import { getKnownSkills } from '../known-skills';
import { canAffordSkill, spendSkillCost, triggerSkill } from '../skill-trigger.engine';

// Deterministic seed: `landSkillEffect`'s Tier-2-buff branch (Ad Hoc Rescue's
// `buff_regeneration`) rolls a d20 fumble/crit check via the shared resolver
// (mirrors card-side Tier-2 buff behavior). Without a fixed seed this test
// file is ~5% flaky on a fumble roll; seed the RNG per the `Combat/index.test.ts`
// convention so every run is deterministic.
beforeEach(() => { setSeed('skills-trigger-test'); });

function makePlayer(): Character {
    const p = deepClone(Player);
    p.knownSkills = [];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 100;
    p.maxHealth = 100;
    p.effects = [];
    return p;
}

function makeEnemy(hp = 1000): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-skills-test';
    e.health = hp;
    e.maxHealth = hp;
    e.effects = [];
    return e;
}

const FULL_RESOURCES: CombatResources = { heart: 5, body: 5, mind: 5, fallacy: 5, paradox: 5 };
const EMPTY_RESOURCES: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };

// ── Catalogue shape ──────────────────────────────────────────────────────────

describe('SKILLS_LIBRARY', () => {
    it('has 6-8 entries, all fallacy/paradox-lexicon named, all unlocked today', () => {
        expect(SKILLS_LIBRARY.length).toBeGreaterThanOrEqual(6);
        expect(SKILLS_LIBRARY.length).toBeLessThanOrEqual(8);
        SKILLS_LIBRARY.forEach(def => expect(def.requiresUnlock).toBeNull());
    });

    it('getKnownSkills returns every catalogue id (no gating implemented yet)', () => {
        expect(getKnownSkills().sort()).toEqual(SKILLS_LIBRARY.map(s => s.id).sort());
    });

    it('lookupSkill is O(1)-by-id and returns undefined for unknown ids', () => {
        expect(lookupSkill('sorites-reckoning')?.name).toBe("Sorites' Reckoning");
        expect(lookupSkill('not-a-real-skill')).toBeUndefined();
    });

    it('does not collide in name with the card "Regress ad Infinitum" (§3.3 resolution)', () => {
        expect(SKILLS_LIBRARY.some(s => s.name === 'Regress ad Infinitum')).toBe(false);
        expect(lookupSkill('sorites-retreat')?.name).toBe("Sorites' Retreat");
    });
});

// ── Pure token-economy helpers ───────────────────────────────────────────────

describe('canAffordSkill / spendSkillCost', () => {
    it('affords exactly-enough and more-than-enough resources', () => {
        expect(canAffordSkill(FULL_RESOURCES, { body: 2, fallacy: 1 })).toBe(true);
        expect(canAffordSkill({ ...EMPTY_RESOURCES, body: 2 }, { body: 2 })).toBe(true);
    });

    it('rejects insufficient resources', () => {
        expect(canAffordSkill(EMPTY_RESOURCES, { body: 2, fallacy: 1 })).toBe(false);
    });

    it('spendSkillCost subtracts and clamps at 0', () => {
        expect(spendSkillCost({ ...EMPTY_RESOURCES, body: 1 }, { body: 2 }).body).toBe(0);
        expect(spendSkillCost(FULL_RESOURCES, { body: 2 }).body).toBe(3);
    });
});

// ── triggerSkill (pure resolution) ───────────────────────────────────────────

describe('triggerSkill', () => {
    it('apply_effect (self): Ad Hoc Rescue lands buff_regeneration on the caster', () => {
        const def = lookupSkill('ad-hoc-rescue')!;
        const result = triggerSkill({ round: 1, casterEffects: [], enemyEffects: [] }, FULL_RESOURCES, def);
        expect(result.landed).toBe(true);
        expect(result.casterEffects.some(ae => ae.effectId === 'buff_regeneration')).toBe(true);
        expect(result.resourceDelta.heart).toBe(-2);
        expect(result.engineHandoff).toBeNull();
    });

    it('apply_effect (enemy): The Analyst’s Regress lands debuff_confusion on the enemy', () => {
        const def = lookupSkill('analysts-regress')!;
        const result = triggerSkill({ round: 1, casterEffects: [], enemyEffects: [] }, FULL_RESOURCES, def);
        expect(result.landed).toBe(true);
        expect(result.enemyEffects.some(ae => ae.effectId === 'debuff_confusion')).toBe(true);
        expect(result.resourceDelta.fallacy).toBe(-2);
    });

    it('cleanse_self: Sorites’ Retreat removes up to `count` debuffs, ignores buffs', () => {
        const def = lookupSkill('sorites-retreat')!;
        const casterEffects = [
            { effectId: 'debuff_bleed', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 2 as const },
            { effectId: 'debuff_poison', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 2 as const },
            { effectId: 'debuff_stun', remainingDuration: 1, intensity: 1, appliedAt: 1, tier: 2 as const },
            { effectId: 'buff_haste', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 2 as const },
        ];
        const result = triggerSkill({ round: 1, casterEffects, enemyEffects: [] }, FULL_RESOURCES, def);
        expect(result.landed).toBe(true);
        expect(result.casterEffects).toHaveLength(2);
        expect(result.casterEffects.some(ae => ae.effectId === 'buff_haste')).toBe(true);
        expect(result.casterEffects.some(ae => ae.effectId === 'debuff_stun')).toBe(true);
    });

    it('strip_enemy_buff: Petitio Principii removes an enemy buff only', () => {
        const def = lookupSkill('petitio-principii')!;
        const enemyEffects = [
            { effectId: 'buff_haste', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 2 as const },
            { effectId: 'debuff_bleed', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 2 as const },
        ];
        const result = triggerSkill({ round: 1, casterEffects: [], enemyEffects }, FULL_RESOURCES, def);
        expect(result.landed).toBe(true);
        expect(result.enemyEffects).toEqual([enemyEffects[1]]);
    });

    it('strip_enemy_buff: reports not-landed when the enemy carries no buff', () => {
        const def = lookupSkill('petitio-principii')!;
        const enemyEffects = [
            { effectId: 'debuff_bleed', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 2 as const },
        ];
        const result = triggerSkill({ round: 1, casterEffects: [], enemyEffects }, FULL_RESOURCES, def);
        expect(result.landed).toBe(false);
        expect(result.enemyEffects).toEqual(enemyEffects);
    });

    it('grant_barrier / detonate_stacks / consume_bank_burst hand off to the combat engine', () => {
        const barrier = triggerSkill({ round: 1, casterEffects: [], enemyEffects: [] }, FULL_RESOURCES, lookupSkill('unfalsifiable-ward')!);
        expect(barrier.engineHandoff).toEqual({ kind: 'grant_barrier', amount: 8 });

        const detonate = triggerSkill({ round: 1, casterEffects: [], enemyEffects: [] }, FULL_RESOURCES, lookupSkill('sorites-reckoning')!);
        expect(detonate.engineHandoff).toEqual({ kind: 'detonate_stacks', minDistinctDebuffs: 3, perDebuffPct: 8 });

        const burst = triggerSkill({ round: 1, casterEffects: [], enemyEffects: [] }, FULL_RESOURCES, lookupSkill('sunk-cost-surge')!);
        expect(burst.engineHandoff).toEqual({ kind: 'consume_bank_burst', resource: 'body', tokensBurned: 3, pctPerToken: 4 });
        // The Sunk-Cost Surge costs body:2 (banked resourceDelta) but then burns
        // the REMAINING 3 body tokens (5 - 2) into the burst — the full pool.
        expect(burst.resourceDelta.body).toBe(-5);
    });
});

// ── triggerCombatSkill (combat-engine wiring) ────────────────────────────────

describe('triggerCombatSkill', () => {
    function makeState(resources: CombatResources) {
        const state = initializeCombatEncounter(makePlayer(), makeEnemy());
        return { ...state, combatResources: resources, phase: 'phase-play' as const };
    }

    it('is triggerable independent of card plays / hand state (no phase-play card gate)', () => {
        const state = makeState(FULL_RESOURCES);
        const { state: next, events } = triggerCombatSkill(state, 'ad-hoc-rescue');
        expect(events[0].kind).toBe('skill-triggered');
        expect(next.combatResources.heart).toBe(3);
        expect(next.player.effects.some(ae => ae.effectId === 'buff_regeneration')).toBe(true);
        // Hand/deck untouched — this is not a card play.
        expect(next.hand).toEqual(state.hand);
    });

    it('fizzles (does not spend tokens) when unaffordable', () => {
        const state = makeState(EMPTY_RESOURCES);
        const { state: next, events } = triggerCombatSkill(state, 'ad-hoc-rescue');
        expect(events[0].kind).toBe('skill-fizzled');
        expect(next.combatResources).toEqual(EMPTY_RESOURCES);
    });

    it('grant_barrier resolves through the engine handoff and raises state.barrier', () => {
        const state = makeState(FULL_RESOURCES);
        const { state: next } = triggerCombatSkill(state, 'unfalsifiable-ward');
        expect(next.barrier).toBe((state.barrier ?? 0) + 8);
    });

    it('once_per_combat: Sorites’ Reckoning fizzles on a second trigger', () => {
        const state = makeState({ ...FULL_RESOURCES, paradox: 10 });
        const first = triggerCombatSkill(state, 'sorites-reckoning');
        expect(first.events[0].kind).not.toBe('skill-fizzled');
        const second = triggerCombatSkill(first.state, 'sorites-reckoning');
        expect(second.events[0].kind).toBe('skill-fizzled');
        // Second attempt refunds nothing further (paradox unspent this time).
        expect(second.state.combatResources.paradox).toBe(first.state.combatResources.paradox);
    });

    it('cooldown: The Analyst’s Regress fizzles until `rounds` have elapsed', () => {
        const state = makeState({ ...FULL_RESOURCES, fallacy: 10 });
        const first = triggerCombatSkill(state, 'analysts-regress');
        const second = triggerCombatSkill({ ...first.state, round: first.state.round + 1 }, 'analysts-regress');
        expect(second.events[0].kind).toBe('skill-fizzled');
        const third = triggerCombatSkill({ ...first.state, round: first.state.round + 3 }, 'analysts-regress');
        expect(third.events[0].kind).not.toBe('skill-fizzled');
    });

    it('unknown skill id is a no-op transition', () => {
        const state = makeState(FULL_RESOURCES);
        const { state: next, events } = triggerCombatSkill(state, 'not-a-real-skill');
        expect(events).toEqual([]);
        expect(next).toBe(state);
    });
});
