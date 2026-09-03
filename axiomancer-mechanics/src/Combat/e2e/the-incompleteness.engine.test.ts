/**
 * The Unfinished — the impossible playtest ceiling (2026-07-02).
 *
 * Pins the registration contract for the level-55 unique that anchors the
 * `impossible` playtest stage:
 *
 *   1. Registered under the `the-incompleteness` slug with the unique-tier shape.
 *   2. NEVER present in any `EnemiesByMap` random-encounter pool — it is
 *      reachable only through the authored playtest stage (design requirement).
 *   3. Mercy is not an out (no befriendabilityConfig) and it drops nothing
 *      (a single no-drop loot bucket): the fight is the lesson.
 *   4. Its authored threat sequence is wired: every step telegraphs, exactly
 *      the last step is the finale, and it resolves through `getThreatSequence`
 *      without losing a phase.
 *   5. A seeded sim smoke: `runOneEncounter` terminates with a valid outcome
 *      (almost certainly 'defeat' — that is the point of a ceiling).
 *
 * THE BIG NUMBERS REWRITE (2026-09-02): the enemy stat law (L15), the deck
 * laws (L14) and the doctrine win-rate curve (L23) are repealed, so the
 * `baseStats = 5 × level`, `4 phases` and `damageWeight` pins were deleted.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { ENEMY_REGISTRY, EnemiesByMap, TheIncompleteness } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { runOneEncounter } from '../combat.encounter.sim';
import { getThreatSequence, flattenAuthoredSteps } from '../combat.threat';
import { AUTHORED_THREAT_SEQUENCES } from '../combat.threat-sequences';

afterEach(() => vi.restoreAllMocks());

// Flattened (WS9): the sequence is linear, so this is the steps themselves.
const SEQUENCE = flattenAuthoredSteps(AUTHORED_THREAT_SEQUENCES['enemy-the-incompleteness']);

describe('The Unfinished — registry wiring', () => {
    it('is registered under the the-incompleteness slug with the unique shape', () => {
        const fromRegistry = ENEMY_REGISTRY['the-incompleteness'];
        expect(fromRegistry).toBe(TheIncompleteness);
        expect(fromRegistry.id).toBe('enemy-the-incompleteness');
        expect(fromRegistry.name).toBe('The Unfinished');
        // P0-truth pass (2026-07-05): L55/1375 HP became a scripted 200/200 win
        // once the read rule + payload wiring got real — retuned to L110/2750 HP
        // (greedy scrapes 0.095 @ 200 seeds, back near the 1-5% design target).
        expect(fromRegistry.level).toBe(110);
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

    it('mercy is not an out and it drops nothing — the fight is the lesson', () => {
        expect(TheIncompleteness.befriendabilityConfig).toBeUndefined();
        expect(TheIncompleteness.loot).toHaveLength(1);
        expect(TheIncompleteness.loot![0].item).toBeNull();
        expect(TheIncompleteness.loot![0].weight).toBe(100);
    });
});

describe('The Unfinished — authored threat sequence', () => {
    // THE BIG NUMBERS REWRITE (2026-09-02) repealed the enemy-deck laws (L14)
    // and the doctrine win-rate curve (L23), so the old `toHaveLength(4)` +
    // `damageWeight === [0.21, 0.232, 0.271, 0.326]` PLAYTEST-CALIBRATION pin
    // is gone: it was a curve against the retired global THREAT_DAMAGE_SCALE
    // and a phase-count pin, both repealed. What survives is the wiring the
    // stage actually depends on — an authored sequence exists, exactly its
    // LAST step is the finale, and no step telegraphs nothing.
    it('is authored as a multi-phase sequence with exactly the last phase flagged final', () => {
        expect(SEQUENCE).toBeDefined();
        expect(SEQUENCE.length).toBeGreaterThan(1);
        const finals = SEQUENCE.map((p, i) => (p.isFinalPhase ? i : -1)).filter(i => i >= 0);
        expect(finals).toEqual([SEQUENCE.length - 1]);
    });

    it('every phase telegraphs a debuff, and one phase regenerates', () => {
        for (const phase of SEQUENCE) {
            expect(phase.threatEffectId).toMatch(/^debuff_/);
            expect(phase.actionText).toMatch(/\S/);
            expect(phase.stanceHint).toMatch(/\S/);
        }
        // "A New Axiom" knits itself whole off your best argument. The
        // magnitude is a tuning number (8 at the old scale, 120 now that the
        // Unfinished carries thousands of VITAE); that exactly one phase heals
        // at all is the behaviour under test.
        expect(SEQUENCE.filter(p => (p.enemyHeal ?? 0) > 0)).toHaveLength(1);
    });

    it('resolves through getThreatSequence with the final phase intact', () => {
        const resolved = getThreatSequence(deepClone(TheIncompleteness));
        expect(resolved).toHaveLength(SEQUENCE.length);
        expect(resolved[resolved.length - 1].isFinalPhase).toBe(true);
        expect(resolved.slice(0, -1).every(p => !p.isFinalPhase)).toBe(true);
    });
});

describe('The Unfinished — seeded encounter smoke', () => {
    function impossibleStagePlayer(): Character {
        // Mirrors the `impossible` stage profile shape: level-50 stats, 260 HP,
        // a doctrine-faithful status loadout (DoT erosion + soft control).
        const p = deepClone(Player);
        p.knownCards = ['slippery-slope', 'false-dilemma'];
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
