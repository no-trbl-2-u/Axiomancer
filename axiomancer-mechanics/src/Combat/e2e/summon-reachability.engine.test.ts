/**
 * Hermetic E2E — roster reachability guard for SUMMON (Phase 102).
 *
 * `summon.engine.test.ts` pins the engine's SUMMON rules against synthetic
 * fixtures; it never asks whether a real roster enemy can actually reach
 * wave 2. Wave 2 only spawns on a phase boundary where a STAGE fires
 * (`combat.engine.ts`'s `ADD_WAVE_CAP` block), so a SUMMON carrier with no
 * `stages` is permanently capped at wave 1 — exactly what shipped for
 * `JeweledTree`, the roster's first and (until this pass) only carrier
 * (filed CRITIQUE.md, burn-day audit 2026-09-19, row 3.9). `adjust-enemies`
 * pass 17 (2026-09-23) gave `RawheadRex` a SUMMON line riding its existing
 * "UP FROM UNDER THE STAIRS" stage boundary, so this asks the question
 * directly against the live library rather than a synthetic foe, and pins
 * it so a future roster edit that regresses reachability fails CI instead
 * of sitting unflagged.
 *
 * Pure math + fixed RNG, real `EnemyLibrary` data, no disk/network/TTY.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { EnemyLibrary } from '../../Enemy/enemy.library';
import { findEnemyKeyword } from '../../Enemy/enemy-keywords';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, processBetweenPhases, ADD_WAVE_CAP,
} from '../combat.engine';
import type { CombatEncounterState } from '../combat.encounter.types';

const rng = (): number => 0.5;
const SEED = 11;

function makePlayer(): Character {
    const p = deepClone(Player);
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    return p;
}

/** Opens a real encounter against a real roster enemy and drives it through
 *  wave 1 (the fight's first boundary), then forces every authored stage's
 *  trigger in order, replaying a between-phases boundary after each — the
 *  same shape a long real fight reaches, without simulating every round. */
function driveWaves(enemy: Enemy): number {
    const foe = deepClone(enemy);
    let s: CombatEncounterState = initializeCombatEncounter(makePlayer(), foe, undefined, SEED);
    s = rollEncounterDice(s, rng).state;
    s = processBetweenPhases(s, rng).state; // wave 1, if this foe carries SUMMON

    for (const stage of foe.stages ?? []) {
        if (stage.at.vitaePct !== undefined) {
            const threshold = Math.floor(stage.at.vitaePct * s.enemy.maxHealth);
            s = { ...s, enemy: { ...s.enemy, health: Math.min(s.enemy.health, threshold) } };
        }
        if (stage.at.round !== undefined) {
            s = { ...s, round: Math.max(s.round, stage.at.round - 1) };
        }
        s = processBetweenPhases({ ...s, phase: 'phase-resolve' }, rng).state;
    }
    return s.addWavesSpawned ?? 0;
}

describe('SUMMON roster reachability', () => {
    it('at least one enemy in the shipped roster carries SUMMON', () => {
        const carriers = EnemyLibrary.filter(e => findEnemyKeyword(e.keywords, 'summon'));
        expect(carriers.length).toBeGreaterThan(0);
    });

    it('at least one real SUMMON carrier reaches ADD_WAVE_CAP through its own authored stages', () => {
        const carriers = EnemyLibrary.filter(e => findEnemyKeyword(e.keywords, 'summon'));
        const waveCounts = carriers.map(e => ({ id: e.id, waves: driveWaves(e) }));

        expect(waveCounts.some(c => c.waves >= ADD_WAVE_CAP)).toBe(true);
    });

    it('RawheadRex specifically reaches wave 2 on its "UP FROM UNDER THE STAIRS" boundary', () => {
        const rawhead = EnemyLibrary.find(e => e.id === 'enemy-rawhead-rex')!;
        expect(findEnemyKeyword(rawhead.keywords, 'summon')).toBeDefined();
        expect(rawhead.stages?.length ?? 0).toBeGreaterThan(0);
        expect(driveWaves(rawhead)).toBe(ADD_WAVE_CAP);
    });
});
