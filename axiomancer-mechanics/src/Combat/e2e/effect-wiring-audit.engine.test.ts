/**
 * Hermetic E2E — effect-wiring audit fixes (2026-07-14). Each block pins a
 * payload surface that was previously INERT (or mis-timed) in Hazard-Pattern
 * Combat and is now read by the live engine:
 *
 *   - `defenseModifier` → flat armor soak on the incoming telegraph
 *     (buff_damage_reduction / buff_invincibility / buff_phoenix_vigor's guard).
 *   - BACKFIRE lethal-ordering guard — an enemy the backfire drip kills does
 *     not still complete its telegraphed swing that phase.
 *   - POISON ramp reset on reapplication (`escalatesPerTurn` → `appliedAt`
 *     re-stamped in `applyEffect`).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { applyEffect, lookupEffect } from '../../Effects';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
} from '../combat.engine';
import type { CombatEvent } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

function makePlayer(effects: ActiveEffect[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = [];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = effects;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

const has = (events: readonly CombatEvent[], kind: string): boolean => events.some(e => e.kind === kind);

// ── ARMOR (defenseModifier) — the live home for the defensive potions ─────────

describe('ARMOR — defenseModifier soaks the incoming telegraph', () => {
    it('a plain player takes telegraph damage (control)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer(), makeEnemy(300, 'mind'), undefined, 7);
        const res = resolveThreatPhase(rollEncounterDice(base).state);
        expect(res.state.player.health).toBeLessThan(200);
    });

    it('buff_invincibility (defenseModifier 99) fully soaks the same hit', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([ae('buff_invincibility', 1, 1, 3)]);
        const base = initializeCombatEncounter(player, makeEnemy(300, 'mind'), undefined, 7);
        const res = resolveThreatPhase(rollEncounterDice(base).state);
        expect(res.state.player.health).toBe(200); // 99 armor zeroes any realistic hit
    });

    it('buff_damage_reduction (defenseModifier 5) shaves 5 off the control hit', () => {
        mockSequentialRng(0.05);
        const control = resolveThreatPhase(
            rollEncounterDice(initializeCombatEncounter(makePlayer(), makeEnemy(300, 'mind'), undefined, 7)).state,
        ).state.player.health;
        const armored = resolveThreatPhase(
            rollEncounterDice(initializeCombatEncounter(
                makePlayer([ae('buff_damage_reduction', 1, 3)]), makeEnemy(300, 'mind'), undefined, 7,
            )).state,
        ).state.player.health;
        // Same seed / same hit; armor shaves up to 5 off whatever the hit was.
        const controlLoss = 200 - control;
        const armoredLoss = 200 - armored;
        expect(controlLoss).toBeGreaterThan(0);                 // control took a hit
        expect(armoredLoss).toBe(Math.max(0, controlLoss - 5)); // …armor removed 5 of it
    });
});

// ── BACKFIRE lethal-ordering guard ───────────────────────────────────────────

describe('BACKFIRE — a lethal drip cancels the enemy swing this phase', () => {
    it('an enemy killed by backfire does not still hit the player', () => {
        mockSequentialRng(0.05);
        // 1-HP enemy carrying backfire; one rung staggered (not fully denied) so
        // it WOULD act — but the 1-HP backfire drip kills it before the swing.
        const enemy = makeEnemy(1, 'mind', [ae('debuff_backfire', 1, 2)]);
        const base = initializeCombatEncounter(makePlayer(), enemy, undefined, 7);
        const state = { ...rollEncounterDice(base).state, staggerRungs: 1 };
        const res = resolveThreatPhase(state);
        expect(has(res.events, 'backfired')).toBe(true);
        expect(res.state.enemy.health).toBe(0);
        expect(res.state.finalOutcome).toBe('victory');
        expect(res.state.player.health).toBe(200);      // the swing never landed
        expect(has(res.events, 'threat-fired')).toBe(false);
    });
});

// ── POISON ramp reset on reapplication ───────────────────────────────────────

describe('POISON — reapplication resets the escalation ramp', () => {
    it('re-stamps appliedAt (ramp back to turn 0) while intensity climbs', () => {
        const poison = lookupEffect('debuff_poison')!;
        // First application at round 0.
        const first = applyEffect([], poison, 0).activeEffects;
        expect(first[0].appliedAt).toBe(0);
        expect(first[0].intensity).toBe(1);
        // Reapplied four rounds later: the ramp clock resets to the new round…
        const again = applyEffect(first, poison, 4).activeEffects;
        expect(again).toHaveLength(1);
        expect(again[0].appliedAt).toBe(4);   // ramp restarts (spec 32 v3)
        expect(again[0].intensity).toBe(2);   // …but intensity still stacks
    });

    it('a non-escalating DoT keeps its original appliedAt on reapply', () => {
        const bleed = lookupEffect('debuff_bleed')!; // decaysPerTick, not escalating
        const first = applyEffect([], bleed, 0).activeEffects;
        const again = applyEffect(first, bleed, 4).activeEffects;
        expect(again[0].appliedAt).toBe(0);   // age preserved — ramp is irrelevant
    });
});
