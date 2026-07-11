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

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import {
    parseCombatArgv,
    runCombatCli,
} from '../combat.cli';
import { setStateLogPath, setOutputMode } from '../io';

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
    vi.restoreAllMocks();
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

    it('marks enemyExplicit only when --enemy was actually passed (phase 26)', () => {
        expect(parseCombatArgv([]).enemyExplicit).toBe(false);
        expect(parseCombatArgv(['--stage', 'early']).enemyExplicit).toBe(false);
        expect(parseCombatArgv(['--enemy', 'foot-stealer']).enemyExplicit).toBe(true);
        expect(parseCombatArgv(['--stage', 'early', '--enemy', 'foot-stealer']).enemyExplicit).toBe(true);
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

    it('the Turn Law holds through a full CLI auto run: at most one tray per resolved phase', async () => {
        const logPath = tmpPath('turn-law');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--enemy', 'little-belle',
            '--preset', 'apprentice',
            '--seed', '42',
            '--max-turns', '12',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const end = logs.find(r => r.action === 'hazardCombat:end');
        expect(end).toBeDefined();
        const after = end!.after as { log: Array<{ kind: string }>; phaseResults: unknown[] };
        const trayRolls = after.log.filter(e => e.kind === 'turn-dice-rolled').length;
        expect(trayRolls).toBeLessThanOrEqual(after.phaseResults.length + 1);
    });
});

describe('Combat CLI — phase 26: --stage defaults the enemy roster too', () => {
    it('--stage with no --enemy resolves to that stage roster\'s first slug, not little-belle', async () => {
        const logPath = tmpPath('stage-default-enemy');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--stage', 'early',
            '--seed', '5',
            '--max-turns', '4',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const start = logs.find(r => r.action === 'hazardCombat:start');
        const enemyName = (start!.after as { enemy: { name: string } }).enemy.name;
        expect(enemyName).toBe('Grave Larva'); // COMBAT_STAGE_PROFILES.early.enemySlugs[0]
        expect(enemyName).not.toBe('Little Belle');
    });

    it('an explicit --enemy still wins over the stage default', async () => {
        const logPath = tmpPath('stage-explicit-enemy');
        await runCombatCli([
            '--auto', '--policy', 'status',
            '--stage', 'early',
            '--enemy', 'little-belle',
            '--seed', '5',
            '--max-turns', '4',
            '--state-log', logPath,
        ]);
        const logs = readLog(logPath);
        const start = logs.find(r => r.action === 'hazardCombat:start');
        const enemyName = (start!.after as { enemy: { name: string } }).enemy.name;
        expect(enemyName).toBe('Little Belle');
    });
});

describe('Combat CLI — phase 26: auto mode emits a per-phase JSON transcript', () => {
    it('--json-events --auto emits hazardCombat:autoPhase between start and end', async () => {
        const written: string[] = [];
        vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string) => {
            written.push(String(chunk));
            return true;
        }) as typeof process.stdout.write);

        await runCombatCli([
            '--auto', '--policy', 'status', '--json-events',
            '--enemy', 'little-belle',
            '--preset', 'apprentice',
            '--seed', '42',
            '--max-turns', '12',
        ]);

        const events = written.map(w => JSON.parse(w.trim()));
        expect(events.some(e => e.type === 'hazardCombat:start')).toBe(true);
        expect(events.some(e => e.type === 'hazardCombat:autoPhase')).toBe(true);
        expect(events.some(e => e.type === 'hazardCombat:end')).toBe(true);
    });
});
