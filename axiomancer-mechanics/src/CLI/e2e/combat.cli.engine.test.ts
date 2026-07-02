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
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import {
    parseCombatArgv,
    runCombatCli,
} from '../combat.cli';
import { setStateLogPath } from '../io';

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
});

describe('Combat CLI — flag parsing', () => {
    it('parses new-combat flags', () => {
        const flags = parseCombatArgv([
            '--enemy', 'mournful-gull',
            '--preset', 'apprentice',
            '--seed', '42',
            '--auto',
            '--policy', 'status',
            '--max-turns', '6',
            '--json-events',
            '--state-log', 'trace.jsonl',
        ]);
        expect(flags).toMatchObject({
            enemySlug: 'mournful-gull',
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
        const flags = parseCombatArgv(['--enemy=wet-hound', '--auto']);
        expect(flags.enemySlug).toBe('wet-hound');
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
                '--enemy', 'mournful-gull',
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
        expect(['victory', 'defeat', 'mercy', 'retreat']).toContain(a.outcome);
    });

    it('records at least one phase record per run', async () => {
        const logPath = tmpPath('phases');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--enemy', 'mournful-gull',
            '--preset', 'apprentice',
            '--seed', '7',
            '--max-turns', '6',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const phases = logs.filter(r => r.action === 'hazardCombat:autoPhase');
        expect(phases.length).toBeGreaterThan(0);
    });

    it('all four auto policies complete without throwing', async () => {
        for (const policy of ['naive', 'safe', 'aggressive', 'status'] as const) {
            const logPath = tmpPath(`policy-${policy}`);
            await expect(runCombatCli([
                '--auto', '--policy', policy,
                '--enemy', 'wet-hound',
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
