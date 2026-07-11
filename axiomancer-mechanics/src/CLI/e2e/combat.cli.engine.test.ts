/**
 * Hermetic e2e — New Hazard-style Combat CLI (`src/CLI/combat.cli.ts`).
 *
 * Phase 165 Unit 5 DoD: deterministic `--auto` walkthrough fixture.
 *
 * Tests cover:
 *   - Flag parsing (parseCombatArgv)
 *   - Deterministic `--auto` run (same seed → identical outcome)
 *   - State-log JSONL contains expected records (start + end + phase records)
 *   - All four auto policies complete without throwing
 *   - Gate 0 §2 auditor tooling: `--stage` without `--enemy` fights the
 *     stage's roster, and `--auto --json-events` emits a per-play transcript
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import {
    parseCombatArgv,
    runCombatCli,
} from '../combat.cli';
import { setOutputMode, setStateLogPath } from '../io';
import { COMBAT_STAGE_PROFILES } from '../../Combat/combat.stage-profiles';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import type { EnemySlug } from '../../Enemy/enemy.library';

const tmpFiles: string[] = [];
function tmpPath(suffix: string, ext = 'jsonl'): string {
    const p = path.join(os.tmpdir(), `axiomancer-combat-cli-${suffix}-${randomUUID()}.${ext}`);
    tmpFiles.push(p);
    return p;
}

function readLog(p: string): Array<Record<string, unknown>> {
    if (!fs.existsSync(p)) return [];
    return fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

afterEach(() => {
    tmpFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    tmpFiles.length = 0;
    setStateLogPath(null);
    setOutputMode('human');
});

describe('Combat CLI — flag parsing', () => {
    it('parses new-combat flags', () => {
        const flags = parseCombatArgv([
            '--enemy', 'little-belle',
            '--preset', 'apprentice',
            '--seed', '42',
            '--auto',
            '--policy', 'status',
            '--max-turns', '6',
            '--json-events',
            '--state-log', 'trace.jsonl',
        ]);
        expect(flags).toMatchObject({
            enemySlug: 'little-belle',
            presetId: 'apprentice',
            seed: 42,
            auto: true,
            policy: 'status',
            maxTurns: 6,
            jsonEvents: true,
            stateLogPath: 'trace.jsonl',
        });
    });

    it('supports --flag=value form', () => {
        const flags = parseCombatArgv(['--enemy=foot-stealer', '--auto']);
        expect(flags.enemySlug).toBe('foot-stealer');
        expect(flags.auto).toBe(true);
        expect(flags.policy).toBe('status');
        expect(flags.maxTurns).toBe(8);
    });

    it('rejects unknown flags', () => {
        expect(() => parseCombatArgv(['--nope'])).toThrow(/Unknown combat CLI flag/);
    });

    it('rejects invalid policy', () => {
        expect(() => parseCombatArgv(['--policy', 'reckless'])).toThrow(/--policy/);
    });

    it('rejects non-positive --max-turns', () => {
        expect(() => parseCombatArgv(['--max-turns', '0'])).toThrow(/--max-turns/);
    });

    it('rejects non-numeric --seed', () => {
        expect(() => parseCombatArgv(['--seed', 'abc'])).toThrow(/--seed/);
    });
});

describe('Combat CLI — deterministic auto playthrough', () => {
    it('produces a reproducible outcome for a fixed seed', async () => {
        const runOnce = async () => {
            const logPath = tmpPath('auto');
            await runCombatCli([
                '--auto', '--policy', 'status',
                '--enemy', 'little-belle',
                '--preset', 'apprentice',
                '--seed', '42',
                '--max-turns', '12',
                '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const start = logs.find(r => r.action === 'hazardCombat:start');
            const end = logs.find(r => r.action === 'hazardCombat:end');
            return { start, end, outcome: (end?.event as Record<string, unknown>)?.outcome as string };
        };

        const a = await runOnce();
        const b = await runOnce();

        expect(a.outcome).toEqual(b.outcome);
        expect(a.start).toBeDefined();
        expect(a.end).toBeDefined();
        expect(['victory', 'defeat', 'mercy', 'capitulate', 'concede', 'retreat']).toContain(a.outcome);
    });

    it('records at least one phase record per run', async () => {
        const logPath = tmpPath('phases');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--enemy', 'little-belle',
            '--preset', 'apprentice',
            '--seed', '7',
            '--max-turns', '6',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const phases = logs.filter(r => r.action === 'hazardCombat:autoPhase');
        expect(phases.length).toBeGreaterThan(0);
    });

    it('--stage without --enemy fights the stage roster, seed-deterministically (Gate 0 §2)', async () => {
        const logPath = tmpPath('stage-roster');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--stage', 'mid',
            '--seed', '2',
            '--max-turns', '3',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const start = logs.find(r => r.action === 'hazardCombat:start');
        const after = start?.after as { enemy?: { name?: string } } | undefined;
        const enemyName = after?.enemy?.name;
        const roster = COMBAT_STAGE_PROFILES.mid.enemySlugs;
        const rosterNames = roster.map(s => ENEMY_REGISTRY[s as EnemySlug].name);
        // The enemy comes from the MID roster (not the little-belle default)…
        expect(rosterNames).toContain(enemyName);
        expect(enemyName).not.toBe(ENEMY_REGISTRY['little-belle'].name);
        // …and the pick is a pure function of the seed.
        expect(enemyName).toBe(ENEMY_REGISTRY[roster[2 % roster.length] as EnemySlug].name);
    });

    it('an explicit --enemy still wins over the --stage roster', async () => {
        const logPath = tmpPath('stage-enemy-explicit');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--stage', 'mid',
            '--enemy', 'little-belle',
            '--seed', '2',
            '--max-turns', '3',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const start = logs.find(r => r.action === 'hazardCombat:start');
        const after = start?.after as { enemy?: { name?: string } } | undefined;
        expect(after?.enemy?.name).toBe(ENEMY_REGISTRY['little-belle'].name);
    });

    it('all four auto policies complete without throwing', async () => {
        for (const policy of ['naive', 'safe', 'aggressive', 'status'] as const) {
            const logPath = tmpPath(`policy-${policy}`);
            await expect(runCombatCli([
                '--auto', '--policy', policy,
                '--enemy', 'foot-stealer',
                '--preset', 'apprentice',
                '--seed', '1',
                '--max-turns', '8',
                '--state-log', logPath,
            ])).resolves.toBeUndefined();
            const logs = readLog(logPath);
            expect(logs.find(r => r.action === 'hazardCombat:end')).toBeDefined();
        }
    });
});

describe('Combat CLI — auto mode per-play transcript (Gate 0 §2)', () => {
    it('--auto --json-events streams turn-by-turn events with engine payloads', async () => {
        const lines: string[] = [];
        const spy = vi.spyOn(process.stdout, 'write')
            .mockImplementation((chunk: unknown) => { lines.push(String(chunk)); return true; });
        try {
            await runCombatCli([
                '--auto', '--policy', 'status',
                '--enemy', 'little-belle',
                '--preset', 'apprentice',
                '--seed', '42',
                '--max-turns', '6',
                '--json-events',
            ]);
        } finally {
            spy.mockRestore();
        }
        const events = lines.join('').split('\n').filter(Boolean)
            .map(l => JSON.parse(l) as { type: string; payload?: Record<string, unknown> });
        const types = events.map(e => e.type);
        // The qualitative-audit transcript: one tray roll per phase, per-play
        // card events, and the phase resolutions — no bespoke harness needed.
        expect(types).toContain('hazardCombat:start');
        expect(types).toContain('hazardCombat:turnStart');
        expect(types).toContain('hazardCombat:card');
        expect(types).toContain('hazardCombat:resolvedPhase');
        expect(types).toContain('hazardCombat:end');
        const card = events.find(e => e.type === 'hazardCombat:card')!;
        expect(typeof card.payload?.cardId).toBe('string');
        expect(typeof card.payload?.useBottom).toBe('boolean');
        expect(Array.isArray(card.payload?.events)).toBe(true);
    });
});
