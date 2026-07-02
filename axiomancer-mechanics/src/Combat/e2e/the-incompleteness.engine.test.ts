/**
 * The Incompleteness — the impossible playtest ceiling (2026-07-02).
 *
 * Pins the registration contract for the level-55 unique that anchors the
 * `impossible` playtest stage:
 *
 *   1. Registered under the `the-incompleteness` slug, with the stat law
 *      (baseStats sum = 5 x level) and the unique-tier shape intact.
 *   2. NEVER present in any `EnemiesByMap` random-encounter pool — it is
 *      reachable only through the authored playtest stage (design requirement).
 *   3. Mercy is not an out (no befriendabilityConfig) and it drops nothing
 *      (a single no-drop loot bucket): the fight is the lesson.
 *   4. Its authored threat sequence is the 4-phase escalating pattern with the
 *      final phase flagged — status play (DoT + control) stays the only
 *      efficient way to even dent it, per doctrine.
 *   5. A seeded sim smoke: `runOneEncounter` terminates with a valid outcome
 *      (almost certainly 'defeat' — that is the point of a ceiling).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { ENEMY_REGISTRY, EnemiesByMap, TheIncompleteness } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { runOneEncounter } from '../combat.encounter.sim';
import { getThreatSequence } from '../combat.threat';
import { AUTHORED_THREAT_SEQUENCES } from '../combat.threat-sequences';

afterEach(() => vi.restoreAllMocks());

const SEQUENCE = AUTHORED_THREAT_SEQUENCES['enemy-the-incompleteness'];

describe('The Incompleteness — registry wiring', () => {
    it('is registered under the the-incompleteness slug with the unique shape', () => {
        const fromRegistry = ENEMY_REGISTRY['the-incompleteness'];
        expect(fromRegistry).toBe(TheIncompleteness);
        expect(fromRegistry.id).toBe('enemy-the-incompleteness');
        expect(fromRegistry.name).toBe('The Incompleteness');
        expect(fromRegistry.level).toBe(55);
        expect(fromRegistry.difficulty).toBe('unique');
        expect(fromRegistry.logic).toBe('boss');
    });

    it('never appears in any EnemiesByMap random-encounter pool', () => {
        for (const [mapName, pool] of Object.entries(EnemiesByMap)) {
            const ids = pool.map(e => e.id);
            expect(ids, `pool '${mapName}' must not contain the playtest ceiling`)
                .not.toContain('enemy-the-incompleteness');
        }
    });

    it('obeys the stat law: baseStats sum to 5 x level', () => {
        const { heart, body, mind } = TheIncompleteness.baseStats;
        expect(heart + body + mind).toBe(5 * TheIncompleteness.level);
        expect(heart + body + mind).toBe(275);
    });

    it('mercy is not an out and it drops nothing — the fight is the lesson', () => {
        expect(TheIncompleteness.befriendabilityConfig).toBeUndefined();
        expect(TheIncompleteness.loot).toHaveLength(1);
        expect(TheIncompleteness.loot![0].item).toBeNull();
        expect(TheIncompleteness.loot![0].weight).toBe(100);
    });
});

describe('The Incompleteness — authored threat sequence', () => {
    it('is authored as 4 escalating phases with the final phase flagged', () => {
        expect(SEQUENCE).toBeDefined();
        expect(SEQUENCE).toHaveLength(4);
        // PLAYTEST-CALIBRATION — calibrated so the best scripted line (greedy/blind)
        // scrapes ~2% at 200 seeds; see combat-playtest.balance-bands.sim.test.ts.
        expect(SEQUENCE.map(p => p.damageWeight)).toEqual([0.21, 0.232, 0.271, 0.326]);
        expect(SEQUENCE[3].isFinalPhase).toBe(true);
        expect(SEQUENCE.slice(0, 3).some(p => p.isFinalPhase)).toBe(false);
    });

    it('every phase telegraphs a debuff and phase 3 regenerates', () => {
        for (const phase of SEQUENCE) {
            expect(phase.threatEffectId).toMatch(/^debuff_/);
            expect(phase.actionText).toMatch(/\S/);
            expect(phase.stanceHint).toMatch(/\S/);
        }
        expect(SEQUENCE[2].enemyHeal).toBe(8);
    });

    it('resolves through getThreatSequence with the final phase intact', () => {
        const resolved = getThreatSequence(deepClone(TheIncompleteness));
        expect(resolved).toHaveLength(4);
        expect(resolved[3].isFinalPhase).toBe(true);
        expect(resolved.slice(0, 3).every(p => !p.isFinalPhase)).toBe(true);
    });
});

describe('The Incompleteness — seeded encounter smoke', () => {
    function impossibleStagePlayer(): Character {
        // Mirrors the `impossible` stage profile shape: level-50 stats, 260 HP,
        // a doctrine-faithful status loadout (DoT erosion + soft control).
        const p = deepClone(Player);
        p.knownSkills = ['slippery-slope', 'false-dilemma'];
        p.baseStats = { heart: 22, body: 22, mind: 22 };
        p.health = 260;
        p.maxHealth = 260;
        return p;
    }

    it('runOneEncounter terminates with a valid outcome', () => {
        const result = runOneEncounter(impossibleStagePlayer(), TheIncompleteness, 7);
        expect(['victory', 'mercy', 'defeat', 'retreat']).toContain(result.outcome);
        expect(result.rounds).toBeGreaterThanOrEqual(1);
        expect(result.playerHpTaken).toBeGreaterThanOrEqual(0);
    }, 30_000);
});
