/**
 * Hermetic e2e — spec 33 §2 (Phase D6e): enemy stanceCheck telegraph authoring.
 *
 * D6e drains D3-F2 (yield income was 0.000 because no enemy authored a
 * `stanceCheck`). The engine's `resolveStanceCheck` / `resolveThreatPhase`
 * resolution is already covered by `upgradeable-dice.engine.test.ts`; this suite
 * pins the AUTHORING seam: `defaultStanceCheck` and the `getThreatSequence`
 * backfill that funnels every threat source (explicit `threatSequence`,
 * `AUTHORED_THREAT_SEQUENCES`, the default generator) through one place so the
 * short explicit sequences the sim's witness enemies carry get a check too.
 *
 * The telegraph is a content field — inert while the flag is off — so these are
 * flag-agnostic (they read the authored data, not the resolution).
 */

import { describe, it, expect } from 'vitest';

import { GraveLarva } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import { deepClone } from '../../Utils';
import { defaultStanceCheck, getThreatSequence } from '../combat.threat';

describe('spec 33 §2 D6e — defaultStanceCheck', () => {
    it('punishes the enemy stance head-on and yields to the chain successor', () => {
        // Chain heart → body → mind (matches MOMENTUM_CHAIN_ORDER / STANCE_CYCLE).
        expect(defaultStanceCheck('heart')).toEqual({ punishes: 'heart', yields: 'body' });
        expect(defaultStanceCheck('body')).toEqual({ punishes: 'body', yields: 'mind' });
        expect(defaultStanceCheck('mind')).toEqual({ punishes: 'mind', yields: 'heart' });
    });

    it('never yields to the same stance it punishes (there is always a way to answer)', () => {
        for (const s of ['heart', 'body', 'mind'] as const) {
            const c = defaultStanceCheck(s);
            expect(c.yields).not.toBe(c.punishes);
        }
    });
});

describe('spec 33 §2 D6e — getThreatSequence backfill', () => {
    it('every phase of a witness enemy carries an open stance check', () => {
        // GraveLarva (an early-stage sim witness) carries a short explicit
        // sequence the default generator never touches — the backfill must reach
        // it. Pre-D6e these phases had no check (the F2 gap).
        const seq = getThreatSequence(GraveLarva);
        expect(seq.length).toBeGreaterThan(0);
        for (const phase of seq) {
            expect(phase.stanceCheck).toBeDefined();
            expect(phase.stanceCheck).toEqual(defaultStanceCheck(phase.enemyStance));
        }
    });

    it('preserves a hand-authored stanceCheck instead of overwriting it', () => {
        // A synthetic enemy whose explicit sequence already authors a bespoke
        // check on one phase — the backfill must leave it untouched and only
        // fill the phase that authored none.
        const authored = { punishes: 'mind', yields: 'heart' } as const;
        const enemy = deepClone(GraveLarva) as Enemy & {
            threatSequence?: Array<Record<string, unknown>>;
        };
        enemy.threatSequence = [
            { index: 1, enemyStance: 'body', threatAction: { label: 'a', effects: [] }, isFinalPhase: false, stanceCheck: { ...authored } },
            { index: 2, enemyStance: 'body', threatAction: { label: 'b', effects: [] }, isFinalPhase: true },
        ];
        const seq = getThreatSequence(enemy as Enemy);
        expect(seq[0].stanceCheck).toEqual(authored); // preserved
        expect(seq[1].stanceCheck).toEqual(defaultStanceCheck('body')); // backfilled
    });
});
